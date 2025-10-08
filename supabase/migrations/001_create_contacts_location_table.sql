-- Create contacts-location table with type/value structure
-- This table stores all contact and location data in a key-value format

CREATE TABLE IF NOT EXISTS "contacts-location" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_type UNIQUE (type)
);

-- Create index on type for faster lookups
CREATE INDEX idx_contacts_location_type ON "contacts-location" (type);

-- Add RLS (Row Level Security) policies
ALTER TABLE "contacts-location" ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access" ON "contacts-location"
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON "contacts-location"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON "contacts-location"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON "contacts-location"
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to automatically update updated_at
CREATE TRIGGER update_contacts_location_updated_at
  BEFORE UPDATE ON "contacts-location"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial contact types (optional seed data)
-- These types represent all fields from both Contacts and Locations tabs

-- Contact tab types
INSERT INTO "contacts-location" (type, value) VALUES
  ('head_office', '<p>Head Office Location Information</p>'),
  ('head_office_link', 'https://maps.google.com/?q=office'),
  ('phone', '+62-21-1234567'),
  ('fax', '+62-21-1234568'),
  ('email', 'info@company.com'),
  ('whatsapp_contact_service', '+6281234567890')
ON CONFLICT (type) DO NOTHING;

-- Location tab types (provinces and cities will be stored as JSON arrays or individual entries)
-- Format for provinces: province_<id> or provinces (as JSON array)
-- Format for cities: city_<province_id>_<city_id> or cities_<province_id> (as JSON array)

-- Example: Store provinces as JSON array
INSERT INTO "contacts-location" (type, value) VALUES
  ('provinces', '[{"id":"1","name":"DKI Jakarta"},{"id":"2","name":"Jawa Barat"},{"id":"3","name":"Jawa Timur"}]')
ON CONFLICT (type) DO NOTHING;

-- Example: Store cities grouped by province as JSON
INSERT INTO "contacts-location" (type, value) VALUES
  ('cities_1', '[{"id":"1","name":"Jakarta Pusat","link":"https://maps.google.com/?q=Jakarta+Pusat"},{"id":"2","name":"Jakarta Selatan","link":"https://maps.google.com/?q=Jakarta+Selatan"}]'),
  ('cities_2', '[{"id":"3","name":"Bandung","link":"https://maps.google.com/?q=Bandung"}]')
ON CONFLICT (type) DO NOTHING;

COMMENT ON TABLE "contacts-location" IS 'Stores all contact and location data in key-value format';
COMMENT ON COLUMN "contacts-location".type IS 'Field name/identifier (e.g., head_office, phone, provinces, cities_<province_id>)';
COMMENT ON COLUMN "contacts-location".value IS 'Field value (can be text, HTML, URL, or JSON string)';
