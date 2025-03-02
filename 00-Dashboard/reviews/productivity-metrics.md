# Productivity Metrics Dashboard

## Task Completion Trends

### Weekly Task Completion
```dataview
TABLE 
  substr(file.name, 0, 10) as "Week",
  length(filter(file.tasks.completed, (t) => t.completion)) as "Tasks Completed", 
  length(filter(file.tasks, (t) => contains(t.tags, "#critical") AND t.completion)) as "Critical Tasks"
FROM "00-Dashboard/reviews/weekly"
SORT file.name DESC
LIMIT 8
```

### Monthly Task Completion
```dataview
TABLE 
  substr(file.name, 0, 7) as "Month",
  length(filter(file.tasks.completed, (t) => t.completion)) as "Tasks Completed"
FROM "00-Dashboard/reviews/monthly"
SORT file.name DESC
LIMIT 6
```

## Project Velocity

### Projects Completed
```dataview
TABLE 
  file.mtime as "Completion Date",
  client as "Client",
  (date(file.mtime) - date(file.ctime)).day as "Duration (Days)"
FROM "04-Archive"
SORT file.mtime DESC
LIMIT 5
```

### Current Project Progress
```dataview
TABLE 
  client as "Client",
  stage as "Current Stage",
  deadline as "Deadline", 
  (date(deadline) - date(today)).day as "Days Left"
FROM "01-Projects"
WHERE status = "Active" AND deadline
SORT (date(deadline) - date(today)).day ASC
```

## Wellness Score Trends

### Weekly Averages
```dataview
TABLE 
  substr(file.name, 0, 10) as "Week",
  round(avg(filter(file.lists, (l) => contains(l.section, "Weekly Average Score")).avg_morning_avg), 1) as "Morning",
  round(avg(filter(file.lists, (l) => contains(l.section, "Weekly Average Score")).avg_afternoon_avg), 1) as "Afternoon",
  round(avg(filter(file.lists, (l) => contains(l.section, "Weekly Average Score")).avg_evening_avg), 1) as "Evening",
  round(avg(filter(file.lists, (l) => contains(l.section, "Weekly Average Score")).avg_overall_avg), 1) as "Overall"
FROM "00-Dashboard/reviews/weekly"
SORT file.name DESC
LIMIT 8
```

### Monthly Wellness Chart
```tracker
searchType: tag
searchTarget: morning-score, afternoon-score, evening-score
datasetName: Morning, Afternoon, Evening
month: 3
line:
  title: 3-Month Wellness Trends
  yMax: 5
  yMin: 1
  showLegend: true
```

## System Usage Metrics

### Folder Activity
```dataview
TABLE
  length(filter(this.files, (f) => contains(f.file.path, "01-Projects"))) as "Projects",
  length(filter(this.files, (f) => contains(f.file.path, "02-Areas"))) as "Areas",
  length(filter(this.files, (f) => contains(f.file.path, "03-Resources"))) as "Resources",
  length(filter(this.files, (f) => contains(f.file.path, "06-Daily"))) as "Daily Notes"
FROM ""
FLATTEN [1] as Dummy
GROUP BY "Vault Structure"
```

### Daily Note Consistency
```dataview
TABLE date(today) - date(file.ctime) as "Days Ago Created"
FROM "06-Daily"
SORT file.ctime DESC
LIMIT 10
```

## ADHD Pattern Tracking

### Emergency Protocol Usage
```dataview
TABLE 
  file.name as "Date",
  choice(contains(file.name, "sick-day"), "Sick Day", "Reset Day") as "Protocol Type"
FROM "06-Daily"
WHERE contains(file.name, "sick-day") OR contains(file.name, "reset")
SORT file.name DESC
LIMIT 10
```


## Task Distribution by Project Type

### Tasks by Criticality
```tasks
not done
group by tags
```

### Project Work Distribution
```dataview
TABLE 
  type as "Project Type",
  length(rows) as "Count"
FROM "01-Projects"
WHERE status = "Active"
GROUP BY type
SORT length(rows) DESC
```
