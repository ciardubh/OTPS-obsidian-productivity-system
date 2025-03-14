---
week: {{date:YYYY-[W]ww}}
created: {{date:YYYY-MM-DD}}
type: review
---

# Weekly Review - {{date:YYYY-[W]ww}}

## Week Overview
**Week Span**:  <% tp.date.now("YYYY-MM-DD") %> to <% tp.date.now("YYYY-MM-DD", 6) %>

### Top Priorities From Last Week's Review
1. 
2. 
3. 

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

### Projects Needing Attention
<!-- Review and manually list any projects at risk or needing urgent attention -->


### Project Focus
<!-- Which specific projects need most attention next week? -->
1. 
2. 

### Top Priorities Next Week
1. 
2. 
3. 

## Notes and Reflections
<!-- Any additional insights or ideas from this week? -->

_________________________________________________________________________
## Wellness Scores

### This Week's Daily Scores

```dataview
TABLE 
  file.name as "Date",
  choice(file.frontmatter.morning_score >= 4, "🟢 " + file.frontmatter.morning_score, 
         choice(file.frontmatter.morning_score >= 3, "🟡 " + file.frontmatter.morning_score, 
                choice(file.frontmatter.morning_score != null, "🔴 " + file.frontmatter.morning_score, "—"))) as "Morning",
  choice(file.frontmatter.afternoon_score >= 4, "🟢 " + file.frontmatter.afternoon_score, 
         choice(file.frontmatter.afternoon_score >= 3, "🟡 " + file.frontmatter.afternoon_score, 
                choice(file.frontmatter.afternoon_score != null, "🔴 " + file.frontmatter.afternoon_score, "—"))) as "Afternoon",
  choice(file.frontmatter.evening_score >= 4, "🟢 " + file.frontmatter.evening_score, 
         choice(file.frontmatter.evening_score >= 3, "🟡 " + file.frontmatter.evening_score, 
                choice(file.frontmatter.evening_score != null, "🔴 " + file.frontmatter.evening_score, "—"))) as "Evening",
  choice(all(file.frontmatter.morning_score, file.frontmatter.afternoon_score, file.frontmatter.evening_score),
         choice(((number(file.frontmatter.morning_score) + number(file.frontmatter.afternoon_score) + number(file.frontmatter.evening_score)) / 3) >= 4, 
                "🟢 " + round((number(file.frontmatter.morning_score) + number(file.frontmatter.afternoon_score) + number(file.frontmatter.evening_score)) / 3, 1), 
                choice(((number(file.frontmatter.morning_score) + number(file.frontmatter.afternoon_score) + number(file.frontmatter.evening_score)) / 3) >= 3, 
                       "🟡 " + round((number(file.frontmatter.morning_score) + number(file.frontmatter.afternoon_score) + number(file.frontmatter.evening_score)) / 3, 1), 
                       "🔴 " + round((number(file.frontmatter.morning_score) + number(file.frontmatter.afternoon_score) + number(file.frontmatter.evening_score)) / 3, 1))),
         "—") as "Daily Avg"
FROM "06-Daily"
WHERE file.name >= "<% tp.date.now("YYYY-MM-DD", -6) %>" AND file.name <= "<%tp.date.now("YYYY-MM-DD") %>" 
  AND (file.frontmatter.morning_score > 0 OR file.frontmatter.afternoon_score > 0 OR file.frontmatter.evening_score > 0)
SORT file.name ASC
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

## Task completion

### Tasks completed this week
```tasks
done
done after <% tp.date.now("YYYY-MM-DD", -7) %>
done before <% tp.date.now("YYYY-MM-DD") %>
```

### Upcoming Deadlines
```tasks
not done
due after <% tp.date.now("YYYY-MM-DD") %>
due before <% tp.date.now("YYYY-MM-DD", 7) %>
```
