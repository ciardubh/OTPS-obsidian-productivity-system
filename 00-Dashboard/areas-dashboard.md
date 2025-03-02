# Areas of Responsibility Dashboard

## Active Areas
```dataview
TABLE 
  type as "Type",
  criticality as "Criticality"
FROM "02-Areas"
WHERE status = "Active"
SORT type ASC
```
## Areas by criticality
```dataview
TABLE
  criticality as "Criticality Level"
FROM "02-Areas"
GROUP BY criticality
SORT criticality ASC
```
## Current Area Tasks
```tasks
not done
path includes 02-Areas
group by filename
```
