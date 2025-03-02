## Next Actions by Project
```tasks 
not done 
path includes 01-Projects 
group by filename
limit to 1 tasks per group
```
## Projects approaching deadline
```dataview
TABLE
  client as "Client",
  deadline as "Deadline", 
  (date(deadline) - date(today)).day as "Days Left"
FROM "01-Projects"
WHERE status = "Active" AND deadline
SORT deadline ASC
LIMIT 5
```
## By Project Stage
```dataview
TABLE
  stage as "Current Stage",
  file.tasks.text[0] as "First Task"
FROM "01-Projects"
WHERE status = "Active" AND length(file.tasks.text) > 0
SORT stage ASC
```
## Projects by Stage
```dataview
TABLE 
  client as "Client",
  deadline as "Deadline",
  stage as "Current Stage"
FROM "01-Projects"
WHERE status = "Active"
SORT deadline ASC
```
## Recently updated project
```dataview
TABLE
  file.mtime as "Last Modified"
FROM "01-Projects"
WHERE status = "Active"
SORT file.mtime desc
LIMIT 3
```
