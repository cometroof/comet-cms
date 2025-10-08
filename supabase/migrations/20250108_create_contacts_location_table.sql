-- Create contacts-location table
-- This table uses a key-value pattern where each row represents a field or group of data
-- The 'type' field is the unique key, and 'value' stores the data (text, HTML, or JSON)

CREATE TABLE IF NOT EXISTS "contacts-location" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on type for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_location_type ON "contacts-location"(type);

-- Enable Row Level Security (RLS)
ALTER TABLE "contacts-location" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- Adjust these policies based on your authentication requirements
CREATE POLICY "Allow all operations for authenticated users"
ON "contacts-location"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow read access for anonymous users (public website)
CREATE POLICY "Allow read access for anonymous users"
ON "contacts-location"
FOR SELECT
TO anon
USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_contacts_location_updated_at
BEFORE UPDATE ON "contacts-location"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default/seed data
-- Contact information fields
INSERT INTO "contacts-location" (type, value) VALUES
  ('head_office', '<p>Default Head Office Address</p>'),
  ('head_office_link', 'https://maps.google.com'),
  ('phone', '+62-21-1234567'),
  ('fax', '+62-21-1234568'),
  ('email', 'info@company.com'),
  ('whatsapp_contact_service', '+6281234567890')
ON CONFLICT (type) DO NOTHING;

-- Provinces data (stored as JSON array)
INSERT INTO "contacts-location" (type, value) VALUES
  ('provinces', '[
    {
      "id": "1",
      "name": "DKI Jakarta",
      "created_at": "2025-01-08T00:00:00Z",
      "updated_at": "2025-01-08T00:00:00Z"
    },
    {
      "id": "2",
      "name": "Jawa Barat",
      "created_at": "2025-01-08T00:00:00Z",
      "updated_at": "2025-01-08T00:00:00Z"
    },
    {
      "id": "3",
      "name": "Jawa Tengah",
      "created_at": "2025-01-08T00:00:00Z",
      "updated_at": "2025-01-08T00:00:00Z"
    },
    {
      "id": "4",
      "name": "Jawa Timur",
      "created_at": "2025-01-08T00:00:00Z",
      "updated_at": "2025-01-08T00:00:00Z"
    },
    {
      "id": "5",
      "name": "Bali",
      "created_at": "2025-01-08T00:00:00Z",
      "updated_at": "2025-01-08T00:00:00Z"
    }
  ]')
ON CONFLICT (type) DO NOTHING;

-- Sample cities for Jakarta (stored as JSON array per province)
INSERT INTO "contacts-location" (type, value) VALUES
  ('cities_1', '[
    {
      "id": "1001",
      "province_id": "1",
      "name": "Jakarta Pusat",
      "link": "https://maps.google.com/?q=Jakarta+Pusat",
      "created_at": "2025-01-08T00:00:00Z",
      "updated_at": "2025-01-08T00:00:00Z"
    },
    {
      "id": "1002",
      "province_id": "1",
      "name": "Jakarta Selatan",
      "link": "https://maps.google.com/?q=Jakarta+Selatan",
      "created_at": "2025-01-08T00:00:00Z",
      "updated_at": "2025-01-08T00:00:00Z"
    }
  ]')
ON CONFLICT (type) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE "contacts-location" IS 'Stores contact information and location data using a flexible key-value structure';
COMMENT ON COLUMN "contacts-location".type IS 'Unique identifier for the data type (e.g., head_office, phone, provinces, cities_1)';
COMMENT ON COLUMN "contacts-location".value IS 'The actual data value, can be text, HTML, URL, or JSON string';
