import { supabase } from "@/lib/supabase";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase-types";
import { Article, ArticleFormData } from "@/pages/articles/types";

const TABLE_NAME = "articles";

/**
 * Maps a database article to the frontend Article type
 */
const mapDbArticleToArticle = (dbArticle: Tables<"articles">): Article => {
  return {
    id: dbArticle.id,
    title: dbArticle.title,
    slug: dbArticle.slug,
    content: dbArticle.content || "",
    excerpt: dbArticle.excerpt || "",
    metaTitle: dbArticle.seo_title || "",
    metaDescription: dbArticle.seo_description || "",
    status: dbArticle.publish ? "published" : "draft",
    views: 0, // Views aren't currently tracked in the database
    author: "Admin", // Author info isn't currently in the database schema
    createdAt: dbArticle.created_at,
    updatedAt: dbArticle.updated_at,
    cover_image: dbArticle.cover_image,
    publishedDate: dbArticle.publish ? dbArticle.updated_at : undefined,
    title_id: dbArticle.title_id || undefined,
    content_id: dbArticle.content_id || undefined,
    excerpt_id: dbArticle.excerpt_id || undefined,
    metaTitle_id: dbArticle.seo_title_id || undefined,
    metaDescription_id: dbArticle.seo_description_id || undefined,
  };
};

/**
 * Maps form data to database insert/update structure
 */
const mapFormDataToDb = (
  formData: ArticleFormData
): Omit<TablesInsert<"articles">, "id" | "created_at" | "updated_at"> => {
  return {
    title: formData.title,
    slug: formData.slug,
    content: formData.content,
    excerpt: formData.excerpt || null,
    seo_title: formData.metaTitle || null,
    seo_description: formData.metaDescription || null,
    publish: formData.published,
    cover_image: formData.cover_image,
    title_id: formData.title_id || null,
    content_id: formData.content_id || null,
    excerpt_id: formData.excerpt_id || null,
    seo_title_id: formData.metaTitle_id || null,
    seo_description_id: formData.metaDescription_id || null,
  };
};

/**
 * Get all articles
 */
export const getAllArticles = async (): Promise<Article[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching articles:", error);
    return [];
  }

  return data.map(mapDbArticleToArticle);
};

/**
 * Get an article by ID
 */
export const getArticleById = async (id: string): Promise<Article | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching article with ID ${id}:`, error);
    return null;
  }

  return mapDbArticleToArticle(data);
};

/**
 * Get an article by slug
 */
export const getArticleBySlug = async (
  slug: string
): Promise<Article | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error(`Error fetching article with slug ${slug}:`, error);
    return null;
  }

  return mapDbArticleToArticle(data);
};

/**
 * Create a new article
 */
export const createArticle = async (
  formData: ArticleFormData
): Promise<Article | null> => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      ...mapFormDataToDb(formData),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating article:", error);
    return null;
  }

  return mapDbArticleToArticle(data);
};

/**
 * Update an existing article
 */
export const updateArticle = async (
  id: string,
  formData: ArticleFormData
): Promise<Article | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      ...mapFormDataToDb(formData),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating article with ID ${id}:`, error);
    return null;
  }

  return mapDbArticleToArticle(data);
};

/**
 * Delete an article
 */
export const deleteArticle = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    console.error(`Error deleting article with ID ${id}:`, error);
    return false;
  }

  return true;
};

/**
 * Check if a slug is available (not used by any other article)
 */
export const isSlugAvailable = async (
  slug: string,
  excludeId?: string
): Promise<boolean> => {
  let query = supabase.from(TABLE_NAME).select("id").eq("slug", slug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Error checking slug availability for ${slug}:`, error);
    return false;
  }

  return data.length === 0;
};

/**
 * Get article statistics
 */
export const getArticleStats = async (): Promise<{
  total: number;
  published: number;
  drafts: number;
}> => {
  const { data, error } = await supabase.from(TABLE_NAME).select("publish");

  if (error) {
    console.error("Error fetching article statistics:", error);
    return { total: 0, published: 0, drafts: 0 };
  }

  const total = data.length;
  const published = data.filter((article) => article.publish).length;

  return {
    total,
    published,
    drafts: total - published,
  };
};
