-- Migration: Support multiple categories per project
-- Create junction table for many-to-many relationship between projects and categories

-- Step 1: Create the junction table
CREATE TABLE IF NOT EXISTS project_category_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES project_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, category_id)
);

-- Step 2: Migrate existing data from projects.category_id to junction table
INSERT INTO project_category_relations (project_id, category_id, created_at)
SELECT id, category_id, NOW()
FROM projects
WHERE category_id IS NOT NULL;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_project_category_relations_project_id ON project_category_relations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_category_relations_category_id ON project_category_relations(category_id);

-- Step 4: Drop the old category_id column from projects table (optional - keep for backward compatibility initially)
-- Uncomment the following line only after verifying the migration works correctly
-- ALTER TABLE projects DROP COLUMN IF EXISTS category_id;

-- Note: For safety, we're keeping the category_id column for now
-- You can remove it later once you've verified everything works correctly
