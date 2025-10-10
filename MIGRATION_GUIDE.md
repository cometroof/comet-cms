# Migration Guide: Multiple Categories per Project

## Overview
This migration enables projects to have multiple categories instead of just one. The implementation uses a junction table to create a many-to-many relationship between projects and categories.

## Database Changes

### New Table: `project_category_relations`
A junction table that links projects to categories:
- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key to projects)
- `category_id` (UUID, Foreign Key to project_categories)
- `created_at` (Timestamp)

### Migration Steps

1. **Run the SQL Migration**
   
   Execute the migration file located at:
   ```
   supabase-migrations/002_multiple_categories_per_project.sql
   ```

   You can run this via Supabase CLI or directly in the Supabase Dashboard SQL Editor:
   
   ```bash
   # If using Supabase CLI
   supabase migration up
   ```
   
   Or manually execute the SQL in your Supabase Dashboard.

2. **What the Migration Does**
   - Creates the `project_category_relations` junction table
   - Migrates existing single category relationships to the new table
   - Creates indexes for better query performance
   - **Keeps** the old `category_id` column for backward compatibility (optional to remove later)

3. **Verify Migration**
   
   After running the migration, verify:
   ```sql
   -- Check the new table exists
   SELECT * FROM project_category_relations LIMIT 5;
   
   -- Verify data was migrated
   SELECT COUNT(*) FROM project_category_relations;
   
   -- This should match the number of projects with categories
   SELECT COUNT(*) FROM projects WHERE category_id IS NOT NULL;
   ```

## Application Changes

### Updated Files
1. **Type Definitions** (`src/pages/projects/types.ts`)
   - Added `category_ids: string[]` field to Project interface
   - Kept `category_id` for backward compatibility

2. **API Layer** (`src/pages/projects/api.ts`)
   - `getAll()`: Now fetches and maps category relations
   - `create()`: Creates category relations in junction table
   - `update()`: Updates category relations (delete old, insert new)
   - `delete()`: Cascading delete handles junction table automatically

3. **UI Components**
   - **ProjectFormDialog**: Now uses multi-select dropdown with badges
   - **ProjectsTab**: Displays multiple category badges per project

### UI Features
- **Multi-select dropdown**: Search and select multiple categories
- **Badge display**: Selected categories shown as removable badges
- **Visual feedback**: Shows count of selected categories
- **Validation**: Requires at least one category to be selected

## Testing Checklist

- [ ] Run the database migration successfully
- [ ] Create a new project with multiple categories
- [ ] Edit an existing project to add/remove categories
- [ ] Verify categories display correctly in the projects table
- [ ] Test search functionality still works
- [ ] Test drag-and-drop reordering still works
- [ ] Verify delete operations work correctly

## Rollback Plan (If Needed)

If you need to rollback:

```sql
-- 1. Drop the junction table
DROP TABLE IF EXISTS project_category_relations;

-- 2. Restore the old single-select UI by reverting the code changes
-- Use git to revert to the previous commit
```

## Notes

- The old `category_id` column is kept in the `projects` table for backward compatibility
- You can safely remove it once you've verified everything works:
  ```sql
  ALTER TABLE projects DROP COLUMN category_id;
  ```
- The junction table has a UNIQUE constraint on `(project_id, category_id)` to prevent duplicates
- Cascading deletes ensure cleanup when projects or categories are deleted

## Support

If you encounter any issues:
1. Check the browser console for JavaScript errors
2. Check the Supabase logs for database errors
3. Verify the migration ran completely
4. Ensure all indexes were created successfully
