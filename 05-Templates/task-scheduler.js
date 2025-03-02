// bulletproof-task-scheduler.js
module.exports = async function(params) {
  const { app, quickAddApi } = params;
  const moment = window.moment;
  
  // Configuration
  const CONFIG = {
    hoursPerDay: 6, 
    defaultTaskTime: 1,
    autoDateTag: "#autodate",
    sequenceTag: "#seq", // Tag to mark sequential tasks
    sequencePrefixRegex: /^\[(\d+)\]/, // Format: [1] First task, [2] Second task
    criticalityWeights: {
      "1": 3,
      "2": 2,
      "3": 1
    },
    bufferPercent: 0.8,
    maxPlanningDays: 90, // Maximum days to plan ahead (reduced from 120)
    maxProjectionDays: 30,  // Maximum days to show in the report (reduced from 60)
    maxTasksPerGroup: 20,   // Safety limit for sequence groups
    maxIterations: 500     // Safety limit to prevent infinite loops (reduced from 1000)
  };
  
  console.log("Starting task scheduler...");
  
  try {
    // Helper function to validate a date
    function isValidDate(dateString) {
      if (!dateString) return false;
      
      // Basic format validation for YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
      
      // Check if it's a valid date
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return false;
      
      // Check if date is in a reasonable range (between 2000 and 2050)
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
    
    const today = moment().format('YYYY-MM-DD');
    console.log(`Today's date: ${today}`);
    
    // Get all tasks with timeout protection
    const allTasks = [];
    
    // Get all markdown files
    const markdownFiles = app.vault.getMarkdownFiles();
    console.log(`Found ${markdownFiles.length} markdown files to search for tasks`);
    
	// Process each file with timeout protection
	for (const file of markdownFiles) {
	  try {
		// Skip files in the Templates folder
		if (file.path.startsWith("05-Templates/")) {
		  console.log(`Skipping template file: ${file.path}`);
		  continue;
		}
		
		// Skip files over 1MB to avoid performance issues
		const stat = await app.vault.adapter.stat(file.path);
		if (stat && stat.size > 1000000) {
		  console.log(`Skipping large file ${file.path} (${Math.round(stat.size/1024)}KB)`);
		  continue;
		}
    
    // Rest of file processing code...
        
        const content = await app.vault.read(file);
        
        // Use regex to find tasks
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
          }
          
          // Extract tags
          const tagMatches = taskText.matchAll(/#([a-zA-Z0-9_-]+)/g);
          const tags = Array.from(tagMatches).map(m => m[1]);
          
          // Create task object
          allTasks.push({
            text: taskText,
            completed: isCompleted,
            path: file.path,
            due: dueDate,
            tags: tags,
            originalText: match[0].trim() // Keep the full original text including the checkbox
          });
        }
      } catch (e) {
        console.log(`Error processing file ${file.path}: ${e.message}`);
      }
    }
    
    console.log(`Found ${allTasks.length} total tasks in your vault`);
    
    // Create workload map
    const workloadMap = {};
    
    // Initialize next planning days in workload map
    for (let i = 0; i < CONFIG.maxPlanningDays; i++) {
      const date = safeAddDays(today, i);
      workloadMap[date] = {
        totalHours: 0,
        tasks: []
      };
    }
    
    // Sort tasks into categories
    const tasksWithDeadlines = [];
    const tasksToSchedule = [];
    const sequentialTaskGroups = {};
    
    for (const task of allTasks) {
      // Extract time estimate
      let timeEstimate = CONFIG.defaultTaskTime;
      
      // Look for #time followed by a space and then value
      const timeRegex = /#time\s+(\d+\.?\d*)([hm])/;
      const timeMatch = task.text.match(timeRegex);
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
      if (task.tags) {
        if (task.tags.includes("critical")) criticality = 1;
        else if (task.tags.includes("important")) criticality = 2;
      }
      
      // Create task object with common properties
      const taskObj = {
        text: task.text,
        time: timeEstimate,
        criticality: criticality,
        path: task.path,
        originalText: task.originalText,
        projectPath: task.path.includes("01-Projects/") ? task.path.split("/")[1] : null
      };
      
      // Check if task is part of a sequence
      const isSequential = task.tags && task.tags.includes("seq");
      let sequenceMatch = null;
      if (task.text) {
        sequenceMatch = task.text.match(CONFIG.sequencePrefixRegex);
      }
      
      if (isSequential && sequenceMatch) {
        // Extract sequence number and group identifier (project or area path)
        const sequenceNumber = parseInt(sequenceMatch[1]);
        const groupId = task.path;
        
        // Initialize group if needed
        if (!sequentialTaskGroups[groupId]) {
          sequentialTaskGroups[groupId] = [];
        }
        
        // Add task to its sequence group (with safety limit)
        if (sequentialTaskGroups[groupId].length < CONFIG.maxTasksPerGroup) {
          sequentialTaskGroups[groupId].push({
            ...taskObj,
            sequenceNumber: sequenceNumber,
            due: task.due,
            // This is for sequential tasks that already have dates
            hasFixedDate: task.due && !task.tags.includes("autodate")
          });
        }
      }
      // Handle non-sequential tasks as before
      else if (task.due && !task.tags.includes("autodate")) {
        if (workloadMap[task.due]) {
          workloadMap[task.due].totalHours += timeEstimate;
          workloadMap[task.due].tasks.push({
            text: task.text,
            time: timeEstimate,
            criticality: criticality
          });
        }
        tasksWithDeadlines.push({
          ...taskObj,
          due: task.due
        });
      } // FIX: only reschedule tasks with the "autodate" tag if they also have a "reschedule" tag
		else if ((!task.due && !task.tags.includes("autodate")) || 
         (task.due && task.tags.includes("autodate") && task.tags.includes("reschedule"))) {
	  tasksToSchedule.push(taskObj);
	}
    }
    
    console.log(`Found ${tasksWithDeadlines.length} tasks with deadlines and ${tasksToSchedule.length} tasks to schedule`);
	// Process sequential task groups
    const sequentialTasksToSchedule = [];
    
    // For each group of sequential tasks
    for (const groupId in sequentialTaskGroups) {
      try {
        const group = sequentialTaskGroups[groupId];
        
        // Skip empty groups
        if (!group || group.length === 0) continue;
        
        console.log(`Processing sequence group: ${groupId} with ${group.length} tasks`);
        
        // Sort by sequence number
        group.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
        
        // Find project deadline if available
        let projectDeadline = null;
        if (group[0] && group[0].projectPath) {
          // Try to find project file and extract deadline
          const projectFilePath = `01-Projects/${group[0].projectPath}`;
          try {
            const projectFile = app.vault.getAbstractFileByPath(projectFilePath);
            if (projectFile) {
              const content = await app.vault.read(projectFile);
              const deadlineMatch = content.match(/deadline: (\d{4}-\d{2}-\d{2})/);
              if (deadlineMatch && isValidDate(deadlineMatch[1])) {
                projectDeadline = deadlineMatch[1];
                console.log(`Found project deadline: ${projectDeadline} for sequence group ${groupId}`);
              }
            }
          } catch (e) {
            console.log(`Could not read project file for sequence group ${groupId}: ${e.message}`);
          }
        }
        
        // Calculate total time needed for all tasks in sequence
        const totalSequenceTime = group.reduce((sum, task) => sum + task.time, 0);
        
        // Find the earliest fixed date in the sequence if any exist
        let earliestFixedDate = null;
        let earliestFixedDateTaskIndex = -1;
        
        for (let i = 0; i < group.length; i++) {
          if (group[i].hasFixedDate && group[i].due && isValidDate(group[i].due)) {
            if (!earliestFixedDate || moment(group[i].due).isBefore(moment(earliestFixedDate))) {
              earliestFixedDate = group[i].due;
              earliestFixedDateTaskIndex = i;
            }
          }
        }
        
        // Calculate time needed for tasks before the earliest fixed date
        let timeBeforeFixed = 0;
        if (earliestFixedDateTaskIndex > 0) {
          for (let i = 0; i < earliestFixedDateTaskIndex; i++) {
            timeBeforeFixed += group[i].time;
          }
        }
        
        // Determine how many days we need for tasks before fixed date
        const daysNeededBefore = Math.max(1, Math.min(30, Math.ceil(timeBeforeFixed / (CONFIG.hoursPerDay * CONFIG.bufferPercent))));
        
        // Calculate starting date for the sequence
        let sequenceStartDate = today;
        
        if (earliestFixedDate && isValidDate(earliestFixedDate)) {
          // Start by working backwards from the fixed date
          try {
            const fixedDate = moment(earliestFixedDate, "YYYY-MM-DD");
            sequenceStartDate = fixedDate.clone().subtract(daysNeededBefore, 'days').format('YYYY-MM-DD');
            
            // But don't start before today
            if (moment(sequenceStartDate).isBefore(moment(today))) {
              sequenceStartDate = today;
            }
          } catch (e) {
            console.log(`Error calculating sequence start date from fixed date: ${e.message}`);
            sequenceStartDate = today;
          }
        } else if (projectDeadline && isValidDate(projectDeadline)) {
          // If no fixed date but project has deadline, work backwards from deadline
          try {
            const daysNeeded = Math.max(1, Math.min(30, Math.ceil(totalSequenceTime / (CONFIG.hoursPerDay * CONFIG.bufferPercent))));
            const deadlineDate = moment(projectDeadline, "YYYY-MM-DD");
            sequenceStartDate = deadlineDate.clone().subtract(daysNeeded, 'days').format('YYYY-MM-DD');
            
            // But don't start before today
            if (moment(sequenceStartDate).isBefore(moment(today))) {
              sequenceStartDate = today;
            }
          } catch (e) {
            console.log(`Error calculating sequence start date from project deadline: ${e.message}`);
            sequenceStartDate = today;
          }
        }
        
        console.log(`Sequence group ${groupId} will start on ${sequenceStartDate}`);
        
        // Now schedule each task in the sequence
        let currentDate = sequenceStartDate;
        let iterationCounter = 0;
        
        for (let i = 0; i < group.length; i++) {
          const task = group[i];
          
          // Skip tasks that already have fixed dates
          if (task.hasFixedDate && task.due && isValidDate(task.due)) {
            try {
              currentDate = safeAddDays(task.due, 1);
            } catch (e) {
              console.log(`Error adding days to fixed date: ${e.message}`);
              currentDate = safeAddDays(today, i + 1);
            }
            continue;
          }
          
          // Check if currentDate has enough capacity
          iterationCounter = 0; // Reset counter for each task
          while (workloadMap[currentDate] && 
                workloadMap[currentDate].totalHours + task.time > CONFIG.hoursPerDay * CONFIG.bufferPercent) {
            // Safety check to prevent infinite loops
            iterationCounter++;
            if (iterationCounter > CONFIG.maxIterations) {
              console.log(`Warning: Maximum iterations reached when scheduling task. Using emergency date assignment.`);
              // Emergency fallback - just assign it to a date 1 week out per task position
              currentDate = safeAddDays(today, 7 + i * 2);
              break;
            }
            
            // Move to next day if current day is full
            try {
              currentDate = safeAddDays(currentDate, 1);
            } catch (e) {
              console.log(`Error adding days for capacity check: ${e.message}`);
              currentDate = safeAddDays(today, i + 1);
              break;
            }
            
            // Initialize this date in workload map if needed
            if (!workloadMap[currentDate]) {
              workloadMap[currentDate] = { totalHours: 0, tasks: [] };
            }
          }
          
          // Schedule task for current date
          task.scheduledDate = currentDate;
          
          // Update workload map
          if (!workloadMap[currentDate]) {
            workloadMap[currentDate] = { totalHours: 0, tasks: [] };
          }
          workloadMap[currentDate].totalHours += task.time;
          workloadMap[currentDate].tasks.push(task);
          
          // Add to list of tasks to update
          sequentialTasksToSchedule.push(task);
          
          // Move to next day for next task
          try {
            currentDate = safeAddDays(currentDate, 1);
          } catch (e) {
            console.log(`Error adding day for next task: ${e.message}`);
            currentDate = safeAddDays(today, i + 2);
          }
          
          // Initialize this date in workload map if needed
          if (!workloadMap[currentDate] && i < group.length - 1) {
            workloadMap[currentDate] = { totalHours: 0, tasks: [] };
          }
        }
      } catch (error) {
        console.error(`Error processing sequence group ${groupId}:`, error);
      }
    }
    
    console.log(`Found ${Object.keys(sequentialTaskGroups).length} sequential task groups with ${sequentialTasksToSchedule.length} tasks to schedule`);
    
    // For project tasks, check if project has deadline
    for (const task of tasksToSchedule) {
      if (task.projectPath) {
        // Try to find project file and extract deadline
        const projectFilePath = `01-Projects/${task.projectPath}`;
        try {
          const projectFile = app.vault.getAbstractFileByPath(projectFilePath);
          if (projectFile) {
            const content = await app.vault.read(projectFile);
            const deadlineMatch = content.match(/deadline: (\d{4}-\d{2}-\d{2})/);
            if (deadlineMatch && isValidDate(deadlineMatch[1])) {
              task.projectDeadline = deadlineMatch[1];
            }
          }
        } catch (e) {
          console.log(`Could not read project file for ${task.text}: ${e.message}`);
        }
      }
    }
    
    // Sort non-sequential tasks
    tasksToSchedule.sort((a, b) => {
      // First compare criticality
      if (a.criticality !== b.criticality) {
        return a.criticality - b.criticality;
      }
      
      // Then compare project deadlines
      if (a.projectDeadline && b.projectDeadline && isValidDate(a.projectDeadline) && isValidDate(b.projectDeadline)) {
        try {
          return moment(a.projectDeadline).diff(moment(b.projectDeadline));
        } catch (e) {
          return 0;
        }
      } else if (a.projectDeadline && isValidDate(a.projectDeadline)) {
        return -1;
      } else if (b.projectDeadline && isValidDate(b.projectDeadline)) {
        return 1;
      }
      
      // Lastly, prioritize longer tasks
      return b.time - a.time;
    });
    
    // Schedule non-sequential tasks with safety limits
    const scheduledTasks = [];
    let schedulingCounter = 0; // Global counter to prevent infinite loops
    
    for (const task of tasksToSchedule) {
      try {
        let bestDate = null;
        let bestScore = -Infinity;
        
        // Define scheduling horizon - limit to avoid performance issues
        let schedulingHorizon = 30; // Reduced from 60 for performance
        
        if (task.projectDeadline && isValidDate(task.projectDeadline)) {
          try {
            const daysUntilDeadline = moment(task.projectDeadline).diff(moment(today), 'days');
            schedulingHorizon = Math.min(Math.max(daysUntilDeadline, 1), 30);
          } catch (e) {
            console.log(`Error calculating days until deadline: ${e.message}`);
          }
        }
        
        // Safety limit for iterations
        schedulingCounter++;
        if (schedulingCounter > 500) { // Reduced from 1000
          console.log("Warning: Scheduler reached maximum iterations, stopping scheduling process");
          break;
        }
        
        // Look through each potential day (limit to reasonable range)
        for (let i = 0; i < Math.min(schedulingHorizon, 30); i++) {
          try {
            const date = safeAddDays(today, i);
            const dayLoad = workloadMap[date] ? workloadMap[date].totalHours : 0;
            
            // Skip overloaded days
            if (dayLoad >= CONFIG.hoursPerDay * CONFIG.bufferPercent) continue;
            
            // Calculate score
            const closenessScore = (schedulingHorizon - i) / schedulingHorizon * 10;
            const capacityScore = (CONFIG.hoursPerDay * CONFIG.bufferPercent - dayLoad) / CONFIG.hoursPerDay * 10;
            const criticalityWeight = CONFIG.criticalityWeights[task.criticality] || 1;
            
            const score = closenessScore + capacityScore * criticalityWeight;
            
            if (score > bestScore) {
              bestScore = score;
              bestDate = date;
            }
          } catch (e) {
            console.log(`Error in day evaluation: ${e.message}`);
          }
        }
        
        // If no date found, assign a default one
        if (!bestDate) {
          bestDate = safeAddDays(today, 7); // Default to a week from now
        }
        
        // Schedule task
        if (!workloadMap[bestDate]) {
          workloadMap[bestDate] = { totalHours: 0, tasks: [] };
        }
        workloadMap[bestDate].totalHours += task.time;
        workloadMap[bestDate].tasks.push(task);
        
        // Add to scheduled tasks
        scheduledTasks.push({
          ...task,
          scheduledDate: bestDate
        });
      } catch (error) {
        console.error(`Error scheduling task ${task.text}:`, error);
      }
    }
    
    // Combine all tasks that need updating
    const allScheduledTasks = [...sequentialTasksToSchedule, ...scheduledTasks];
    
    console.log(`Total scheduled tasks: ${allScheduledTasks.length} (${sequentialTasksToSchedule.length} sequential, ${scheduledTasks.length} non-sequential)`);
	// Update task dates in files
    let updatedTasks = 0;
    const maxUpdatesPerRun = 50; // Limit file updates for performance
    
    for (const task of allScheduledTasks) {
      try {
        if (!task.scheduledDate) continue;
        
        // Safety check to limit the number of updates per run
        if (updatedTasks >= maxUpdatesPerRun) {
          console.log(`Reached maximum updates per run (${maxUpdatesPerRun}). Remaining tasks will be scheduled in a future run.`);
          break;
        }
        
        const file = app.vault.getAbstractFileByPath(task.path);
        if (!file) {
          console.log(`Could not find file for task: ${task.text} at path: ${task.path}`);
          continue;
        }
        
        const content = await app.vault.read(file);
        
        // Skip files over 100KB to avoid performance issues with replacements
        if (content.length > 100000) {
          console.log(`Skipping large file for task updates: ${task.path} (${Math.round(content.length/1024)}KB)`);
          continue;
        }
        
        // Build new task text
        let newTaskText = task.originalText;
        
        // Add or update due date
        if (newTaskText.includes('📅')) {
          newTaskText = newTaskText.replace(/📅 \d{4}-\d{2}-\d{2}/, `📅 ${task.scheduledDate}`);
        } else {
          // Find where to insert the due date (before any newline)
          const insertPoint = newTaskText.indexOf('\n');
          if (insertPoint !== -1) {
            newTaskText = newTaskText.substring(0, insertPoint) + ` 📅 ${task.scheduledDate}` + newTaskText.substring(insertPoint);
          } else {
            newTaskText += ` 📅 ${task.scheduledDate}`;
          }
        }
        
        // Add autodate tag if not present
        if (!newTaskText.includes('#autodate')) {
          // Find where to insert the tag (before any newline)
          const insertPoint = newTaskText.indexOf('\n');
          if (insertPoint !== -1) {
            newTaskText = newTaskText.substring(0, insertPoint) + ` #autodate` + newTaskText.substring(insertPoint);
          } else {
            newTaskText += ` #autodate`;
          }
        }
        
        // Replace the task in the file
        // Use a more precise approach to avoid partial replacements
        if (content.includes(task.originalText)) {
          const updatedContent = content.replace(task.originalText, newTaskText);
          
          if (updatedContent !== content) {
            await app.vault.modify(file, updatedContent);
            updatedTasks++;
          }
        } else {
          console.log(`Could not find original task text in file: ${task.originalText}`);
        }
      } catch (error) {
        console.error(`Error updating task ${task.text}: ${error.message}`);
      }
    }
    
    // Create report
    const reportDate = moment().format('YYYY-MM-DD');
    const reportNotePath = `00-Dashboard/scheduled-tasks-${reportDate}.md`;
    
    let reportContent = `# Task Scheduling Report - ${reportDate}\n\n`;
    reportContent += `## Summary\n`;
    reportContent += `- Analyzed ${allTasks.length} total tasks\n`;
    reportContent += `- ${tasksWithDeadlines.length} tasks had fixed deadlines\n`;
    reportContent += `- ${Object.keys(sequentialTaskGroups).length} sequential task groups with ${sequentialTasksToSchedule.length} tasks\n`;
    reportContent += `- ${tasksToSchedule.length} individual tasks needed scheduling\n`;
    reportContent += `- Successfully scheduled ${allScheduledTasks.length} tasks\n`;
    reportContent += `- Updated ${updatedTasks} tasks with new dates\n\n`;
    
    if (updatedTasks < allScheduledTasks.length) {
      reportContent += `**Note:** Only updated ${updatedTasks} out of ${allScheduledTasks.length} scheduled tasks to prevent performance issues. Run the scheduler again to update the remaining tasks.\n\n`;
    }
    
    // Group tasks by date for the report
    const tasksByDate = {};
    for (const task of allScheduledTasks) {
      if (!task.scheduledDate) continue;
      
      if (!tasksByDate[task.scheduledDate]) {
        tasksByDate[task.scheduledDate] = [];
      }
      tasksByDate[task.scheduledDate].push(task);
    }
    
    // Add sequential groups section - only if there aren't too many
    if (Object.keys(sequentialTaskGroups).length > 0 && Object.keys(sequentialTaskGroups).length <= 10) {
      reportContent += `## Sequential Task Groups\n\n`;
      
      // Limit to first 5 groups for performance
      const groupIds = Object.keys(sequentialTaskGroups).slice(0, 5);
      const hiddenGroups = Math.max(0, Object.keys(sequentialTaskGroups).length - 5);
      
      for (const groupId of groupIds) {
        const group = sequentialTaskGroups[groupId];
        const groupName = groupId.split('/').pop() || groupId;
        
        reportContent += `### ${groupName}\n`;
        reportContent += `- Contains ${group.length} tasks in sequence\n`;
        reportContent += `- Total time: ${group.reduce((sum, task) => sum + task.time, 0).toFixed(1)} hours\n\n`;
        
        // Limit to 10 tasks per group in the report
        const displayTasks = group.slice(0, 10);
        const hiddenCount = Math.max(0, group.length - 10);
        
        for (const task of displayTasks) {
          const dateInfo = task.hasFixedDate ? 
            `📌 Fixed: ${task.due}` : 
            (task.scheduledDate ? `📅 Scheduled: ${task.scheduledDate}` : "⚠️ Not scheduled");
            
          reportContent += `- [${task.sequenceNumber}] ${task.text.substring(0, 100)}${task.text.length > 100 ? '...' : ''} (${task.time}h) - ${dateInfo}\n`;
        }
        
        if (hiddenCount > 0) {
          reportContent += `- ... and ${hiddenCount} more tasks\n`;
        }
        
        reportContent += `\n`;
      }
      
      if (hiddenGroups > 0) {
        reportContent += `**Note:** ${hiddenGroups} more sequence groups are not shown in this report.\n\n`;
      }
    }
    
    // Add task schedule by date
    reportContent += `## Scheduled Tasks\n`;
	// Only include dates in the report up to maxProjectionDays
	const maxReportDate = moment(today).add(CONFIG.maxProjectionDays, 'days').format('YYYY-MM-DD');
	const sortedDates = Object.keys(tasksByDate)
	  .filter(date => date <= maxReportDate)
	  .sort();

	// Limit to first 20 days for performance  
	const displayDates = sortedDates.slice(0, 20);
	const hiddenDaysCount = Math.max(0, sortedDates.length - 20);
	  
	for (const date of displayDates) {
	  reportContent += `\n### ${date} - ${moment(date).format('dddd')}\n`;
	  
	  // Add a safety check
	  if (!workloadMap[date]) {
		reportContent += `No workload data available for this date.\n\n`;
		continue;
	  }
	  
	  reportContent += `Total workload: ${workloadMap[date].totalHours.toFixed(1)} hours\n\n`;
	  
	  // Check if tasksByDate has entries for this date
	  if (!tasksByDate[date] || tasksByDate[date].length === 0) {
		reportContent += `No scheduled tasks for this date.\n\n`;
		continue;
	  }
 
      // Group by sequential and non-sequential
      const sequentialTasks = tasksByDate[date].filter(t => t.originalText && t.originalText.match(CONFIG.sequencePrefixRegex));
      const regularTasks = tasksByDate[date].filter(t => !t.originalText || !t.originalText.match(CONFIG.sequencePrefixRegex));
      
      if (sequentialTasks.length > 0) {
        reportContent += `**Sequential Tasks:**\n`;
        
        // Limit to 5 tasks per day in the report
        const displaySeqTasks = sequentialTasks.slice(0, 5);
        const hiddenSeqCount = Math.max(0, sequentialTasks.length - 5);
        
        for (const task of displaySeqTasks) {
          reportContent += `- [${task.criticality === 1 ? 'Critical' : task.criticality === 2 ? 'Important' : 'Flexible'}] ${task.text.substring(0, 80)}${task.text.length > 80 ? '...' : ''} (${task.time}h)\n`;
        }
        
        if (hiddenSeqCount > 0) {
          reportContent += `- ... and ${hiddenSeqCount} more sequential tasks\n`;
        }
        
        reportContent += `\n`;
      }
      
      if (regularTasks.length > 0) {
        reportContent += `**Regular Tasks:**\n`;
        
        // Limit to 5 tasks per day in the report
        const displayRegTasks = regularTasks.slice(0, 5);
        const hiddenRegCount = Math.max(0, regularTasks.length - 5);
        
        for (const task of displayRegTasks) {
          reportContent += `- [${task.criticality === 1 ? 'Critical' : task.criticality === 2 ? 'Important' : 'Flexible'}] ${task.text.substring(0, 80)}${task.text.length > 80 ? '...' : ''} (${task.time}h)\n`;
        }
        
        if (hiddenRegCount > 0) {
          reportContent += `- ... and ${hiddenRegCount} more regular tasks\n`;
        }
      }
    }
    
    if (hiddenDaysCount > 0) {
      reportContent += `\n**Note:** ${hiddenDaysCount} more days with scheduled tasks are not shown in this report.\n`;
    }
    
    // Add workload calendar
    reportContent += `\n## Workload Calendar\n`;
    reportContent += `\`\`\`\n`;
    let currentMonth = '';
    
    // Limit the calendar view to maxProjectionDays (but max 30 days)
    for (let i = 0; i < Math.min(CONFIG.maxProjectionDays, 30); i++) {
      try {
        const date = safeAddDays(today, i);
        const dayLoad = workloadMap[date] ? workloadMap[date].totalHours : 0;
        const dayPercent = (dayLoad / CONFIG.hoursPerDay) * 100;
        
        const monthName = moment(date).format('MMMM');
        if (monthName !== currentMonth) {
          currentMonth = monthName;
          reportContent += `\n${currentMonth}\n`;
        }
        
        let loadBar = '';
        const barLength = 20;
        const filledBars = Math.round((dayPercent / 100) * barLength);
        for (let j = 0; j < barLength; j++) {
          loadBar += j < filledBars ? '█' : '░';
        }
        
        const dayFormat = moment(date).format('DD ddd');
        reportContent += `${dayFormat}: ${loadBar} ${dayLoad.toFixed(1)}h / ${CONFIG.hoursPerDay}h (${dayPercent.toFixed(0)}%)\n`;
      } catch (e) {
        console.log(`Error rendering calendar day: ${e.message}`);
      }
    }
    reportContent += `\`\`\`\n`;
    
    // Add configuration
    reportContent += `\n## Configuration Used\n`;
    reportContent += `- Hours per day: ${CONFIG.hoursPerDay}\n`;
    reportContent += `- Default task time: ${CONFIG.defaultTaskTime}h\n`;
    reportContent += `- Buffer: ${CONFIG.bufferPercent * 100}%\n`;
    reportContent += `- Maximum planning days: ${CONFIG.maxPlanningDays}\n`;
    reportContent += `- Maximum projection days in report: ${CONFIG.maxProjectionDays}\n`;
    reportContent += `- Sequential task tag: ${CONFIG.sequenceTag}\n`;
    reportContent += `- Sequential task format: [number] Task description\n`;
    
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
    } catch (e) {
      console.error(`Error creating report: ${e.message}`);
    }
    
    console.log(`Task scheduling complete. Updated ${updatedTasks} tasks.`);
    
  } catch (error) {
    console.error("Error in task scheduler:", error);
  }
}