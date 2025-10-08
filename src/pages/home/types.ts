export interface Slider {
  id: string;
  type: string;
  image: string;
  title_en: string;
  title_id: string;
  description_en: string;
  description_id: string;
  link: string | null;
  link_text: string | null;
  order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface Cover {
  id: string;
  type: string;
  image: string;
  order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface HomeCovers {
  projects_cover_image: string;
  distribution_cover_image: string;
  updated_at: string;
}
