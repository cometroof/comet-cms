import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCategories, useProjects } from "./hooks";
import ProjectsTab from "./ProjectsTab";

const Projects = () => {
  // React Query - Fetch data for loading/error states
  const { isLoading: categoriesLoading, error: categoriesError } =
    useCategories();
  const { isLoading: projectsLoading, error: projectsError } = useProjects();

  // Show loading state
  if (categoriesLoading || projectsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (categoriesError || projectsError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <p className="text-destructive">
            Failed to load data. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage your projects and their details
          </p>
        </div>

        <ProjectsTab />
      </div>
    </DashboardLayout>
  );
};

export default Projects;
