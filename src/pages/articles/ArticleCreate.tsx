import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import { ArrowLeft, Save, Eye, Loader2, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ArticleFormData, Article } from "./types";
import { RichTextEditor } from "@/components/RichTextEditor";
import * as articleService from "@/services/article.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Language = "en" | "id";

const ArticleCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>("en");

  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    title_id: "",
    slug: "",
    content: "<p></p>",
    content_id: "",
    excerpt: "",
    excerpt_id: "",
    seoTitle: "",
    seoTitle_id: "",
    seoDescription: "",
    seoDescription_id: "",
    published: false,
    cover_image: null,
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
    if (currentLang === "en") {
      setFormData((prev) => ({
        ...prev,
        title: value,
        slug: generateSlug(value),
        seoTitle: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        title_id: value,
      }));
    }
  };

  const createMutation = useMutation({
    mutationFn: articleService.createArticle,
    onMutate: async (newArticleData) => {
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

      const tempId = `temp-${Date.now()}`;

      // Create an optimistic article entry - SESUAI DENGAN STRUCTURE BARU
      const optimisticArticle: Article = {
        id: tempId,
        title: newArticleData.title,
        title_id: newArticleData.title_id,
        slug: newArticleData.slug,
        content: newArticleData.content,
        content_id: newArticleData.content_id,
        excerpt: newArticleData.excerpt,
        excerpt_id: newArticleData.excerpt_id,
        seo_title: newArticleData.seoTitle,
        seo_title_id: newArticleData.seoTitle_id,
        seo_description: newArticleData.seoDescription,
        seo_description_id: newArticleData.seoDescription_id,
        publish: newArticleData.published,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cover_image: newArticleData.cover_image,
      };

      if (previousArticles) {
        queryClient.setQueryData<Article[]>(
          ["articles"],
          [optimisticArticle, ...previousArticles]
        );
      }

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
        description: `Article "${formData.title}" has been ${
          formData.published ? "published" : "saved as draft"
        }`,
      });
      navigate("/dashboard/articles");
    },
    onError: (error, newArticle, context) => {
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

  // Get current field values based on selected language
  const getCurrentTitle = () =>
    currentLang === "en" ? formData.title : formData.title_id;
  const getCurrentExcerpt = () =>
    currentLang === "en" ? formData.excerpt : formData.excerpt_id;
  const getCurrentContent = () =>
    currentLang === "en" ? formData.content : formData.content_id;
  const getCurrentSeoTitle = () =>
    currentLang === "en" ? formData.seoTitle : formData.seoTitle_id;
  const getCurrentSeoDescription = () =>
    currentLang === "en" ? formData.seoDescription : formData.seoDescription_id;

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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">
                    Excerpt ({currentLang.toUpperCase()})
                  </Label>
                  <Textarea
                    id="excerpt"
                    value={getCurrentExcerpt()}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [currentLang === "en" ? "excerpt" : "excerpt_id"]:
                          e.target.value,
                      }))
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
                  <RichTextEditor
                    value={getCurrentContent()}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        [currentLang === "en" ? "content" : "content_id"]:
                          value,
                      }))
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
                      setFormData((prev) => ({
                        ...prev,
                        [currentLang === "en" ? "seoTitle" : "seoTitle_id"]:
                          e.target.value,
                      }))
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
                      setFormData((prev) => ({
                        ...prev,
                        [currentLang === "en"
                          ? "seoDescription"
                          : "seoDescription_id"]: e.target.value,
                      }))
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
            <Card>
              <CardHeader>
                <CardTitle>Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="published" className="text-sm font-medium">
                    {formData.published ? "Published" : "Save as Draft"}
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

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    slug: e.target.value,
                  }))
                }
                placeholder="article-url-slug"
                required
              />
              <p className="text-sm text-muted-foreground">
                URL-friendly version of the title
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image">Cover Image</Label>
              <div className="flex items-center gap-2">
                {/* <Input
                  id="cover_image"
                  value={formData.cover_image || ""}
                  readOnly
                  placeholder="Select a cover image..."
                  className="flex-1"
                /> */}
                {formData.cover_image ? (
                  <div
                    className="relative rounded-md overflow-hidden w-full ring-2 ring-transparent hover:ring-primary"
                    role="button"
                    onClick={() => setImageSelectorOpen(true)}
                  >
                    <img
                      src={formData.cover_image}
                      alt="Cover preview"
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="rounded-md bg-gray-500 h-40"
                    role="button"
                    onClick={() => setImageSelectorOpen(true)}
                  />
                )}
              </div>
            </div>

            {/* <Card>
              <CardHeader>
                <CardTitle>Preview ({currentLang.toUpperCase()})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.cover_image && (
                    <img
                      src={formData.cover_image}
                      alt={getCurrentTitle()}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {getCurrentTitle() || "Article Title"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      /{formData.slug || "article-slug"}
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

        <ImageSelectorDialog
          open={imageSelectorOpen}
          onOpenChange={setImageSelectorOpen}
          onSelect={(imageUrl) => {
            setFormData((prev) => ({ ...prev, cover_image: imageUrl }));
            setImageSelectorOpen(false);
          }}
          title="Select Cover Image"
        />
      </div>
    </DashboardLayout>
  );
};

export default ArticleCreate;
