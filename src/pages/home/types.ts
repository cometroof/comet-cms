export interface Slider {
  id: string;
  type: string;
  image: string;
  title_en: string;
  title_id: string;
  description_en: string;
  description_id: string;
  link?: string;
  link_text?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface HomeCovers {
  projects_cover_image: string;
  distribution_cover_image: string;
  updated_at: string;
}
