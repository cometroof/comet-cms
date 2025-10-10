-- Migration: Seed Projects Data (Optional)
-- Description: Inserts sample data for testing
-- Created: 2025-10-10
-- Note: This is optional - remove or modify based on your needs

-- Insert sample categories
INSERT INTO public.project_categories (name, slug, deleted_at)
VALUES
    ('Residential', 'residential', NULL),
    ('Commercial', 'commercial', NULL),
    ('Industrial', 'industrial', NULL)
ON CONFLICT (slug) DO NOTHING;

-- Get category IDs (for reference in next inserts)
-- You'll need to replace these UUIDs with actual IDs after running the first insert

-- Example: Insert sample projects
-- Note: Replace the category_id values with actual UUIDs from your project_categories table
-- You can get these by running: SELECT id, name FROM public.project_categories;

-- INSERT INTO public.projects (name, location_text, location_link, roof_type, category_id, "order")
-- VALUES
--     ('Modern Villa', 'Jakarta, Indonesia', 'https://maps.google.com', 'Metal Roof', 'YOUR-CATEGORY-UUID-HERE', 0),
--     ('Shopping Mall', 'Surabaya, Indonesia', 'https://maps.google.com', 'Flat Roof', 'YOUR-CATEGORY-UUID-HERE', 1);

-- Example: Insert sample project images
-- Note: Replace the project_id values with actual UUIDs from your projects table
-- You can get these by running: SELECT id, name FROM public.projects;

-- INSERT INTO public.project_images (project_id, image_url, is_highlight, "order")
-- VALUES
--     ('YOUR-PROJECT-UUID-HERE', 'https://your-storage-url.com/image1.jpg', true, 0),
--     ('YOUR-PROJECT-UUID-HERE', 'https://your-storage-url.com/image2.jpg', false, 1);

-- Verify the data
-- SELECT * FROM public.project_categories;
-- SELECT * FROM public.projects;
-- SELECT * FROM public.project_images;
