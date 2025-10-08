# Database Migrations

This directory contains SQL migration files for the Supabase database.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of the migration file
5. Paste into the SQL Editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Apply a specific migration
supabase db execute --file supabase/migrations/MIGRATION_FILE.sql

# Or apply all pending migrations
supabase db push
```

## Migration Files

- `20250108_create_contacts_location_table.sql` - Creates the contacts-location table for storing contact information and location data
- `20250108_create_slider_table.sql` - Creates the slider table for storing homepage slider/carousel content with multilingual support

## Migration Order

Migrations should be applied in chronological order based on the timestamp prefix in the filename.

## Notes

- All migrations include Row Level Security (RLS) policies
- Authenticated users have full access
- Anonymous users have read-only access
- The `updated_at` column is automatically updated via trigger
