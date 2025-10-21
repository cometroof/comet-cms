export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  status: "published" | "draft";
  publishedDate?: string;
  views: number;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
}
