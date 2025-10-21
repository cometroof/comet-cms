import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Eye, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ArticleFormData, Article } from "./types";
import * as articleService from "@/services/article.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Default empty article used as a fallback
const emptyArticle: Article = {
  id: "",
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  metaTitle: "",
  metaDescription: "",
  status: "draft",
  views: 0,
  author: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const ArticleEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    published: false,
  });

  const queryClient = useQueryClient();

  const { data: article, isLoading: isLoadingArticle } = useQuery({
    queryKey: ["article", id],
    queryFn: () => articleService.getArticleById(id || ""),
    enabled: !!id,
    staleTime: 0, // Always refetch when accessed
  });

  // Handle article data when it changes
  useEffect(() => {
    if (article) {
      // Article found, update the form data with article content
      setFormData({
        title: article.title,
        slug: article.slug,
        content: article.content || "", // Ensure content is never null
        excerpt: article.excerpt || "",
        metaTitle: article.metaTitle || "",
        metaDescription: article.metaDescription || "",
        published: article.status === "published",
      });
    } else if (article === null && !isLoadingArticle) {
      // Article not found
      toast({
        title: "Error",
        description: "Article not found",
        variant: "destructive",
      });
      navigate("/dashboard/articles");
    }
  }, [article, isLoadingArticle, navigate, toast]);

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; formData: ArticleFormData }) =>
      articleService.updateArticle(data.id, data.formData),
    onMutate: async (updateData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["articles"] });
      await queryClient.cancelQueries({ queryKey: ["articlesStats"] });

      // Snapshot previous values
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

      // Create an optimistic article update
      if (previousArticles && article) {
        const wasPublished = article.status === "published";
        const willBePublished = updateData.formData.published;

        // Update the article list
        queryClient.setQueryData<Article[]>(
          ["articles"],
          previousArticles.map((a) =>
            a.id === updateData.id
              ? {
                  ...a,
                  title: updateData.formData.title,
                  slug: updateData.formData.slug,
                  content: updateData.formData.content,
                  excerpt: updateData.formData.excerpt,
                  metaTitle: updateData.formData.metaTitle,
                  metaDescription: updateData.formData.metaDescription,
                  status: updateData.formData.published ? "published" : "draft",
                  updatedAt: new Date().toISOString(),
                  publishedDate: updateData.formData.published
                    ? new Date().toISOString()
                    : undefined,
                }
              : a,
          ),
        );

        // Update the individual article
        queryClient.setQueryData<Article>(["article", updateData.id], {
          ...article,
          title: updateData.formData.title,
          slug: updateData.formData.slug,
          content: updateData.formData.content,
          excerpt: updateData.formData.excerpt || "",
          metaTitle: updateData.formData.metaTitle || "",
          metaDescription: updateData.formData.metaDescription || "",
          status: updateData.formData.published ? "published" : "draft",
          updatedAt: new Date().toISOString(),
          publishedDate: updateData.formData.published
            ? new Date().toISOString()
            : undefined,
        });

        // Update stats if publish status changed
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
        description: `Article "${formData.title}" has been ${formData.published ? "published" : "saved as draft"}`,
      });
      navigate("/dashboard/articles");
    },
    onError: (error, _, context) => {
      // Revert back to previous values
      if (context?.previousArticles) {
        queryClient.setQueryData(["articles"], context.previousArticles);
      }
      if (context?.previousArticle) {
        queryClient.setQueryData(["article", id], context.previousArticle);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(["articlesStats"], context.previousStats);
      }

      console.error("Error updating article:", error);
      toast({
        title: "Error",
        description: "Failed to update article. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["articlesStats"] });
      queryClient.invalidateQueries({ queryKey: ["article", id as string] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: articleService.deleteArticle,
    onMutate: async (articleId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["articles"] });
      await queryClient.cancelQueries({ queryKey: ["articlesStats"] });

      // Save current state
      const previousArticles = queryClient.getQueryData<Article[]>([
        "articles",
      ]);
      const previousStats = queryClient.getQueryData<{
        total: number;
        published: number;
        drafts: number;
      }>(["articlesStats"]);

      // Find the article to be deleted
      const articleToDelete = (previousArticles as Article[])?.find(
        (article) => article.id === articleId,
      );

      if (previousArticles && articleToDelete) {
        // Optimistically update articles list
        queryClient.setQueryData<Article[]>(
          ["articles"],
          previousArticles.filter((article) => article.id !== articleId),
        );

        // Optimistically update stats
        if (previousStats) {
          const isPublished = articleToDelete.status === "published";
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
      // Revert optimistic updates on error
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
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["articlesStats"] });
    },
  });

  const isLoading = updateMutation.isPending;
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
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: generateSlug(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    updateMutation.mutate({ id, formData });
  };

  const handleDelete = async () => {
    if (!id) return;

    if (
      !confirm(
        "Are you sure you want to delete this article? This action cannot be undone.",
      )
    ) {
      return;
    }

    deleteMutation.mutate(id);
  };

  const handleSaveDraft = () => {
    setFormData((prev) => ({ ...prev, published: false }));
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handlePublish = () => {
    setFormData((prev) => ({ ...prev, published: true }));
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

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
          onSubmit={handleSubmit}
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
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter article title..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="article-url-slug"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    URL-friendly version of the title
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        excerpt: e.target.value,
                      }))
                    }
                    placeholder="Brief description of the article..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  {!isLoadingArticle && formData.content && (
                    <RichTextEditor
                      value={formData.content}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, content: value }))
                      }
                      className="min-h-[300px]"
                      key={`article-editor-${id}`}
                    />
                  )}
                  {isLoadingArticle && (
                    <div className="flex justify-center items-center border rounded-lg min-h-[300px] bg-muted/20">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                      <p>Loading content...</p>
                    </div>
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
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        metaTitle: e.target.value,
                      }))
                    }
                    placeholder="SEO title for search engines..."
                    maxLength={60}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.metaTitle.length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        metaDescription: e.target.value,
                      }))
                    }
                    placeholder="SEO description for search engines..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.metaDescription.length}/160 characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="published" className="text-sm font-medium">
                    Published
                  </Label>
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, published: checked }))
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Toggle to publish or unpublish the article
                </p>
              </CardContent>
            </Card>

            {/* Article Info */}
            <Card>
              <CardHeader>
                <CardTitle>Article Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Author</p>
                  <p className="text-muted-foreground">
                    {(article as Article)?.author || "Admin"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {(article as Article)?.createdAt
                      ? new Date(
                          (article as Article).createdAt,
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Last Updated
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(article as Article)?.updatedAt
                      ? new Date(
                          (article as Article).updatedAt,
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Article Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {formData.title || "Article Title"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      /{formData.slug || "article-slug"}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {formData.excerpt || "Article excerpt will appear here..."}
                  </p>
                  <Button variant="outline" size="sm" className="gap-2 w-full">
                    <Eye className="w-4 h-4" />
                    Preview Article
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                onClick={handlePublish}
                disabled={isLoading || !formData.title || !formData.content}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
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
                disabled={isLoading || !formData.title}
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
    </DashboardLayout>
  );
};

export default ArticleEdit;
