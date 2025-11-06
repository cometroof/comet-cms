-- Migration: Add premium fields to product_profile table
-- Date: 2025-10-24
-- Description: Adds premium-related columns to product_profile table to integrate
--              premium functionality directly into profiles instead of separate table

-- Add premium fields to product_profile table
ALTER TABLE product_profile
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS premium_materials TEXT,
ADD COLUMN IF NOT EXISTS premium_image_url TEXT,
ADD COLUMN IF NOT EXISTS content_image_url TEXT;

-- Add comments to document the changes
COMMENT ON COLUMN product_profile.is_premium IS 'Indicates if this profile has premium specifications';
COMMENT ON COLUMN product_profile.description IS 'Detailed description of the premium profile';
COMMENT ON COLUMN product_profile.premium_materials IS 'Materials used in this premium profile';
COMMENT ON COLUMN product_profile.premium_image_url IS 'Brand image URL for premium profile';
COMMENT ON COLUMN product_profile.content_image_url IS 'Content image URL displayed below description';

-- Create index for faster querying of premium profiles
CREATE INDEX IF NOT EXISTS idx_product_profile_is_premium ON product_profile(is_premium) WHERE is_premium = TRUE;
