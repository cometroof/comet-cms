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
    title_id: formData.title_id || null,
    slug: formData.slug,
    content: formData.content,
    content_id: formData.content_id || null,
    excerpt: formData.excerpt || null,
    excerpt_id: formData.excerpt_id || null,
    seo_title: formData.seoTitle || null,
    seo_title_id: formData.seoTitle_id || null,
    seo_description: formData.seoDescription || null,
    seo_description_id: formData.seoDescription_id || null,
    publish: formData.published,
    cover_image: formData.cover_image,
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
      created_at: now,
      updated_at: now,
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
      title: formData.title,
      title_id: formData.title_id || null,
      slug: formData.slug,
      content: formData.content,
      content_id: formData.content_id || null,
      excerpt: formData.excerpt || null,
      excerpt_id: formData.excerpt_id || null,
      seo_title: formData.seoTitle || null,
      seo_title_id: formData.seoTitle_id || null,
      seo_description: formData.seoDescription || null,
      seo_description_id: formData.seoDescription_id || null,
      publish: formData.published,
      cover_image: formData.cover_image,
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
