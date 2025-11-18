// Article types with bilingual support
export interface Article {
  id: string;
  title: string;
  title_id?: string; // Indonesian title
  slug: string;
  content: string | null;
  content_id?: string | null; // Indonesian content
  excerpt: string | null;
  excerpt_id?: string | null; // Indonesian excerpt
  metaTitle: string | null;
  metaTitle_id?: string | null; // Indonesian meta title
  metaDescription: string | null;
  metaDescription_id?: string | null; // Indonesian meta description
  status: "draft" | "published";
  views: number;
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedDate?: string;
  cover_image: string | null;
}

export interface ArticleFormData {
  title: string;
  title_id?: string;
  slug: string;
  content: string;
  content_id?: string;
  excerpt: string;
  excerpt_id?: string;
  metaTitle: string;
  metaTitle_id?: string;
  metaDescription: string;
  metaDescription_id?: string;
  published: boolean;
  cover_image: string | null;
}

export interface ArticleStats {
  total: number;
  published: number;
  drafts: number;
}
