<%*
// Sick Day Template with Full Vault Task Rescheduling
const today = tp.date.now("YYYY-MM-DD");
const tomorrow = tp.date.tomorrow("YYYY-MM-DD");

// Initialize counters
let rescheduledCount = 0;
let keptCount = 0;

// Folders to scan for tasks
const foldersToScan = ["06-Daily", "01-Projects", "02-Areas"];
let rescheduledTasks = [];
let criticalTasks = [];

// Process each folder
for (const folderPath of foldersToScan) {
    const folder = app.vault.getAbstractFileByPath(folderPath);
    if (!folder || !folder.children) continue;
    
    // Process all files in the folder
    for (const file of folder.children) {
        // Skip non-markdown files
        if (file.extension !== "md") continue;
        
        // Read the file content
        const content = await app.vault.read(file);
        
        // Find tasks in the file
        const taskRegex = /- \[([ x])\] (.*?)(?:\n|$)/g;
        let match;
        let updatedContent = content;
        
        // Process each task
        while ((match = taskRegex.exec(content)) !== null) {
            const taskText = match[2];
            const isCompleted = match[1] === 'x';
            
            // Skip completed tasks
            if (isCompleted) continue;
            
            // Check if task is due today
            const dueTodayRegex = new RegExp(`📅 ${today}`);
            if (!dueTodayRegex.test(taskText)) continue;
            
            // Check if task is critical
            if (taskText.includes('#critical')) {
                keptCount++;
                criticalTasks.push({text: taskText, source: file.basename});
                continue;
            }
            
            // Reschedule non-critical task to tomorrow
            const updatedTaskText = taskText.replace(/📅 \d{4}-\d{2}-\d{2}/, `📅 ${tomorrow}`);
            updatedContent = updatedContent.replace(taskText, updatedTaskText);
            rescheduledCount++;
            rescheduledTasks.push({text: updatedTaskText, source: file.basename});
        }
        
        // Update the file with rescheduled tasks
        if (updatedContent !== content) {
            await app.vault.modify(file, updatedContent);
        }
    }
}

// Create message for the sick day note
let message = `# Sick Day - ${today}\n\n`;
message += `You've activated the Sick Day protocol.\n\n`;

// Add details to the sick day note
message += `Tasks processed across Projects, Areas, and Daily notes:\n`;
message += `- Rescheduled ${rescheduledCount} non-critical tasks to tomorrow\n`;
message += `- Kept ${keptCount} critical tasks for today\n\n`;

if (rescheduledTasks.length > 0) {
    message += `## Rescheduled Tasks\n`;
    for (const task of rescheduledTasks) {
        message += `- ${task.text} (from ${task.source})\n`;
    }
    message += `\n`;
}

message += `Rest and recover. Only address critical tasks if you're able.\n\n`;
message += `## Remaining Critical Tasks\n\`\`\`tasks\nnot done\ndue today\ntags includes critical\n\`\`\`\n`;

// Create the sick day note
await tp.file.create_new(message, `${today}-sick-day.md`, true, app.vault.getAbstractFileByPath("06-Daily"));

// Show notification
new Notice(`Sick Day protocol activated. Rescheduled ${rescheduledCount} tasks. ${keptCount} critical tasks remain.`);
%>