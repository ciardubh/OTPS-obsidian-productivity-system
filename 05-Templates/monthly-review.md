---
month: {{date:YYYY-MM}}
created: {{date:YYYY-MM-DD}}
type: review
---

# Monthly Review - {{date:YYYY-MM}}

## Month Overview
**Month Span**: {{date:YYYY-MM-01}} to {{date:YYYY-MM-DD}}

## Wellness Tracking Analysis

### Monthly Score Visualization
```tracker
searchType: tag
searchTarget: morning-score, afternoon-score, evening-score
datasetName: Morning, Afternoon, Evening
month: 1
line:
  title: {{date:MMMM YYYY}} Score Trends
  yMax: 5
  yMin: 1
  showLegend: true
```

### Monthly Score Averages
```dataview
TABLE 
  round(avg(file.day.morning-score), 1) as "Morning Avg",
  round(avg(file.day.afternoon-score), 1) as "Afternoon Avg",
  round(avg(file.day.evening-score), 1) as "Evening Avg",
  round(avg(list(file.day.morning-score, file.day.afternoon-score, file.day.evening-score)), 1) as "Overall Avg"
FROM "06-Daily"
WHERE file.name >= "{{date:YYYY-MM-01}}" AND file.name <= "{{date:YYYY-MM-DD}}" AND !file.name.includes("sick-day") AND !file.name.includes("reset")
```

### Emergency Protocol Usage
```dataview
LIST
FROM "06-Daily"
WHERE file.name >= "{{date:YYYY-MM-01}}" AND file.name <= "{{date:YYYY-MM-DD}}" AND (file.name.includes("sick-day") OR file.name.includes("reset"))
```

## Productivity Metrics

### Task Completion Statistics
```dataview
TABLE 
  length(filter(file.tasks.completed, (t) => t.completion >= date("{{date:YYYY-MM-01}}") AND t.completion <= date("{{date:YYYY-MM-DD}}"))) as "Tasks Completed",
  length(filter(file.tasks.text, (t) => t.created >= date("{{date:YYYY-MM-01}}") AND t.created <= date("{{date:YYYY-MM-DD}}"))) as "Tasks Added",
  length(filter(file.tasks.text, (t) => contains(t.tags, "#critical") AND t.completion >= date("{{date:YYYY-MM-01}}") AND t.completion <= date("{{date:YYYY-MM-DD}}"))) as "Critical Tasks Completed"
FROM "06-Daily" or "01-Projects" or "02-Areas"
FLATTEN file.tasks as tasks
GROUP BY "Monthly Metrics"
```

### Project Progression
```dataview
TABLE 
  stage as "Current Stage"
FROM "01-Projects"
WHERE status = "Active"
GROUP BY stage
```

### Completed Projects
```dataview
LIST
FROM "04-Archive"
WHERE file.mtime >= date("{{date:YYYY-MM-01}}") AND file.mtime <= date("{{date:YYYY-MM-DD}}")
```

## Monthly ADHD Analysis

### Patterns & Triggers Identified
<!-- Document any ADHD-related patterns you've noticed this month -->
- 

### Successful Strategies
<!-- What techniques or approaches worked well for managing ADHD symptoms? -->
- 

### Areas for Improvement
<!-- What challenges related to ADHD symptoms need addressing? -->
- 

## Monthly Analysis Questions

### What Went Well 
<!-- Note major accomplishments and wins -->
- 
- 
- 

### What Didn't Go Well
<!-- Note significant challenges or issues -->
- 
- 
- 

### System Optimizations Needed
<!-- Do you need to adjust your Obsidian setup or workflows? -->
- 

## Project and Area Review

### Projects Review
<!-- Review the status of all active projects -->

#### Completed Projects
- 

#### Projects On Track
- 

#### Projects Behind Schedule
- 

#### Projects Requiring Decisions
- 

### Areas of Responsibility Review
<!-- Review each area of ongoing responsibility -->

#### Areas Well-Managed
- 

#### Areas Needing Attention
- 

## Coming Month Planning

### Priorities for Next Month
1. 
2. 
3. 

### Project Goals
<!-- Specific milestones to reach for each active project -->
- 

### Personal Development Focus
<!-- What personal growth areas will you focus on? -->
- 

## Productivity System Review

### What's Working Well
- 

### What Needs Improvement
- 

### Proposed Changes
- 

## Reflection and Integration
<!-- Overall thoughts on the month and lessons learned -->