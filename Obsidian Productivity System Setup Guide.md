### This guide is a work-in-progress, I originally built this system just for my own use and wasn't keeping good documentation. Apologies in advance...
#### The templates assume you have an autoimmune disorder and ADHD. Feel free to edit the templates to remove some of the excess parameters if your life is going better than that.

This guide will help you set up the comprehensive productivity management system in Obsidian that includes task scheduling, project management, and routine creation.
## Tips for Getting Started

1. Set up a few sample projects and areas to get familiar with the system
2. Run the task scheduler daily or when you add new tasks
3. Use the emergency protocols when needed
4. Schedule regular weekly/monthly reviews
5. Start with critical projects first, then gradually add more content
## Prerequisites

1. [Download and install Obsidian](https://obsidian.md/)
2. Basic familiarity with Markdown syntax (or you can be happy just blindly copying and pasting from me)
## Step 1: Install Required Plugins

After installing Obsidian, you'll need to install these core plugins:

1. Open Obsidian and click the Settings icon (gear) in the left sidebar
2. Go to "Core plugins" and install the following:
	- Daily Notes
3. Go to "Community plugins" and turn off "Safe mode"
4. Click "Browse" and install these plugins one by one:
    - Tasks
    - Dataview
    - Calendar
    - Templater
    - QuickAdd
    - Periodic Notes
    - Tracker
    - (Optional) Git for backup

## Step 2: Set Up Folder Structure

1. Create a new vault or open your existing one
2. Create the following folders (they are already set up if you downloaded my set-up from GitHub)
3. `00-Dashboard` - For primary views and controls
4. `01-Projects` - For all project notes
5. `02-Areas` - For ongoing areas of responsibility
6. `03-Resources` - For reference materials
7. `04-Archive` - For completed projects
8. `05-Templates` - For your templates
9. `06-Daily` - For daily notes
## Step 3: Import Templates

1. Download the provided templates or create them based on examples
2. Place them in the `05-Templates` folder
3. Core templates you'll need:
    - Project template
    - Area template
    - Daily note template
    - Weekly/monthly review templates
    - Emergency protocols (sick day, get back on track)
## Step 4: Set Up Scripts

1. Place the `task-scheduler.js` script in your `05-Templates` folder
2. Configure QuickAdd to run the script:
    - Go to QuickAdd settings
    - Create a new Macro
    - Name it "Task Scheduler"
    - Add a new "User Script" action
    - Point it to the `task-scheduler.js` file
    - Save the macro
    - Add the macro to your QuickAdd choices
    
3. Place the `advance-project-stage.js` script in your `05-Templates` folder
4. Configure QuickAdd to run the script:
    - Go to QuickAdd settings
    - Create a new Macro
    - Name it "Advance Project Stage"
    - Add a new "User Script" action
    - Point it to the `advance-project-stage.js` file
    - Save the macro
    - Add the macro to your QuickAdd choices
## Step 5: Configure Daily Notes

1. Go to Settings → Daily Notes
2. Set the new file location to `06-Daily`
3. Set the template file to your daily note template in `05-Templates`
4. Configure the date format as desired

## Step 6: Configure Weekly/Monthly Reviews

First, create these folders in your vault:

```
📁 00-Dashboard/
   📁 reviews/
      📁 weekly/
      📁 monthly/
   📄 productivity-metrics.md
```

### Template Installation

1. Add the Weekly and Monthly Review templates to your `05-Templates` folder:
   - `05-Templates/weekly-review.md`
   - `05-Templates/monthly-review.md`

2. Copy the Productivity Metrics Dashboard to:
   - `00-Dashboard/productivity-metrics.md`

### Plugin Configuration

#### Periodic Notes Plugin Setup

1. Go to Settings → Periodic Notes
2. Enable Weekly Notes and Monthly Notes
3. Configure paths:
   - Weekly notes path: `00-Dashboard/reviews/weekly`
   - Monthly notes path: `00-Dashboard/reviews/monthly`
4. Set templates:
   - Weekly template: `05-Templates/weekly-review.md`
   - Monthly template: `05-Templates/monthly-review.md`

#### Templater Configuration

For the date variables in templates to work correctly:

1. Go to Settings → Templater
2. Enable "Trigger Templater on new file creation"
3. Add template folder: `05-Templates`

### Workflow Integration

#### Weekly Reviews (30-45 minutes)

Schedule a recurring time each week (e.g., Friday afternoon or Sunday evening) to:

1. Open the Weekly Note for the current week
2. Complete all reflection questions
3. Review task completion and wellness metrics
4. Plan priorities for the upcoming week

#### Monthly Reviews (60-90 minutes)

Schedule a recurring time at the end of each month to:

1. Open the Monthly Note for the current month
2. Review weekly notes from the month
3. Analyze larger patterns and trends
4. Make system adjustments as needed
5. Set monthly priorities and project targets

#### Dashboard Usage

Use the Productivity Metrics Dashboard as a reference during reviews to:

1. Identify trends in task completion
2. Spot patterns in your wellness scores
3. Evaluate project progress velocity
4. Detect ADHD pattern triggers

Your review system will help you track:

1. **Task Completion Rates** - How many tasks you complete vs. create
2. **Wellness Score Trends** - How your energy/focus fluctuates
3. **Project Velocity** - How quickly you move projects through stages
4. **ADHD Pattern Recognition** - Identifying triggers and effective strategies
5. **System Usage Consistency** - How regularly you use your system

## Step 7: Task Usage Guide

Ensure you understand the task formatting system:

- Basic task: `- [ ] Task description`
- Task with time estimate: `- [ ] Task description #time 1h
		- Time estimates take h or m: `2.5h` or `30m`
		- The task scheduling script assumes 1hr per task if you don't add a time estimate
		- The time tag has a tendency to break the due date if you place it after. So estimate time before adding a due date, if there is a due date
- Task with due date: `- [ ] Task description 📅 YYYY-MM-DD`
- Task with criticality: `- [ ] Task description #critical`
- Complete format: `- [ ] Task description #time 1h 📅 YYYY-MM-DD #critical`
- Sequential tasks: `- [ ] [1] First task #seq`

Criticality levels are important for emergency protocols:

- `#critical` - Must be done on the scheduled day, even when sick
- `#important` - Could be delayed by 1 day in emergency
- `#flexible` - Can be rescheduled during emergency periods

## Step 8: Running the Task Scheduler

1. Click the QuickAdd button in the left sidebar
2. Select "Task Scheduler" from your choices
3. Let it run (it may take a few moments)
4. Review the generated report in the `00-Dashboard` folder