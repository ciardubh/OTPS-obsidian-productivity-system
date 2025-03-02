# Complete Responsibilities Overview

## Projects and Areas by Criticality

### Critical (Level 1)
```dataview
LIST
FROM "01-Projects" OR "02-Areas"
WHERE (criticality = "1" OR criticality = 1) AND status = "Active"
```
### Important (Level 2)
```dataview
LIST
FROM "01-Projects" OR "02-Areas" 
WHERE (criticality = "2" OR criticality = 2) AND status = "Active"
```
### Flexible (Level 3)
```dataview
LIST
FROM "01-Projects" OR "02-Areas" 
WHERE (criticality = "3" OR criticality = 3) AND status = "Active"
```
## All current tasks
```tasks
not done
(path includes 01-Projects) OR (path includes 02-Areas)
group by tags
```
