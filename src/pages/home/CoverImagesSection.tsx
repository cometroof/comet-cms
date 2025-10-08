import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import { toast } from "sonner";
import * as coverService from "@/services/cover.service";

const CoverImagesSection = () => {
  const [projectsCoverDialogOpen, setProjectsCoverDialogOpen] = useState(false);
  const [distributionCoverDialogOpen, setDistributionCoverDialogOpen] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [projectsCover, setProjectsCover] = useState<{
    id?: string;
    image: string;
    updated_at?: string;
  }>({
    image: "/placeholder.svg",
  });

  const [distributionCover, setDistributionCover] = useState<{
    id?: string;
    image: string;
    updated_at?: string;
  }>({
    image: "/placeholder.svg",
  });

  useEffect(() => {
    loadCovers();
  }, []);

  const loadCovers = async () => {
    setLoading(true);
    try {
      const [projectsData, distributionData] = await Promise.all([
        coverService.getCoverByType("home-project"),
        coverService.getCoverByType("home-distribution"),
      ]);

      if (projectsData) {
        setProjectsCover({
          id: projectsData.id,
          image: projectsData.image,
          updated_at: projectsData.updated_at,
        });
      }

      if (distributionData) {
        setDistributionCover({
          id: distributionData.id,
          image: distributionData.image,
          updated_at: distributionData.updated_at,
        });
      }
    } catch (error) {
      console.error("Error loading covers:", error);
      toast.error("Failed to load covers");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCoverImage = async (
    type: "projects" | "distribution",
    imageUrl: string,
  ) => {
    const coverType =
      type === "projects" ? "home-project" : "home-distribution";
    const currentCover =
      type === "projects" ? projectsCover : distributionCover;

    setUpdating(type);

    try {
      if (currentCover.id) {
        // Update existing cover
        const updated = await coverService.updateCover(currentCover.id, {
          image: imageUrl,
        });

        if (updated) {
          if (type === "projects") {
            setProjectsCover({
              id: updated.id,
              image: updated.image,
              updated_at: updated.updated_at,
            });
          } else {
            setDistributionCover({
              id: updated.id,
              image: updated.image,
              updated_at: updated.updated_at,
            });
          }
          toast.success(
            `${type === "projects" ? "Projects" : "Distribution"} cover image updated successfully`,
          );
        } else {
          toast.error("Failed to update cover image");
        }
      } else {
        // Create new cover
        const created = await coverService.createCover({
          type: coverType,
          image: imageUrl,
          order: 0,
        });

        if (created) {
          if (type === "projects") {
            setProjectsCover({
              id: created.id,
              image: created.image,
              updated_at: created.updated_at,
            });
          } else {
            setDistributionCover({
              id: created.id,
              image: created.image,
              updated_at: created.updated_at,
            });
          }
          toast.success(
            `${type === "projects" ? "Projects" : "Distribution"} cover image created successfully`,
          );
        } else {
          toast.error("Failed to create cover image");
        }
      }
    } catch (error) {
      console.error("Error updating cover:", error);
      toast.error("Failed to update cover image");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cover Images</CardTitle>
          <CardDescription>
            Manage homepage cover images for different sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="ml-2 text-muted-foreground">Loading covers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Cover Images</CardTitle>
          <CardDescription>
            Manage homepage cover images for different sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Projects Cover */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  Projects Cover Image
                </h3>
                {projectsCover.updated_at && (
                  <p className="text-sm text-muted-foreground">
                    Last updated:{" "}
                    {new Date(projectsCover.updated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={projectsCover.image}
                  alt="Projects Cover"
                  className="w-full h-[300px] object-cover"
                />
              </div>
              <Button
                onClick={() => setProjectsCoverDialogOpen(true)}
                variant="outline"
                className="w-full gap-2"
                disabled={updating === "projects"}
              >
                {updating === "projects" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Change Image
                  </>
                )}
              </Button>
            </div>

            {/* Distribution Cover */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  Distribution Cover Image
                </h3>
                {distributionCover.updated_at && (
                  <p className="text-sm text-muted-foreground">
                    Last updated:{" "}
                    {new Date(
                      distributionCover.updated_at,
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={distributionCover.image}
                  alt="Distribution Cover"
                  className="w-full h-[300px] object-cover"
                />
              </div>
              <Button
                onClick={() => setDistributionCoverDialogOpen(true)}
                variant="outline"
                className="w-full gap-2"
                disabled={updating === "distribution"}
              >
                {updating === "distribution" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Change Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Selector Dialogs */}
      <ImageSelectorDialog
        open={projectsCoverDialogOpen}
        onOpenChange={setProjectsCoverDialogOpen}
        onSelect={(url) => {
          handleUpdateCoverImage("projects", url);
          setProjectsCoverDialogOpen(false);
        }}
        title="Select Projects Cover Image"
      />

      <ImageSelectorDialog
        open={distributionCoverDialogOpen}
        onOpenChange={setDistributionCoverDialogOpen}
        onSelect={(url) => {
          handleUpdateCoverImage("distribution", url);
          setDistributionCoverDialogOpen(false);
        }}
        title="Select Distribution Cover Image"
      />
    </>
  );
};

export default CoverImagesSection;
