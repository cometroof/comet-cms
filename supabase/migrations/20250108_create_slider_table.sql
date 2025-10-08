-- Create slider table
-- This table stores slider/carousel content for the homepage

CREATE TABLE IF NOT EXISTS "slider" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(255) NOT NULL DEFAULT 'home-cover',
  image TEXT NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  title_id VARCHAR(200) NOT NULL,
  description_en VARCHAR(500) NOT NULL,
  description_id VARCHAR(500) NOT NULL,
  link TEXT,
  link_text VARCHAR(100),
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_slider_type ON "slider"(type);
CREATE INDEX IF NOT EXISTS idx_slider_order ON "slider"("order");
CREATE INDEX IF NOT EXISTS idx_slider_type_order ON "slider"(type, "order");

-- Enable Row Level Security (RLS)
ALTER TABLE "slider" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
ON "slider"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow read access for anonymous users (public website)
CREATE POLICY "Allow read access for anonymous users"
ON "slider"
FOR SELECT
TO anon
USING (true);

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_slider_updated_at
BEFORE UPDATE ON "slider"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default/seed data
INSERT INTO "slider" (type, image, title_en, title_id, description_en, description_id, link, link_text, "order") VALUES
  (
    'home-cover',
    '/placeholder.svg',
    'Premium Roofing Solutions',
    'Solusi Atap Premium',
    'Experience excellence in roofing with our premium materials',
    'Rasakan keunggulan atap dengan material premium kami',
    '/products',
    'View Products',
    1
  ),
  (
    'home-cover',
    '/placeholder.svg',
    'Professional Installation',
    'Instalasi Profesional',
    'Expert installation services for your peace of mind',
    'Layanan instalasi ahli untuk ketenangan pikiran Anda',
    NULL,
    NULL,
    2
  )
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE "slider" IS 'Stores slider/carousel content with multilingual support';
COMMENT ON COLUMN "slider".type IS 'Type of slider (e.g., home-cover, product-banner)';
COMMENT ON COLUMN "slider".image IS 'URL or path to the slider image';
COMMENT ON COLUMN "slider".title_en IS 'Title in English';
COMMENT ON COLUMN "slider".title_id IS 'Title in Indonesian';
COMMENT ON COLUMN "slider".description_en IS 'Description in English';
COMMENT ON COLUMN "slider".description_id IS 'Description in Indonesian';
COMMENT ON COLUMN "slider".link IS 'Optional link URL';
COMMENT ON COLUMN "slider".link_text IS 'Optional text for the link button';
COMMENT ON COLUMN "slider"."order" IS 'Display order of the slider (lower numbers appear first)';
