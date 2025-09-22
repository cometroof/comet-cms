import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye, Calendar, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Articles",
      value: "24",
      description: "3 published this week",
      icon: FileText,
      trend: "+12%"
    },
    {
      title: "Page Views",
      value: "2,847",
      description: "Last 30 days",
      icon: Eye,
      trend: "+18%"
    },
    {
      title: "Published",
      value: "18",
      description: "Live articles",
      icon: Calendar,
      trend: "+5%"
    },
    {
      title: "Growth",
      value: "23%",
      description: "Monthly increase",
      icon: TrendingUp,
      trend: "+8%"
    },
  ];

  const recentArticles = [
    {
      title: "Best Roofing Materials for 2024",
      status: "Published",
      date: "2024-03-15",
      views: 1234
    },
    {
      title: "How to Choose the Right Contractor",
      status: "Draft",
      date: "2024-03-14",
      views: 0
    },
    {
      title: "Seasonal Roof Maintenance Tips",
      status: "Published",
      date: "2024-03-12",
      views: 856
    },
    {
      title: "Commercial vs Residential Roofing",
      status: "Published",
      date: "2024-03-10",
      views: 678
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your roofing company content management system
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-xs font-medium text-success">
                      {stat.trend}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      from last month
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Articles */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Articles</CardTitle>
            <CardDescription>
              Latest content updates and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentArticles.map((article, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{article.title}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        article.status === 'Published' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {article.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {article.views.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">views</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;