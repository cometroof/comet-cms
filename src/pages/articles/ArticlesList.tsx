import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { DropResult } from "@hello-pangea/dnd";
import { Article } from "./types";
import * as articleService from "@/services/article.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const ArticlesList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  // Create listener for updates from other components (create/edit)
  useEffect(() => {
    // Listen for data invalidation from article create/edit components
    // This is a placeholder for actual inter-component communication
    // In a real app, you might use a pub/sub system or context

    return () => {
      // Cleanup
    };
  }, []);

  const { data: articles = [], isLoading: isLoadingArticles } = useQuery({
    queryKey: ["articles"],
    queryFn: articleService.getAllArticles,
    staleTime: 5000, // 5 seconds of fresh data
  });

  const { data: stats = { total: 0, published: 0, drafts: 0 } } = useQuery({
    queryKey: ["articlesStats"],
    queryFn: articleService.getArticleStats,
    staleTime: 5000, // 5 seconds of fresh data
  });

  const isLoading = isLoadingArticles;

  const filteredArticles = (articles as Article[]).filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || article.publish === false;
    return matchesSearch && matchesStatus;
  });

  const deleteMutation = useMutation({
    mutationFn: articleService.deleteArticle,
    onMutate: async (articleId) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["articles"] });
      await queryClient.cancelQueries({ queryKey: ["articlesStats"] });

      // Save current state
      const previousArticles = queryClient.getQueryData<Article[]>([
        "articles",
      ]);
      const previousStats = queryClient.getQueryData(["articlesStats"]);

      // Find the article to be deleted
      const articleToDelete = (previousArticles as Article[])?.find(
        (article) => article.id === articleId
      );

      if (previousArticles && articleToDelete) {
        // Optimistically update articles list
        queryClient.setQueryData<Article[]>(
          ["articles"],
          (previousArticles as Article[]).filter(
            (article) => article.id !== articleId
          )
        );

        // Optimistically update stats
        const currentStats = previousStats as {
          total: number;
          published: number;
          drafts: number;
        };
        queryClient.setQueryData(["articlesStats"], {
          total: currentStats.total - 1,
          published:
            articleToDelete.publish === true
              ? currentStats.published - 1
              : currentStats.published,
          drafts:
            articleToDelete.publish === false
              ? currentStats.drafts - 1
              : currentStats.drafts,
        });
      }

      return { previousArticles, previousStats };
    },
    onSuccess: () => {
      toast.success("Article deleted successfully");
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
      toast.error("An error occurred while deleting the article");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["articlesStats"] });
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) {
      return;
    }

    deleteMutation.mutate(id);
  };

  // Define a reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderedItems: Article[]) => {
      // This is a placeholder for the actual API call
      // In a real app, you would call an API to update article order
      await new Promise((resolve) => setTimeout(resolve, 500));
      return orderedItems;
    },
    onMutate: async (orderedItems) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["articles"] });

      // Save current state
      const previousArticles = queryClient.getQueryData<Article[]>([
        "articles",
      ]);

      // Optimistically update to new order
      queryClient.setQueryData<Article[]>(["articles"], () => [
        ...orderedItems,
      ]);

      return { previousArticles };
    },
    onError: (_, __, context) => {
      // Revert on error
      if (context?.previousArticles) {
        queryClient.setQueryData(["articles"], context.previousArticles);
      }
      toast.error("Failed to update article order");
    },
    onSuccess: () => {
      toast.success("Article order updated");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });

  // Handle drag end
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(filteredArticles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Call the mutation to update the order
    reorderMutation.mutate(items);
  };

  const getStatusColor = (status: boolean) => {
    return status
      ? "bg-success/10 text-success hover:bg-success/20"
      : "bg-warning/10 text-warning hover:bg-warning/20";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Articles</h1>
            <p className="text-muted-foreground mt-2">
              Manage your roofing company blog posts and articles
            </p>
          </div>
          <Link to="/dashboard/articles/create">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Article
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {
                  (
                    stats as {
                      total: number;
                      published: number;
                      drafts: number;
                    }
                  ).total
                }
              </div>
              <p className="text-sm text-muted-foreground">Total Articles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {
                  (
                    stats as {
                      total: number;
                      published: number;
                      drafts: number;
                    }
                  ).published
                }
              </div>
              <p className="text-sm text-muted-foreground">Published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {
                  (
                    stats as {
                      total: number;
                      published: number;
                      drafts: number;
                    }
                  ).drafts
                }
              </div>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </CardContent>
          </Card>
          {/* <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {((articles as Article[]) || [])
                  .reduce((sum, a) => sum + a.views, 0)
                  .toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </CardContent>
          </Card> */}
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>All Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "published" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("published")}
                >
                  Published
                </Button>
                <Button
                  variant={statusFilter === "draft" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("draft")}
                >
                  Drafts
                </Button>
              </div>
            </div>

            {/* Articles Table */}
            <div className="rounded-lg border">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                  <p>Loading articles...</p>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "No articles match your search criteria"
                    : "No articles have been created yet"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead className="max-w-lg">Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticles.map((article, index) => (
                      <TableRow key={article.id}>
                        <TableCell>
                          {article.cover_image ? (
                            <img
                              src={article.cover_image}
                              alt={article.title}
                              className="size-20 aspect-square block object-cover rounded"
                            />
                          ) : (
                            <div className="size-20 aspect-square bg-muted rounded flex items-center justify-center">
                              <FileText className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium  max-w-lg">
                          <div className="line-clamp-2">{article.title}</div>
                          <div className="font-normal text-muted-foreground text-xs line-clamp-1 mt-2">
                            {article.slug}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(article.publish)}>
                            {article.publish ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {article.created_at ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {new Date(
                                article.created_at
                              ).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link
                                to={`/dashboard/articles/edit/${article.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(article.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ArticlesList;
