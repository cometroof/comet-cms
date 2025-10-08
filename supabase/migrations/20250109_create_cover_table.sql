-- Create cover table
-- This table stores cover images for different sections (home-project, home-distribution)

CREATE TABLE IF NOT EXISTS "cover" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(255) NOT NULL UNIQUE,
  image TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cover_type ON "cover"(type);
CREATE INDEX IF NOT EXISTS idx_cover_order ON "cover"("order");

-- Enable Row Level Security (RLS)
ALTER TABLE "cover" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
ON "cover"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow read access for anonymous users (public website)
CREATE POLICY "Allow read access for anonymous users"
ON "cover"
FOR SELECT
TO anon
USING (true);

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_cover_updated_at
BEFORE UPDATE ON "cover"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default/seed data
INSERT INTO "cover" (type, image, "order") VALUES
  ('home-project', '/placeholder.svg', 1),
  ('home-distribution', '/placeholder.svg', 2)
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE "cover" IS 'Stores cover images for different sections';
COMMENT ON COLUMN "cover".type IS 'Type of cover (e.g., home-project, home-distribution) - must be unique';
COMMENT ON COLUMN "cover".image IS 'URL or path to the cover image';
COMMENT ON COLUMN "cover"."order" IS 'Display order of the cover (lower numbers appear first)';
