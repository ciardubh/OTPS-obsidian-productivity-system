---
week: {{date:YYYY-[W]ww}}
created: {{date:YYYY-MM-DD}}
type: review
---

# Weekly Review - {{date:YYYY-[W]ww}}

## Week Overview
**Week Span**: {{date:YYYY-MM-DD}} to {{date+6:YYYY-MM-DD}}

## Wellness Scores

### This Week's Daily Scores
```dataview
TABLE 
  choice(contains(file.day.morning-score, ""), "—", file.day.morning-score) as "Morning",
  choice(contains(file.day.afternoon-score, ""), "—", file.day.afternoon-score) as "Afternoon",
  choice(contains(file.day.evening-score, ""), "—", file.day.evening-score) as "Evening"
FROM "06-Daily"
WHERE file.name >= "{{date:YYYY-MM-DD}}" AND file.name <= "{{date+6:YYYY-MM-DD}}" AND !file.name.includes("sick-day") AND !file.name.includes("reset")
SORT file.name ASC
```

### Weekly Average Score
```dataview
TABLE 
  round(avg(file.day.morning-score), 1) as "Morning Avg",
  round(avg(file.day.afternoon-score), 1) as "Afternoon Avg",
  round(avg(file.day.evening-score), 1) as "Evening Avg",
  round(avg(list(file.day.morning-score, file.day.afternoon-score, file.day.evening-score)), 1) as "Overall Avg"
FROM "06-Daily"
WHERE file.name >= "{{date:YYYY-MM-DD}}" AND file.name <= "{{date+6:YYYY-MM-DD}}" AND !file.name.includes("sick-day") AND !file.name.includes("reset")
```

## Task Completion

### Tasks Completed This Week
```tasks
done
done after {{date:YYYY-MM-DD}}
done before {{date+7:YYYY-MM-DD}}
```

### Tasks Added This Week
```tasks
created after {{date:YYYY-MM-DD}}
created before {{date+7:YYYY-MM-DD}}
```

### Task Metrics
```dataview
TABLE 
  length(filter(file.tasks.completed, (t) => t.completion >= date("{{date:YYYY-MM-DD}}") AND t.completion <= date("{{date+6:YYYY-MM-DD}}"))) as "Tasks Completed",
  length(filter(file.tasks.text, (t) => contains(t.created, "{{date:YYYY-MM-DD}}") or contains(t.created, "{{date+1:YYYY-MM-DD}}") or contains(t.created, "{{date+2:YYYY-MM-DD}}") or contains(t.created, "{{date+3:YYYY-MM-DD}}") or contains(t.created, "{{date+4:YYYY-MM-DD}}") or contains(t.created, "{{date+5:YYYY-MM-DD}}") or contains(t.created, "{{date+6:YYYY-MM-DD}}"))) as "Tasks Added"
FROM "06-Daily" or "01-Projects" or "02-Areas"
WHERE file.name >= "{{date:YYYY-MM-DD}}" AND file.name <= "{{date+6:YYYY-MM-DD}}" OR file.path = "00-Dashboard/home"
FLATTEN file.tasks as tasks
GROUP BY "Task Metrics"
```

## Project Progress

### Project Status Updates
```dataview
TABLE 
  client as "Client",
  deadline as "Deadline",
  stage as "Current Stage"
FROM "01-Projects"
WHERE status = "Active"
SORT deadline ASC
```

### Projects Needing Attention
<!-- Review and manually list any projects at risk or needing urgent attention -->

## Weekly Review Questions

### What Went Well
<!-- Note 3-5 successes or wins this week -->
- 
- 
- 

### What Didn't Go Well
<!-- Note 3-5 challenges or missed opportunities -->
- 
- 
- 

### ADHD Pattern Recognition
<!-- Did you notice any emerging patterns with focus, task management, or energy levels? -->


### Weekly Energy Patterns
<!-- Based on your morning/afternoon/evening scores, what patterns do you notice? -->


## Adjustments Needed

### Task Management Adjustments
<!-- What needs to change in how you're managing tasks? -->
- 

### Schedule Adjustments
<!-- Do you need to change how you're allocating time? -->
- 

### Project Adjustments
<!-- Do any projects need changes in approach? -->
- 

## Next Week Planning

### Top Priorities Next Week
1. 
2. 
3. 

### Upcoming Deadlines
```tasks
not done
due after {{date:YYYY-MM-DD}}
due before {{date+13:YYYY-MM-DD}}
```

### Project Focus
<!-- Which specific projects need most attention next week? -->
1. 
2. 

## Notes and Reflections
<!-- Any additional insights or ideas from this week? -->