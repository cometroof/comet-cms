# Slider Database Integration

This document describes the slider database integration implemented for the CMS.

## Overview

The slider functionality has been integrated with Supabase database, replacing the mock data with real database operations.

## Database Schema

### Table: `slider`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `type` | VARCHAR(255) | Type of slider (default: "home-cover") |
| `image` | TEXT | Image URL or path |
| `title_en` | VARCHAR(200) | Title in English |
| `title_id` | VARCHAR(200) | Title in Indonesian |
| `description_en` | VARCHAR(500) | Description in English |
| `description_id` | VARCHAR(500) | Description in Indonesian |
| `link` | TEXT | Optional link URL |
| `link_text` | VARCHAR(100) | Optional link button text |
| `order` | INTEGER | Display order (lower numbers first) |
| `created_at` | TIMESTAMP | Auto-generated creation timestamp |
| `updated_at` | TIMESTAMP | Auto-updated timestamp |

### Indexes

- `idx_slider_type` - Index on `type` column
- `idx_slider_order` - Index on `order` column
- `idx_slider_type_order` - Composite index on `type` and `order`

### Security

- Row Level Security (RLS) is enabled
- Authenticated users have full CRUD access
- Anonymous users have read-only access

## Files Created/Modified

### Database

- `supabase/migrations/20250108_create_slider_table.sql` - Migration to create the slider table
- `supabase/migrations/README.md` - Instructions for applying migrations

### Services

- `src/services/slider.service.ts` - Service layer for slider CRUD operations
  - `getSlidersByType()` - Get sliders by type
  - `getAllSliders()` - Get all sliders
  - `getSliderById()` - Get single slider
  - `createSlider()` - Create new slider
  - `updateSlider()` - Update existing slider
  - `deleteSlider()` - Delete slider
  - `updateSliderOrder()` - Update order of multiple sliders
  - `deleteSlidersByType()` - Delete all sliders of a type
  - `bulkUpsertSliders()` - Bulk insert/update sliders

### UI Components

- `src/pages/home/Home.tsx` - Updated to use database API
  - Added loading states
  - Added saving states
  - Integrated with slider service
  - Error handling for all operations
- `src/pages/home/types.ts` - Added `type` field to Slider interface

## Features

### Current Features

1. **CRUD Operations**
   - Create new sliders
   - Read/list sliders
   - Update existing sliders
   - Delete sliders

2. **Drag & Drop Reordering**
   - Drag to reorder sliders
   - Automatically updates order in database
   - Reverts on error

3. **Multilingual Support**
   - English (EN) and Indonesian (ID) content
   - Tab-based UI for language switching
   - Auto-focus on EN tab when editing existing sliders

4. **Form Validation**
   - Required field validation
   - Character limit enforcement
   - URL validation for links
   - Real-time character counters

5. **Loading States**
   - Loading indicator while fetching data
   - Saving indicator during create/update
   - Disabled buttons during operations

## Usage

### Apply the Migration

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Open and execute `supabase/migrations/20250108_create_slider_table.sql`

Or use Supabase CLI:
```bash
supabase db execute --file supabase/migrations/20250108_create_slider_table.sql
```

### Using the Slider Service

```typescript
import * as sliderService from '@/services/slider.service';

// Get all home cover sliders
const sliders = await sliderService.getSlidersByType('home-cover');

// Create a new slider
const newSlider = await sliderService.createSlider({
  type: 'home-cover',
  image: '/path/to/image.jpg',
  title_en: 'Title',
  title_id: 'Judul',
  description_en: 'Description',
  description_id: 'Deskripsi',
  order: 1
});

// Update a slider
const updated = await sliderService.updateSlider(sliderId, {
  title_en: 'New Title'
});

// Delete a slider
await sliderService.deleteSlider(sliderId);

// Reorder sliders
await sliderService.updateSliderOrder([
  { id: 'slider1', order: 1 },
  { id: 'slider2', order: 2 }
]);
```

## Type Field

The `type` field allows for multiple slider types in the future:
- `home-cover` - Homepage cover sliders (current implementation)
- `product-banner` - Product page banners (future)
- `promotion-slider` - Promotional sliders (future)

## Future Enhancements

1. Add image upload functionality
2. Add slider preview
3. Add publish/draft status
4. Add scheduling (start/end dates)
5. Add analytics tracking
6. Add A/B testing support
