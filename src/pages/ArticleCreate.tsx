import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ArticleCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    published: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: generateSlug(value),
      metaTitle: value, // Auto-fill meta title
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock save - replace with actual API call
    setTimeout(() => {
      toast({
        title: "Article Created",
        description: `Article "${formData.title}" has been ${formData.published ? 'published' : 'saved as draft'}`,
      });
      navigate("/dashboard/articles");
      setIsLoading(false);
    }, 1000);
  };

  const handleSaveDraft = () => {
    setFormData(prev => ({ ...prev, published: false }));
    handleSubmit(new Event('submit') as any);
  };

  const handlePublish = () => {
    setFormData(prev => ({ ...prev, published: true }));
    handleSubmit(new Event('submit') as any);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
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
            <h1 className="text-3xl font-bold text-foreground">Create New Article</h1>
            <p className="text-muted-foreground mt-2">
              Write and publish a new blog post for your roofing company
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief description of the article..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your article content here..."
                    rows={12}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Write your article in Markdown or plain text
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
                    onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
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
                    Publish immediately
                  </Label>
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, published: checked }))
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Toggle to publish the article immediately or save as draft
                </p>
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
                <Save className="w-4 h-4" />
                {isLoading ? "Publishing..." : "Publish Article"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isLoading || !formData.title}
                className="w-full gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Saving..." : "Save as Draft"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ArticleCreate;