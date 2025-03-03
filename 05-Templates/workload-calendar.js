// simplified-workload-calendar.js
// A script to generate just the workload calendar graph for the upcoming month
module.exports = async function(params) {
  const { app, quickAddApi } = params;
  const moment = window.moment;
  
  const CONFIG = {
    // Daily hours configuration - hours available on each day of week
    // Sunday is 0, Monday is 1, ..., Saturday is 6
    dailyHours: {
      0: 0,  // Sunday: 0 hours
      1: 6,  // Monday: 6 hours
      2: 6,  // Tuesday: 6 hours
      3: 6,  // Wednesday: 6 hours
      4: 6,  // Thursday: 6 hours
      5: 6,  // Friday: 6 hours
      6: 0,  // Saturday: 0 hours
    },
    defaultTaskTime: 1,
    projectionDays: 90, // Number of days to show in the calendar
    barLength: 20,      // Length of the visual bar in the calendar
    includeTaskList: false // Set to true if you want to include the task list again
  };
  
  console.log("Starting simplified workload calendar generator...");
  
  try {
    // Helper function to validate a date
    function isValidDate(dateString) {
      if (!dateString) return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return false;
      const year = parseInt(dateString.substring(0, 4));
      return year >= 2000 && year <= 2050;
    }
    
    // Simple safe date operations
    function safeAddDays(date, days) {
      try {
        if (!isValidDate(date)) return moment().add(days, 'days').format('YYYY-MM-DD');
        return moment(date, "YYYY-MM-DD").add(days, 'days').format('YYYY-MM-DD');
      } catch (e) {
        return moment().add(days, 'days').format('YYYY-MM-DD');
      }
    }
    
    // Get available hours for a specific date
    function getAvailableHours(dateString) {
      try {
        if (!isValidDate(dateString)) return 6; // Default fallback
        
        const date = moment(dateString, "YYYY-MM-DD");
        const dayOfWeek = date.day(); // 0 = Sunday, 1 = Monday, etc.
        
        // If the day has a specific configuration, use it
        if (dayOfWeek in CONFIG.dailyHours) {
          return CONFIG.dailyHours[dayOfWeek];
        }
        
        // Otherwise, fall back to default
        return 6;
      } catch (e) {
        console.log(`Error getting available hours: ${e.message}`);
        return 6; // Default fallback
      }
    }
    
    const today = moment().format('YYYY-MM-DD');
    console.log(`Today's date: ${today}`);
    
    // Create workload map for the projection period
    const workloadMap = {};
    
    // Initialize days in workload map
    for (let i = 0; i < CONFIG.projectionDays; i++) {
      const date = safeAddDays(today, i);
      workloadMap[date] = {
        totalHours: 0,
        tasks: []
      };
    }
    
    // Get all tasks with due dates
    const allTasks = [];
    
    // Get all markdown files
    const markdownFiles = app.vault.getMarkdownFiles();
    console.log(`Found ${markdownFiles.length} markdown files to search for tasks`);
    
    // Process each file
    for (const file of markdownFiles) {
      try {
        // Skip files in the Templates folder
        if (file.path.startsWith("05-Templates/")) {
          continue;
        }
        
        // Skip files over 1MB to avoid performance issues
        const stat = await app.vault.adapter.stat(file.path);
        if (stat && stat.size > 1000000) {
          continue;
        }
    
        const content = await app.vault.read(file);
        
        // Use regex to find incomplete tasks with due dates
        const taskRegex = /- \[([ x])\] (.*?)(?=\n- \[|$)/gs;
        
        let match;
        while ((match = taskRegex.exec(content)) !== null) {
          const isCompleted = match[1] === 'x';
          const taskText = match[2].trim();
          
          // Skip empty or completed tasks
          if (!taskText || isCompleted) continue;
          
          // Extract due date if it exists (📅 YYYY-MM-DD format)
          let dueDate = null;
          const dueDateMatch = taskText.match(/📅 (\d{4}-\d{2}-\d{2})/);
          if (dueDateMatch && isValidDate(dueDateMatch[1])) {
            dueDate = dueDateMatch[1];
            
            // Only include tasks due within our projection period
            const lastProjectionDate = safeAddDays(today, CONFIG.projectionDays - 1);
            if (dueDate >= today && dueDate <= lastProjectionDate) {
              // Extract time estimate
              let timeEstimate = CONFIG.defaultTaskTime;
              
              // Look for #time followed by a space and then value
              const timeRegex = /#time\s+(\d+\.?\d*)([hm])/;
              const timeMatch = taskText.match(timeRegex);
              if (timeMatch) {
                const timeValue = timeMatch[1];
                const timeUnit = timeMatch[2];
                if (timeUnit === 'h') {
                  timeEstimate = parseFloat(timeValue);
                } else if (timeUnit === 'm') {
                  timeEstimate = parseFloat(timeValue) / 60;
                }
              }
              
              // Determine task criticality
              let criticality = 3; // Default to flexible
              const tagMatches = taskText.matchAll(/#([a-zA-Z0-9_-]+)/g);
              const tags = Array.from(tagMatches).map(m => m[1]);
              
              if (tags) {
                if (tags.includes("critical")) criticality = 1;
                else if (tags.includes("important")) criticality = 2;
              }
              
              // Add task to its due date in the workload map
              if (workloadMap[dueDate]) {
                workloadMap[dueDate].totalHours += timeEstimate;
                workloadMap[dueDate].tasks.push({
                  text: taskText,
                  time: timeEstimate,
                  criticality: criticality,
                  path: file.path
                });
              }
              
              allTasks.push({
                text: taskText,
                due: dueDate,
                time: timeEstimate,
                criticality: criticality,
                path: file.path
              });
            }
          }
        }
      } catch (e) {
        console.log(`Error processing file ${file.path}: ${e.message}`);
      }
    }
    
    console.log(`Found ${allTasks.length} tasks due in the next ${CONFIG.projectionDays} days`);
    
    // Generate the report
    const reportDate = moment().format('YYYY-MM-DD');
    const reportNotePath = `00-Dashboard/workload-calendar-${reportDate}.md`;
    
    let reportContent = `# Workload Calendar - ${reportDate}\n\n`;
    reportContent += `Upcoming ${CONFIG.projectionDays} days from ${today} to ${safeAddDays(today, CONFIG.projectionDays-1)}\n\n`;
    
    // Add workload calendar
    reportContent += `\`\`\`\n`;
    let currentMonth = '';
    
    // Generate the calendar view
    for (let i = 0; i < CONFIG.projectionDays; i++) {
      try {
        const date = safeAddDays(today, i);
        const dayLoad = workloadMap[date] ? workloadMap[date].totalHours : 0;
        const dailyHours = getAvailableHours(date);
        
        // Handle case where daily hours might be zero
        const dayPercent = dailyHours > 0 ? (dayLoad / dailyHours) * 100 : 0;
        
        const monthName = moment(date).format('MMMM');
        if (monthName !== currentMonth) {
          currentMonth = monthName;
          reportContent += `\n${currentMonth}\n`;
        }
        
        let loadBar = '';
        const barLength = CONFIG.barLength;
        const filledBars = Math.round((dayPercent / 100) * barLength);
        for (let j = 0; j < barLength; j++) {
          loadBar += j < filledBars ? '█' : '░';
        }
        
        const dayFormat = moment(date).format('DD ddd');
        const taskCount = workloadMap[date].tasks.length;
        reportContent += `${dayFormat}: ${loadBar} ${dayLoad.toFixed(1)}h / ${dailyHours}h (${dayPercent.toFixed(0)}%) - ${taskCount} tasks\n`;
      } catch (e) {
        console.log(`Error rendering calendar day: ${e.message}`);
      }
    }
    reportContent += `\`\`\`\n\n`;
    
    // Add task breakdown by day (optional, controlled by CONFIG.includeTaskList)
    if (CONFIG.includeTaskList) {
      reportContent += `## Tasks By Day\n`;
      
      const sortedDates = Object.keys(workloadMap).sort();
      for (const date of sortedDates) {
        if (workloadMap[date].tasks.length === 0) continue;
        
        reportContent += `\n### ${date} - ${moment(date).format('dddd')}\n`;
        reportContent += `Total workload: ${workloadMap[date].totalHours.toFixed(1)} hours\n\n`;
        
        // Sort tasks by criticality
        workloadMap[date].tasks.sort((a, b) => a.criticality - b.criticality);
        
        for (const task of workloadMap[date].tasks) {
          const criticalityLabel = task.criticality === 1 ? '🔴' : 
                                 task.criticality === 2 ? '🟠' : '🟢';
          reportContent += `- ${criticalityLabel} ${task.text.substring(0, 80)}${task.text.length > 80 ? '...' : ''} (${task.time}h)\n`;
        }
      }
    }
    
    // Add configuration section
    reportContent += `## Configuration\n`;
    reportContent += `- Daily hours:\n`;
    reportContent += `  - Sunday: ${CONFIG.dailyHours[0]}h\n`;
    reportContent += `  - Monday: ${CONFIG.dailyHours[1]}h\n`;
    reportContent += `  - Tuesday: ${CONFIG.dailyHours[2]}h\n`;
    reportContent += `  - Wednesday: ${CONFIG.dailyHours[3]}h\n`;
    reportContent += `  - Thursday: ${CONFIG.dailyHours[4]}h\n`;
    reportContent += `  - Friday: ${CONFIG.dailyHours[5]}h\n`;
    reportContent += `  - Saturday: ${CONFIG.dailyHours[6]}h\n`;
    reportContent += `- Default task time: ${CONFIG.defaultTaskTime}h\n`;
    
    // Create report note
    try {
      // Create Dashboard folder if it doesn't exist
      const dashboardFolder = app.vault.getAbstractFileByPath("00-Dashboard");
      if (!dashboardFolder) {
        await app.vault.createFolder("00-Dashboard");
      }
      
      await app.vault.create(reportNotePath, reportContent);
      
      // Open the report
      const reportFile = app.vault.getAbstractFileByPath(reportNotePath);
      if (reportFile) {
        app.workspace.getLeaf().openFile(reportFile);
      }
      
      console.log(`Workload calendar generated successfully at ${reportNotePath}`);
    } catch (e) {
      console.error(`Error creating report: ${e.message}`);
    }
    
  } catch (e) {
    console.error(`Error with the script: ${e.message}`);
    console.error(e.stack); // Add stack trace for better debugging
  }
}