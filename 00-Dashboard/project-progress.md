# Project Progress Overview

## Planning Stage
```dataview
LIST
FROM "01-Projects"
WHERE status = "Active" AND stage = "planning"
```

## Creation Stage
```dataview
LIST
FROM "01-Projects"
WHERE status = "Active" AND stage = "creation"
```

## Review Stage
```dataview
LIST
FROM "01-Projects"
WHERE status = "Active" AND stage = "review"
```
## Delivery Stage

```dataview
LIST
FROM "01-Projects"
WHERE status = "Active" AND stage = "delivery"
```
## Completed Projects
```dataview
LIST
FROM "01-Projects"
WHERE status = "completed" OR stage = "completed"
LIMIT 10
```
