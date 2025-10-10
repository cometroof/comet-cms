import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  Plus,
  Search,
  Edit,
  Trash2,
  GripVertical,
  ExternalLink,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import ProjectFormDialog from "@/components/ProjectFormDialog";
import { useToast } from "@/hooks/use-toast";
import { Project } from "./types";
import {
  useCategories,
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useUpdateProjectOrder,
} from "./hooks";

const ProjectsTab = () => {
  const { toast } = useToast();

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  // React Query - Fetch data
  const { data: categories = [] } = useCategories();
  const { data: projects = [] } = useProjects();

  // React Query - Mutations
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const updateProjectOrder = useUpdateProjectOrder();

  // Filtered data
  const filteredProjects = projects.filter((proj) =>
    proj.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Helper functions
  const getCategoryName = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.name || "Unknown";
  };

  const getCategoryNames = (categoryIds: string[]) => {
    return categoryIds
      .map((id) => categories.find((cat) => cat.id === id)?.name)
      .filter(Boolean);
  };

  // Project handlers
  const handleProjectEdit = (project: Project) => {
    setEditingProject(project);
    setProjectDialogOpen(true);
  };

  const handleProjectAdd = () => {
    setEditingProject(undefined);
    setProjectDialogOpen(true);
  };

  const handleProjectDelete = async (id: string) => {
    try {
      await deleteProject.mutateAsync(id);
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProjectSave = async (project: Project) => {
    try {
      if (editingProject) {
        await updateProject.mutateAsync({
          id: project.id,
          data: project,
        });
        toast({ title: "Project updated successfully" });
      } else {
        await createProject.mutateAsync({
          ...project,
          order: projects.length,
        });
        toast({ title: "Project created successfully" });
      }
      setProjectDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProjectDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(filteredProjects);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedProjects = items.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    try {
      await updateProjectOrder.mutateAsync(updatedProjects);
      toast({
        title: "Order updated",
        description: "Projects have been reordered successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleProjectAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Roof Type</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Images</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <DragDropContext onDragEnd={handleProjectDragEnd}>
              <Droppable droppableId="projects">
                {(provided) => (
                  <TableBody
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {filteredProjects.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No projects found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProjects.map((project, index) => (
                        <Draggable
                          key={project.id}
                          draggableId={project.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={snapshot.isDragging ? "bg-muted" : ""}
                            >
                              <TableCell {...provided.dragHandleProps}>
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                              </TableCell>
                              <TableCell className="font-medium">
                                {project.name}
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {project.slug}
                                </code>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span>{project.location_text}</span>
                                  {project.location_link && (
                                    <a
                                      href={project.location_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:text-primary/80"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{project.roof_type}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {project.category_ids &&
                                  project.category_ids.length > 0 ? (
                                    getCategoryNames(project.category_ids).map(
                                      (name, idx) => (
                                        <Badge key={idx} variant="outline">
                                          {name}
                                        </Badge>
                                      ),
                                    )
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-muted-foreground"
                                    >
                                      No categories
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {project.images.length} image
                                    {project.images.length !== 1 ? "s" : ""}
                                  </span>
                                  {project.images.some(
                                    (img) => img.is_highlight,
                                  ) && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Highlight
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleProjectEdit(project)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleProjectDelete(project.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </TableBody>
                )}
              </Droppable>
            </DragDropContext>
          </Table>
        </div>
      </Card>

      <ProjectFormDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={editingProject}
        categories={categories.filter((cat) => !cat.deleted_at)}
        onSave={handleProjectSave}
        isLoading={createProject.isPending || updateProject.isPending}
      />
    </>
  );
};

export default ProjectsTab;
