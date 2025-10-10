-- Add order column to project_categories table
ALTER TABLE project_categories
ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- Update existing records to have sequential order based on created_at
WITH numbered_categories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS row_num
  FROM project_categories
)
UPDATE project_categories
SET "order" = numbered_categories.row_num
FROM numbered_categories
WHERE project_categories.id = numbered_categories.id;

-- Add comment to the column
COMMENT ON COLUMN project_categories."order" IS 'Display order for categories';
