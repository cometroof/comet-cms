-- Migration: Create Projects and Categories Tables
-- Description: Creates tables for project categories, projects, and project images
-- Created: 2025-10-10

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create project_categories table
CREATE TABLE IF NOT EXISTS public.project_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location_text TEXT NOT NULL,
    location_link TEXT NOT NULL,
    roof_type TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.project_categories(id) ON DELETE RESTRICT,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_images table
CREATE TABLE IF NOT EXISTS public.project_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_highlight BOOLEAN DEFAULT FALSE,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_categories_deleted_at ON public.project_categories(deleted_at);
CREATE INDEX IF NOT EXISTS idx_project_categories_slug ON public.project_categories(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON public.projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_order ON public.projects("order");
CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON public.project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_project_images_order ON public.project_images("order");
CREATE INDEX IF NOT EXISTS idx_project_images_is_highlight ON public.project_images(is_highlight);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_project_categories_updated_at
    BEFORE UPDATE ON public.project_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_images_updated_at
    BEFORE UPDATE ON public.project_images
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust based on your auth requirements)
-- These policies allow public read access and authenticated write access
-- Modify these based on your security requirements

-- Project Categories Policies
CREATE POLICY "Allow public read access to project_categories"
    ON public.project_categories
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to insert project_categories"
    ON public.project_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update project_categories"
    ON public.project_categories
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete project_categories"
    ON public.project_categories
    FOR DELETE
    TO authenticated
    USING (true);

-- Projects Policies
CREATE POLICY "Allow public read access to projects"
    ON public.projects
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to insert projects"
    ON public.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update projects"
    ON public.projects
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete projects"
    ON public.projects
    FOR DELETE
    TO authenticated
    USING (true);

-- Project Images Policies
CREATE POLICY "Allow public read access to project_images"
    ON public.project_images
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to insert project_images"
    ON public.project_images
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update project_images"
    ON public.project_images
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete project_images"
    ON public.project_images
    FOR DELETE
    TO authenticated
    USING (true);

-- Add comments to tables for documentation
COMMENT ON TABLE public.project_categories IS 'Stores project categories (e.g., Residential, Commercial)';
COMMENT ON TABLE public.projects IS 'Stores project information including location and roof type';
COMMENT ON TABLE public.project_images IS 'Stores images associated with projects';

COMMENT ON COLUMN public.project_categories.deleted_at IS 'Soft delete timestamp - null means not deleted';
COMMENT ON COLUMN public.projects."order" IS 'Display order for projects';
COMMENT ON COLUMN public.project_images.is_highlight IS 'Whether this image is highlighted/featured';
COMMENT ON COLUMN public.project_images."order" IS 'Display order for images within a project';
