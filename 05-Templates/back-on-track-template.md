<%*
// Get Back on Track Template with Full Vault Scanning
const today = tp.date.now("YYYY-MM-DD");
const tomorrow = tp.date.tomorrow("YYYY-MM-DD");
const dayAfter = tp.date.now("YYYY-MM-DD", 2);

// Initialize counters
let overdueCount = 0;
let rescheduledToday = 0;
let rescheduledTomorrow = 0;
let rescheduledLater = 0;

// Folders to scan for tasks
const foldersToScan = ["06-Daily", "01-Projects", "02-Areas"];

// Track all tasks we've processed
let criticalRescheduled = [];
let importantRescheduled = [];
let flexibleRescheduled = [];

// Process each folder
for (const folderPath of foldersToScan) {
    const folder = app.vault.getAbstractFileByPath(folderPath);
    if (!folder || !folder.children) continue;
    
    // Process all files in the folder
    for (const file of folder.children) {
        // Skip non-markdown files or files with "sick-day" or "reset" in name
        if (file.extension !== "md" || file.basename.includes("sick-day") || file.basename.includes("reset")) continue;
        
        // For daily notes, only process past dates
        if (folderPath === "06-Daily" && file.basename >= today) continue;
        
        // Read the file content
        const content = await app.vault.read(file);
        
        // Find incomplete tasks in the file
        const taskRegex = /- \[ \] (.*?)(?:\n|$)/g;
        let match;
        let updatedContent = content;
        
        // Process each task
        while ((match = taskRegex.exec(content)) !== null) {
            const taskText = match[1];
            
            // Check if task has a due date that's in the past
            const dueDateRegex = /📅 (\d{4}-\d{2}-\d{2})/;
            const dueDateMatch = taskText.match(dueDateRegex);
            
            if (dueDateMatch && dueDateMatch[1] < today) {
                // It's an overdue task
                overdueCount++;
                
                // Determine new due date based on criticality
                let newDueDate = today; // Default to today
                
                if (taskText.includes('#critical')) {
                    // Critical tasks come to today
                    newDueDate = today;
                    criticalRescheduled.push({text: taskText, source: file.basename});
                    rescheduledToday++;
                } else if (taskText.includes('#important')) {
                    // Important tasks go to tomorrow
                    newDueDate = tomorrow;
                    importantRescheduled.push({text: taskText, source: file.basename});
                    rescheduledTomorrow++;
                } else {
                    // Flexible tasks go to day after tomorrow
                    newDueDate = dayAfter;
                    flexibleRescheduled.push({text: taskText, source: file.basename});
                    rescheduledLater++;
                }
                
                // Update the task's due date
                const updatedTaskText = taskText.replace(/📅 \d{4}-\d{2}-\d{2}/, `📅 ${newDueDate}`);
                updatedContent = updatedContent.replace(taskText, updatedTaskText);
            }
        }
        
        // Update the file with rescheduled tasks
        if (updatedContent !== content) {
            await app.vault.modify(file, updatedContent);
        }
    }
}

// Add summary to the reset note
let message = `# Get Back on Track - ${today}\n\n`;
message += `You've activated the Get Back on Track protocol.\n\n`;

message += `## Recovery Summary\n`;
message += `- Found ${overdueCount} overdue tasks across Projects, Areas, and Daily notes\n`;
message += `- Rescheduled to today: ${rescheduledToday} critical tasks\n`;
message += `- Rescheduled to tomorrow: ${rescheduledTomorrow} important tasks\n`;
message += `- Rescheduled to later: ${rescheduledLater} flexible tasks\n\n`;

// Add task details
if (criticalRescheduled.length > 0) {
    message += `## Do Today (Critical)\n`;
    for (const task of criticalRescheduled) {
        message += `- [ ] ${task.text} (from ${task.source})\n`; 📅 2025-03-08 #autodate
    }
    message += `\n`;
}

if (importantRescheduled.length > 0) {
    message += `## Do Tomorrow (Important)\n`;
    for (const task of importantRescheduled) {
        message += `- [ ] ${task.text} (from ${task.source})\n`;
    }
    message += `\n`;
}

if (flexibleRescheduled.length > 0) {
    message += `## Do Later (Flexible)\n`;
    for (const task of flexibleRescheduled) {
        message += `- [ ] ${task.text} (from ${task.source})\n`;
    }
    message += `\n`;
}

message += `## Today's Focus\n`;
message += `1. Complete critical tasks first\n`;
message += `2. Take breaks as needed\n`;
message += `3. Remember progress over perfection\n\n`;

message += `## Today's Critical Tasks\n\`\`\`tasks\nnot done\ndue today\ntags includes critical\n\`\`\`\n`;

message += `\n## Coming Up Tomorrow\n\`\`\`tasks\nnot done\ndue tomorrow\n\`\`\`\n`;

// Create the reset note
await tp.file.create_new(message, `${today}-reset.md`, true, app.vault.getAbstractFileByPath("06-Daily"));

// Show notification
new Notice(`Get Back on Track protocol activated. Rescheduled ${overdueCount} overdue tasks based on priority.`);
%>