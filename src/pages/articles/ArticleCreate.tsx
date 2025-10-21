import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ArticleFormData, Article } from "./types";
import { RichTextEditor } from "@/components/RichTextEditor";
import * as articleService from "@/services/article.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const ArticleCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    slug: "",
    content: "<p></p>", // Initialize with an empty paragraph for the RichTextEditor
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    published: false,
  });

  const queryClient = useQueryClient();

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
      metaTitle: value,
    }));
  };

  const createMutation = useMutation({
    mutationFn: articleService.createArticle,
    onMutate: async (newArticleData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["articles"] });
      await queryClient.cancelQueries({ queryKey: ["articlesStats"] });

      // Snapshot previous values
      const previousArticles = queryClient.getQueryData<Article[]>([
        "articles",
      ]);
      const previousStats = queryClient.getQueryData<{
        total: number;
        published: number;
        drafts: number;
      }>(["articlesStats"]);

      // Create a temporary ID for the optimistic article
      const tempId = `temp-${Date.now()}`;

      // Create an optimistic article entry
      const optimisticArticle: Article = {
        id: tempId,
        title: newArticleData.title,
        slug: newArticleData.slug,
        content: newArticleData.content,
        excerpt: newArticleData.excerpt || "",
        metaTitle: newArticleData.metaTitle || "",
        metaDescription: newArticleData.metaDescription || "",
        status: newArticleData.published ? "published" : "draft",
        views: 0,
        author: "You", // Temporary author name
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedDate: newArticleData.published
          ? new Date().toISOString()
          : undefined,
      };

      // Optimistically update articles list
      if (previousArticles) {
        queryClient.setQueryData<Article[]>(
          ["articles"],
          [optimisticArticle, ...previousArticles],
        );
      }

      // Optimistically update stats
      if (previousStats) {
        queryClient.setQueryData<{
          total: number;
          published: number;
          drafts: number;
        }>(["articlesStats"], {
          total: previousStats.total + 1,
          published: newArticleData.published
            ? previousStats.published + 1
            : previousStats.published,
          drafts: !newArticleData.published
            ? previousStats.drafts + 1
            : previousStats.drafts,
        });
      }

      return { previousArticles, previousStats };
    },
    onSuccess: (result) => {
      toast({
        title: "Article Created",
        description: `Article "${formData.title}" has been ${formData.published ? "published" : "saved as draft"}`,
      });
      navigate("/dashboard/articles");
    },
    onError: (error, newArticle, context) => {
      // Revert back to previous values if there's an error
      if (context?.previousArticles) {
        queryClient.setQueryData(["articles"], context.previousArticles);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(["articlesStats"], context.previousStats);
      }

      console.error("Error creating article:", error);
      toast({
        title: "Error",
        description: "Failed to create article. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["articlesStats"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
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
              Create New Article
            </h1>
            <p className="text-muted-foreground mt-2">
              Write and publish a new blog post for your roofing company
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
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
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, content: value }))
                    }
                    className="min-h-[300px]"
                    key="article-content-editor"
                  />
                  <p className="text-sm text-muted-foreground">
                    Format your article with the rich text editor
                  </p>
                </div>
              </CardContent>
            </Card>

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

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="published" className="text-sm font-medium">
                    Publish immediately
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
                  Toggle to publish the article immediately or save as draft
                </p>
              </CardContent>
            </Card>

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

            <div className="space-y-3">
              <Button
                type="button"
                onClick={handlePublish}
                disabled={
                  createMutation.isPending ||
                  !formData.title ||
                  !formData.content
                }
                className="w-full gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Publish Article
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={createMutation.isPending || !formData.title}
                className="w-full gap-2"
              >
                {createMutation.isPending ? (
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

export default ArticleCreate;
