-- make ur review data not null
UPDATE content
SET rating_avg = 0.0
WHERE rating_avg IS NULL;
-- make ur review data not null