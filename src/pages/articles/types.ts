import { Database } from "@/lib/supabase-types";

// Article types with bilingual support - SESUAIKAN DENGAN DATABASE
export interface Article {
  id: string;
  title: string;
  title_id: string | null;
  slug: string;
  content: string | null;
  content_id: string | null;
  excerpt: string | null;
  excerpt_id: string | null;
  // GUNAKAN nama field yang sesuai dengan database untuk SEO
  seo_title: string | null;
  seo_title_id: string | null;
  seo_description: string | null;
  seo_description_id: string | null;
  publish: boolean | null; // SESUAI DENGAN DATABASE
  created_at: string;
  updated_at: string;
  cover_image: string | null;
}

export interface ArticleFormData {
  title: string;
  title_id: string;
  slug: string;
  content: string;
  content_id: string;
  excerpt: string;
  excerpt_id: string;
  // GUNAKAN nama yang sama dengan database untuk konsistensi
  seoTitle: string;
  seoTitle_id: string;
  seoDescription: string;
  seoDescription_id: string;
  published: boolean;
  cover_image: string | null;
}

export interface ArticleStats {
  total: number;
  published: number;
  drafts: number;
}

// Helper function untuk convert dari database row ke Article
export const mapDbArticleToArticle = (
  dbArticle: Database["public"]["Tables"]["articles"]["Row"]
): Article => ({
  id: dbArticle.id,
  title: dbArticle.title,
  title_id: dbArticle.title_id,
  slug: dbArticle.slug,
  content: dbArticle.content,
  content_id: dbArticle.content_id,
  excerpt: dbArticle.excerpt,
  excerpt_id: dbArticle.excerpt_id,
  seo_title: dbArticle.seo_title,
  seo_title_id: dbArticle.seo_title_id,
  seo_description: dbArticle.seo_description,
  seo_description_id: dbArticle.seo_description_id,
  publish: dbArticle.publish,
  created_at: dbArticle.created_at,
  updated_at: dbArticle.updated_at,
  cover_image: dbArticle.cover_image,
});
