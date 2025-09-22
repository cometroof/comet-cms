import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hammer, Shield, FileText, Users, BarChart3 } from "lucide-react";

const Index = () => {
  useEffect(() => {
    // Redirect to login page on load
    window.location.href = "/login";
  }, []);

  const features = [
    {
      icon: FileText,
      title: "Content Management",
      description: "Manage articles, products, and website content with ease"
    },
    {
      icon: Shield,
      title: "Secure Admin Panel",
      description: "Role-based access control for your team members"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track performance and engagement metrics"
    },
    {
      icon: Users,
      title: "Multi-user Support",
      description: "Collaborate with your team on content creation"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-background to-accent-soft">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6 shadow-lg">
            <Hammer className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Roofing Company
            <span className="block text-primary">Content Management System</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage your roofing company website content, articles, products, and more 
            with our comprehensive CMS solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => window.location.href = "/login"}
            >
              <Shield className="w-5 h-5" />
              Access Admin Panel
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4 mx-auto">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-muted-foreground">
          <p>© 2024 Roofing Company CMS. Professional content management for roofing businesses.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
