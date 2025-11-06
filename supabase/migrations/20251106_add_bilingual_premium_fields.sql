-- Migration: Add bilingual fields for premium descriptions and materials
-- Date: 2025-11-06
-- Description: Splits description and premium_materials into separate English and Indonesian fields

-- Rename existing fields if they exist
ALTER TABLE product_profile
  RENAME COLUMN description TO description_en;

ALTER TABLE product_profile
  RENAME COLUMN premium_materials TO premium_materials_en;

-- Add Indonesian versions
ALTER TABLE product_profile
  ADD COLUMN IF NOT EXISTS description_id TEXT,
  ADD COLUMN IF NOT EXISTS premium_materials_id TEXT;

-- Add comments to document the changes
COMMENT ON COLUMN product_profile.description_en IS 'English description of the premium profile';
COMMENT ON COLUMN product_profile.description_id IS 'Indonesian description of the premium profile';
COMMENT ON COLUMN product_profile.premium_materials_en IS 'English materials information';
COMMENT ON COLUMN product_profile.premium_materials_id IS 'Indonesian materials information';
