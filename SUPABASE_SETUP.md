# Supabase Projects Setup Guide

This guide will help you set up the projects database tables in your Supabase project.

## Prerequisites

- A Supabase project (if you don't have one, create it at [supabase.com](https://supabase.com))
- Environment variables configured in your `.env` file:
  ```env
  VITE_SUPABASE_URL=your-project-url
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```

## Setup Methods

You can set up the database using one of two methods:

### Method 1: Using Supabase Dashboard (Recommended)

1. **Navigate to SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Run the Migration**
   - Click "New Query"
   - Copy the entire contents of `supabase-migrations/001_create_projects_tables.sql`
   - Paste it into the SQL editor
   - Click "Run" or press `Ctrl/Cmd + Enter`

3. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see three new tables:
     - `project_categories`
     - `projects`
     - `project_images`

4. **(Optional) Add Sample Data**
   - If you want sample data for testing, run the seed file:
   - Copy contents of `supabase-migrations/002_seed_projects_data.sql`
   - Paste and run in SQL Editor
   - Note: You'll need to update the UUID values in the seed file

### Method 2: Using Supabase CLI

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase** (if not already initialized)
   ```bash
   supabase init
   ```

3. **Link to Your Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (You can find your project ref in the Supabase dashboard URL)

4. **Apply Migration**
   ```bash
   # Copy the migration file to supabase/migrations folder
   cp supabase-migrations/001_create_projects_tables.sql supabase/migrations/
   
   # Push the migration to Supabase
   supabase db push
   ```

## Database Schema

### Tables Created

#### 1. `project_categories`
Stores project categories (e.g., Residential, Commercial).

| Column      | Type      | Description                          |
|-------------|-----------|--------------------------------------|
| id          | UUID      | Primary key                          |
| name        | TEXT      | Category name                        |
| slug        | TEXT      | URL-friendly identifier (unique)     |
| deleted_at  | TIMESTAMP | Soft delete timestamp (null = active)|
| created_at  | TIMESTAMP | Creation timestamp                   |
| updated_at  | TIMESTAMP | Last update timestamp                |

#### 2. `projects`
Stores project information.

| Column         | Type      | Description                      |
|----------------|-----------|----------------------------------|
| id             | UUID      | Primary key                      |
| name           | TEXT      | Project name                     |
| location_text  | TEXT      | Location description             |
| location_link  | TEXT      | Google Maps or location URL      |
| roof_type      | TEXT      | Type of roof                     |
| category_id    | UUID      | Foreign key to project_categories|
| order          | INTEGER   | Display order                    |
| created_at     | TIMESTAMP | Creation timestamp               |
| updated_at     | TIMESTAMP | Last update timestamp            |

#### 3. `project_images`
Stores images for projects.

| Column       | Type      | Description                      |
|--------------|-----------|----------------------------------|
| id           | UUID      | Primary key                      |
| project_id   | UUID      | Foreign key to projects          |
| image_url    | TEXT      | URL to the image                 |
| is_highlight | BOOLEAN   | Whether image is highlighted     |
| order        | INTEGER   | Display order within project     |
| created_at   | TIMESTAMP | Creation timestamp               |
| updated_at   | TIMESTAMP | Last update timestamp            |

## Security (Row Level Security)

The migration automatically sets up Row Level Security (RLS) policies:

- **Public Read Access**: Anyone can view projects, categories, and images
- **Authenticated Write Access**: Only authenticated users can create, update, or delete

### Modifying Security Policies

If you need different access controls, modify the policies in the SQL file before running it, or update them in the Supabase dashboard:

1. Go to "Authentication" → "Policies" in the Supabase dashboard
2. Select the table you want to modify
3. Edit or create new policies as needed

**Example: Admin-only write access**
```sql
-- Replace the existing policies with admin-only policies
CREATE POLICY "Allow admin users to insert projects"
    ON public.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.jwt() ->> 'role' = 'admin'
    );
```

## Verification

After running the migration, verify everything is set up correctly:

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('project_categories', 'projects', 'project_images');
```

### Check Policies
```sql
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('project_categories', 'projects', 'project_images');
```

### Test Insert (as authenticated user)
```sql
-- Insert a test category
INSERT INTO public.project_categories (name, slug)
VALUES ('Test Category', 'test-category')
RETURNING *;

-- Clean up test data
DELETE FROM public.project_categories WHERE slug = 'test-category';
```

## Troubleshooting

### Error: "relation already exists"
If you see this error, the tables might already exist. You can either:
- Drop the existing tables: `DROP TABLE IF EXISTS public.project_images, public.projects, public.project_categories CASCADE;`
- Or skip the migration if the schema matches

### Error: "permission denied"
Make sure you're running the SQL as a user with sufficient privileges. In the Supabase dashboard, you should have full access.

### RLS Blocking Queries
If Row Level Security is blocking your queries:
1. Make sure your policies are set up correctly
2. Check if you're authenticated when making requests
3. Temporarily disable RLS for testing: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;` (not recommended for production)

## Image Storage Setup

For storing project images, you'll need to set up Supabase Storage:

1. **Create Storage Bucket**
   - Go to "Storage" in the Supabase dashboard
   - Click "Create a new bucket"
   - Name it `project-images`
   - Set it to "Public" if you want public access to images

2. **Set Up Storage Policies**
   ```sql
   -- Allow public read access to images
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'project-images');

   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'project-images');
   ```

3. **Update Image URLs**
   When uploading images, use the format:
   ```
   https://[your-project-ref].supabase.co/storage/v1/object/public/project-images/[filename]
   ```

## Next Steps

After setting up the database:

1. ✅ Verify tables exist in Supabase dashboard
2. ✅ Test creating a category through the CMS UI
3. ✅ Test creating a project with images
4. ✅ Test drag-and-drop reordering
5. ✅ Set up image storage bucket for file uploads

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Documentation](https://supabase.com/docs/guides/storage)

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Check the Supabase logs in the dashboard
3. Verify your environment variables are correct
4. Ensure you're authenticated if required by the RLS policies
