import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCategories } from "./hooks";
import CategoriesTab from "./CategoriesTab";

const ProjectCategories = () => {
  // React Query - Fetch data for loading/error states
  const { isLoading: categoriesLoading, error: categoriesError } =
    useCategories();

  // Show loading state
  if (categoriesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (categoriesError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <p className="text-destructive">
            Failed to load categories. Please try again.
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
          <h1 className="text-3xl font-bold text-foreground">
            Project Categories
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your project categories and their organization
          </p>
        </div>

        <CategoriesTab />
      </div>
    </DashboardLayout>
  );
};

export default ProjectCategories;
