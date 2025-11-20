import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Eye, Trash2, Loader2, Languages } from "lucide-react";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import { useToast } from "@/hooks/use-toast";
import { ArticleFormData, Article } from "./types";
import * as articleService from "@/services/article.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Zod schema untuk validasi form - SESUAIKAN DENGAN ArticleFormData
const articleFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  title_id: z.string().default(""),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().min(1, "Content is required"),
  content_id: z.string().default(""),
  excerpt: z.string().default(""),
  excerpt_id: z.string().default(""),
  seoTitle: z.string().default(""), // GUNAKAN seoTitle BUKAN metaTitle
  seoTitle_id: z.string().default(""),
  seoDescription: z.string().default(""), // GUNAKAN seoDescription BUKAN metaDescription
  seoDescription_id: z.string().default(""),
  published: z.boolean().default(false),
  cover_image: z.string().nullable().default(null),
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;

type Language = "en" | "id";

const ArticleEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>("en");

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
    trigger,
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: "",
      title_id: "",
      slug: "",
      content: "",
      content_id: "",
      excerpt: "",
      excerpt_id: "",
      seoTitle: "",
      seoTitle_id: "",
      seoDescription: "",
      seoDescription_id: "",
      published: false,
      cover_image: null,
    },
  });

  // Watch form values
  const formValues = watch();
  const published = watch("published");
  const cover_image = watch("cover_image");

  const queryClient = useQueryClient();

  const { data: article, isLoading: isLoadingArticle } = useQuery({
    queryKey: ["article", id],
    queryFn: () => articleService.getArticleById(id || ""),
    enabled: !!id,
    staleTime: 0,
  });

  // Handle article data when it changes
  useEffect(() => {
    if (article) {
      reset({
        title: article.title,
        title_id: article.title_id || "",
        slug: article.slug,
        content: article.content || "",
        content_id: article.content_id || "",
        excerpt: article.excerpt || "",
        excerpt_id: article.excerpt_id || "",
        seoTitle: article.seo_title || "", // MAP ke seoTitle
        seoTitle_id: article.seo_title_id || "",
        seoDescription: article.seo_description || "", // MAP ke seoDescription
        seoDescription_id: article.seo_description_id || "",
        published: article.publish || false,
        cover_image: article.cover_image,
      });
    } else if (article === null && !isLoadingArticle) {
      toast({
        title: "Error",
        description: "Article not found",
        variant: "destructive",
      });
      navigate("/dashboard/articles");
    }
  }, [article, isLoadingArticle, navigate, toast, reset]);

  // Fungsi untuk convert ArticleFormValues ke ArticleFormData
  const convertToArticleFormData = (
    values: ArticleFormValues
  ): ArticleFormData => ({
    title: values.title,
    title_id: values.title_id,
    slug: values.slug,
    content: values.content,
    content_id: values.content_id,
    excerpt: values.excerpt,
    excerpt_id: values.excerpt_id,
    seoTitle: values.seoTitle,
    seoTitle_id: values.seoTitle_id,
    seoDescription: values.seoDescription,
    seoDescription_id: values.seoDescription_id,
    published: values.published,
    cover_image: values.cover_image,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; formData: ArticleFormData }) =>
      articleService.updateArticle(data.id, data.formData),
    onMutate: async (updateData) => {
      await queryClient.cancelQueries({ queryKey: ["articles"] });
      await queryClient.cancelQueries({ queryKey: ["articlesStats"] });

      const previousArticles = queryClient.getQueryData<Article[]>([
        "articles",
      ]);
      const previousArticle = queryClient.getQueryData<Article>([
        "article",
        updateData.id,
      ]);
      const previousStats = queryClient.getQueryData<{
        total: number;
        published: number;
        drafts: number;
      }>(["articlesStats"]);

      if (previousArticles && article) {
        const wasPublished = article.publish;
        const willBePublished = updateData.formData.published;

        queryClient.setQueryData<Article[]>(
          ["articles"],
          previousArticles.map((a) =>
            a.id === updateData.id
              ? {
                  ...a,
                  title: updateData.formData.title,
                  title_id: updateData.formData.title_id,
                  slug: updateData.formData.slug,
                  content: updateData.formData.content,
                  content_id: updateData.formData.content_id,
                  excerpt: updateData.formData.excerpt,
                  excerpt_id: updateData.formData.excerpt_id,
                  seo_title: updateData.formData.seoTitle, // GUNAKAN seo_title
                  seo_title_id: updateData.formData.seoTitle_id,
                  seo_description: updateData.formData.seoDescription, // GUNAKAN seo_description
                  seo_description_id: updateData.formData.seoDescription_id,
                  publish: updateData.formData.published,
                  updated_at: new Date().toISOString(),
                }
              : a
          )
        );

        queryClient.setQueryData<Article>(["article", updateData.id], {
          ...article,
          title: updateData.formData.title,
          title_id: updateData.formData.title_id,
          slug: updateData.formData.slug,
          content: updateData.formData.content,
          content_id: updateData.formData.content_id,
          excerpt: updateData.formData.excerpt,
          excerpt_id: updateData.formData.excerpt_id,
          seo_title: updateData.formData.seoTitle,
          seo_title_id: updateData.formData.seoTitle_id,
          seo_description: updateData.formData.seoDescription,
          seo_description_id: updateData.formData.seoDescription_id,
          publish: updateData.formData.published,
          updated_at: new Date().toISOString(),
        });

        if (previousStats && wasPublished !== willBePublished) {
          queryClient.setQueryData<{
            total: number;
            published: number;
            drafts: number;
          }>(["articlesStats"], {
            total: previousStats.total,
            published: willBePublished
              ? previousStats.published + 1
              : previousStats.published - 1,
            drafts: willBePublished
              ? previousStats.drafts - 1
              : previousStats.drafts + 1,
          });
        }
      }

      return { previousArticles, previousArticle, previousStats };
    },
    onSuccess: () => {
      toast({
        title: "Article Updated",
        description: `Article "${formValues.title}" has been ${
          formValues.published ? "published" : "saved as draft"
        }`,
      });
      navigate("/dashboard/articles");
    },
    onError: (error, _, context) => {
      if (context && context?.previousArticles) {
        queryClient.setQueryData(["articles"], context.previousArticles);
      }
      if (context && context?.previousArticle) {
        queryClient.setQueryData(["article", id], context.previousArticle);
      }
      if (context && context?.previousStats) {
        queryClient.setQueryData(["articlesStats"], context.previousStats);
      }

      toast({
        title: "Error",
        description: "Failed to update article. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["articlesStats"] });
      queryClient.invalidateQueries({ queryKey: ["article", id as string] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: articleService.deleteArticle,
    onMutate: async (articleId) => {
      await queryClient.cancelQueries({ queryKey: ["articles"] });
      await queryClient.cancelQueries({ queryKey: ["articlesStats"] });

      const previousArticles = queryClient.getQueryData<Article[]>([
        "articles",
      ]);
      const previousStats = queryClient.getQueryData<{
        total: number;
        published: number;
        drafts: number;
      }>(["articlesStats"]);

      const articleToDelete = (previousArticles as Article[])?.find(
        (article) => article.id === articleId
      );

      if (previousArticles && articleToDelete) {
        queryClient.setQueryData<Article[]>(
          ["articles"],
          previousArticles.filter((article) => article.id !== articleId)
        );

        if (previousStats) {
          const isPublished = articleToDelete.publish;
          queryClient.setQueryData<{
            total: number;
            published: number;
            drafts: number;
          }>(["articlesStats"], {
            total: previousStats.total - 1,
            published: isPublished
              ? previousStats.published - 1
              : previousStats.published,
            drafts: !isPublished
              ? previousStats.drafts - 1
              : previousStats.drafts,
          });
        }
      }

      return { previousArticles, previousStats };
    },
    onSuccess: () => {
      toast({
        title: "Article Deleted",
        description: "The article has been permanently deleted",
        variant: "destructive",
      });
      navigate("/dashboard/articles");
    },
    onError: (error, _, context) => {
      if (context?.previousArticles) {
        queryClient.setQueryData(["articles"], context.previousArticles);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(["articlesStats"], context.previousStats);
      }

      console.error("Error deleting article:", error);
      toast({
        title: "Error",
        description: "Failed to delete article. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["articlesStats"] });
    },
  });

  const isLoading = updateMutation.isPending || isSubmitting;
  const isDeleting = deleteMutation.isPending;

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    if (currentLang === "en") {
      setValue("title", value, { shouldValidate: true });
      // setValue("slug", generateSlug(value), { shouldValidate: true });
    } else {
      setValue("title_id", value, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: ArticleFormValues) => {
    if (!id) return;
    const formData = convertToArticleFormData(data);
    updateMutation.mutate({ id, formData });
  };

  const handleDelete = async () => {
    if (!id) return;

    if (
      !confirm(
        "Are you sure you want to delete this article? This action cannot be undone."
      )
    ) {
      return;
    }

    deleteMutation.mutate(id);
  };

  const handleSaveDraft = async () => {
    setValue("published", false, { shouldValidate: true });
    const isValid = await trigger(["title", "content"]);
    if (isValid) {
      handleSubmit(onSubmit)();
    }
  };

  const handlePublish = async () => {
    setValue("published", true, { shouldValidate: true });
    const isValid = await trigger(["title", "content", "slug"]);
    if (isValid) {
      handleSubmit(onSubmit)();
    }
  };

  // Get current field values based on selected language
  const getCurrentTitle = () =>
    currentLang === "en" ? formValues.title : formValues.title_id;
  const getCurrentExcerpt = () =>
    currentLang === "en" ? formValues.excerpt : formValues.excerpt_id;
  const getCurrentContent = () =>
    currentLang === "en" ? formValues.content : formValues.content_id;
  const getCurrentSeoTitle = () =>
    currentLang === "en" ? formValues.seoTitle : formValues.seoTitle_id;
  const getCurrentSeoDescription = () =>
    currentLang === "en"
      ? formValues.seoDescription
      : formValues.seoDescription_id;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/articles")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Articles
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Edit Article
              </h1>
              <p className="text-muted-foreground mt-2">
                Update your roofing company blog post
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Article Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title * ({currentLang.toUpperCase()})
                  </Label>
                  <Input
                    id="title"
                    value={getCurrentTitle()}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder={
                      currentLang === "en"
                        ? "Enter article title..."
                        : "Masukkan judul artikel..."
                    }
                    required
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">
                    Excerpt ({currentLang.toUpperCase()})
                  </Label>
                  <Textarea
                    id="excerpt"
                    value={getCurrentExcerpt()}
                    onChange={(e) =>
                      setValue(
                        currentLang === "en" ? "excerpt" : "excerpt_id",
                        e.target.value
                      )
                    }
                    placeholder={
                      currentLang === "en"
                        ? "Brief description of the article..."
                        : "Deskripsi singkat artikel..."
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">
                    Content * ({currentLang.toUpperCase()})
                  </Label>
                  {!isLoadingArticle &&
                    (formValues.content || formValues.content_id) && (
                      <>
                        <RichTextEditor
                          value={formValues.content}
                          onChange={(value) => setValue("content", value)}
                          key={`editor-en-${id}`}
                          className={currentLang === "en" ? "" : "hidden"}
                        />

                        <RichTextEditor
                          value={formValues.content_id}
                          onChange={(value) => setValue("content_id", value)}
                          key={`editor-id-${id}`}
                          className={currentLang === "id" ? "" : "hidden"}
                        />
                      </>
                    )}
                  {isLoadingArticle && (
                    <div className="flex justify-center items-center border rounded-lg min-h-[300px] bg-muted/20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                      <p>Loading content...</p>
                    </div>
                  )}
                  {errors.content && (
                    <p className="text-sm text-destructive">
                      {errors.content.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Format your article with the rich text editor
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>
                  SEO Settings ({currentLang.toUpperCase()})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">
                    SEO Title ({currentLang.toUpperCase()})
                  </Label>
                  <Input
                    id="seoTitle"
                    value={getCurrentSeoTitle()}
                    onChange={(e) =>
                      setValue(
                        currentLang === "en" ? "seoTitle" : "seoTitle_id",
                        e.target.value
                      )
                    }
                    placeholder={
                      currentLang === "en"
                        ? "SEO title for search engines..."
                        : "Judul SEO untuk mesin pencari..."
                    }
                    maxLength={60}
                  />
                  <p className="text-sm text-muted-foreground">
                    {getCurrentSeoTitle().length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoDescription">
                    SEO Description ({currentLang.toUpperCase()})
                  </Label>
                  <Textarea
                    id="seoDescription"
                    value={getCurrentSeoDescription()}
                    onChange={(e) =>
                      setValue(
                        currentLang === "en"
                          ? "seoDescription"
                          : "seoDescription_id",
                        e.target.value
                      )
                    }
                    placeholder={
                      currentLang === "en"
                        ? "SEO description for search engines..."
                        : "Deskripsi SEO untuk mesin pencari..."
                    }
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-sm text-muted-foreground">
                    {getCurrentSeoDescription().length}/160 characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Language Toggle */}
            <Card>
              <CardHeader>
                <CardTitle>Language / Bahasa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {currentLang === "en" ? "English" : "Indonesian"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <Button
                      type="button"
                      variant={currentLang === "en" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentLang("en")}
                      className="h-8 px-3"
                    >
                      EN
                    </Button>
                    <Button
                      type="button"
                      variant={currentLang === "id" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentLang("id")}
                      className="h-8 px-3"
                    >
                      ID
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Switch between English and Indonesian content
                </p>
              </CardContent>
            </Card>

            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-8">
                  <Label
                    htmlFor="published"
                    className={`text-sm font-medium ${
                      published ? "text-primary" : ""
                    }`}
                  >
                    Published
                  </Label>
                  <Switch
                    id="published"
                    checked={published}
                    onCheckedChange={(checked) => {
                      setValue("published", checked, { shouldValidate: true });
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {published
                    ? "Article is published and visible to public"
                    : "Article is saved as draft and not visible to public"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <div className="py-2 px-4 rounded-md bg-gray-100">
                      {formValues.slug}
                    </div>
                    {/* <Input
                      id="slug"
                      {...register("slug")}
                      placeholder="article-url-slug"
                      required
                      readOnly
                    />
                    {errors.slug && (
                      <p className="text-sm text-destructive">
                        {errors.slug.message}
                      </p>
                    )} */}
                    <p className="text-sm text-muted-foreground">
                      URL-friendly version of the title
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cover_image">Cover Image</Label>
                    <div className="flex items-center gap-2 ring-2 ring-transparent hover:ring-primary rounded-md ">
                      {cover_image && (
                        <div
                          className="rounded-md relative overflow-hidden"
                          role="button"
                          onClick={() => setImageSelectorOpen(true)}
                        >
                          <img
                            src={cover_image}
                            alt="Cover preview"
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Article Info */}
            <Card>
              <CardHeader>
                <CardTitle>Article Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {article?.created_at
                      ? new Date(article.created_at).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Last Updated
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {article?.updated_at
                      ? new Date(article.updated_at).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Publication Status
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {article?.publish ? "Published" : "Draft"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Article Preview */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Preview ({currentLang.toUpperCase()})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cover_image && (
                    <img
                      src={cover_image}
                      alt={getCurrentTitle()}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {getCurrentTitle() || "Article Title"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      /{formValues.slug || "article-slug"}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {getCurrentExcerpt() ||
                      "Article excerpt will appear here..."}
                  </p>
                  <Button variant="outline" size="sm" className="gap-2 w-full">
                    <Eye className="w-4 h-4" />
                    Preview Article
                  </Button>
                </div>
              </CardContent>
            </Card> */}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                onClick={handlePublish}
                disabled={isLoading || !formValues.title || !formValues.content}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update & Publish
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isLoading || !formValues.title}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save as Draft
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <ImageSelectorDialog
        open={imageSelectorOpen}
        onOpenChange={setImageSelectorOpen}
        onSelect={(imageUrl) => {
          setValue("cover_image", imageUrl);
          setImageSelectorOpen(false);
        }}
        title="Select Cover Image"
      />
    </DashboardLayout>
  );
};

export default ArticleEdit;
