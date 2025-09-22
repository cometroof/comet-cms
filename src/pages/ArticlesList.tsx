import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Filter
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data - replace with actual data from your backend
const mockArticles = [
  {
    id: 1,
    title: "Best Roofing Materials for 2024",
    slug: "best-roofing-materials-2024",
    status: "published",
    publishedDate: "2024-03-15",
    views: 1234,
    author: "John Smith"
  },
  {
    id: 2,
    title: "How to Choose the Right Contractor",
    slug: "choose-right-contractor",
    status: "draft",
    publishedDate: null,
    views: 0,
    author: "Jane Doe"
  },
  {
    id: 3,
    title: "Seasonal Roof Maintenance Tips",
    slug: "seasonal-roof-maintenance",
    status: "published",
    publishedDate: "2024-03-12",
    views: 856,
    author: "Mike Johnson"
  },
  {
    id: 4,
    title: "Commercial vs Residential Roofing",
    slug: "commercial-vs-residential",
    status: "published",
    publishedDate: "2024-03-10",
    views: 678,
    author: "Sarah Wilson"
  },
  {
    id: 5,
    title: "Emergency Roof Repair Guide",
    slug: "emergency-roof-repair-guide",
    status: "draft",
    publishedDate: null,
    views: 0,
    author: "John Smith"
  },
];

const ArticlesList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredArticles = mockArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    return status === "published" ? "default" : "secondary";
  };

  const getStatusColor = (status: string) => {
    return status === "published" 
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
                {mockArticles.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Articles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {mockArticles.filter(a => a.status === 'published').length}
              </div>
              <p className="text-sm text-muted-foreground">Published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {mockArticles.filter(a => a.status === 'draft').length}
              </div>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {mockArticles.reduce((sum, a) => sum + a.views, 0).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </CardContent>
          </Card>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">
                        {article.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {article.slug}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(article.status)}>
                          {article.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {article.publishedDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(article.publishedDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          {article.views.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {article.author}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/dashboard/articles/edit/${article.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ArticlesList;