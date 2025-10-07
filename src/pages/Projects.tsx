import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, GripVertical, ExternalLink } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import CategoryFormDialog from "@/components/CategoryFormDialog";
import ProjectFormDialog from "@/components/ProjectFormDialog";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectImage {
  id: string;
  image_url: string;
  is_highlight: boolean;
  order: number;
}

interface Project {
  id: string;
  name: string;
  location_text: string;
  location_link: string;
  roof_type: string;
  category_id: string;
  order: number;
  images: ProjectImage[];
  created_at: string;
  updated_at: string;
}

const Projects = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  // Mock data
  const [categories, setCategories] = useState<Category[]>([
    {
      id: "1",
      name: "Residential",
      slug: "residential",
      deleted_at: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Commercial",
      slug: "commercial",
      deleted_at: null,
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    },
  ]);

  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Modern Villa",
      location_text: "Jakarta, Indonesia",
      location_link: "https://maps.google.com",
      roof_type: "Metal Roof",
      category_id: "1",
      order: 0,
      images: [
        { id: "i1", image_url: "/placeholder.svg", is_highlight: true, order: 0 },
        { id: "i2", image_url: "/placeholder.svg", is_highlight: false, order: 1 },
      ],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Shopping Mall",
      location_text: "Surabaya, Indonesia",
      location_link: "https://maps.google.com",
      roof_type: "Flat Roof",
      category_id: "2",
      order: 1,
      images: [
        { id: "i3", image_url: "/placeholder.svg", is_highlight: true, order: 0 },
      ],
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    },
  ]);

  const filteredCategories = categories.filter(
    (cat) => !cat.deleted_at && cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProjects = projects.filter((proj) =>
    proj.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryDelete = (id: string) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, deleted_at: new Date().toISOString() } : cat
    ));
    toast({
      title: "Category deleted",
      description: "The category has been soft deleted successfully.",
    });
  };

  const handleProjectDelete = (id: string) => {
    setProjects(projects.filter(proj => proj.id !== id));
    toast({
      title: "Project deleted",
      description: "The project has been deleted successfully.",
    });
  };

  const handleProjectDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(filteredProjects);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedProjects = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setProjects(prev => {
      const otherProjects = prev.filter(p => !filteredProjects.find(fp => fp.id === p.id));
      return [...otherProjects, ...updatedProjects].sort((a, b) => a.order - b.order);
    });

    toast({
      title: "Order updated",
      description: "Projects have been reordered successfully.",
    });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || "Unknown";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage your project categories and projects
          </p>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
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
                <Button
                  onClick={() => {
                    setEditingProject(undefined);
                    setProjectDialogOpen(true);
                  }}
                  className="gap-2"
                >
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
                      <TableHead>Location</TableHead>
                      <TableHead>Roof Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Images</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <DragDropContext onDragEnd={handleProjectDragEnd}>
                    <Droppable droppableId="projects">
                      {(provided) => (
                        <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                          {filteredProjects.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No projects found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredProjects.map((project, index) => (
                              <Draggable key={project.id} draggableId={project.id} index={index}>
                                {(provided, snapshot) => (
                                  <TableRow
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={snapshot.isDragging ? "bg-muted" : ""}
                                  >
                                    <TableCell {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                    </TableCell>
                                    <TableCell className="font-medium">{project.name}</TableCell>
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
                                      <Badge variant="outline">{getCategoryName(project.category_id)}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                          {project.images.length} image{project.images.length !== 1 ? 's' : ''}
                                        </span>
                                        {project.images.some(img => img.is_highlight) && (
                                          <Badge variant="secondary" className="text-xs">Highlight</Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditingProject(project);
                                            setProjectDialogOpen(true);
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleProjectDelete(project.id)}
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
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  onClick={() => {
                    setEditingCategory(undefined);
                    setCategoryDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No categories found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCategories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{category.slug}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(category.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCategory(category);
                                  setCategoryDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCategoryDelete(category.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CategoryFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        onSave={(category) => {
          if (editingCategory) {
            setCategories(categories.map(cat => 
              cat.id === category.id ? category : cat
            ));
            toast({ title: "Category updated successfully" });
          } else {
            setCategories([...categories, { ...category, id: Date.now().toString() }]);
            toast({ title: "Category created successfully" });
          }
          setCategoryDialogOpen(false);
        }}
      />

      <ProjectFormDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={editingProject}
        categories={categories.filter(cat => !cat.deleted_at)}
        onSave={(project) => {
          if (editingProject) {
            setProjects(projects.map(proj => 
              proj.id === project.id ? project : proj
            ));
            toast({ title: "Project updated successfully" });
          } else {
            setProjects([...projects, { ...project, id: Date.now().toString(), order: projects.length }]);
            toast({ title: "Project created successfully" });
          }
          setProjectDialogOpen(false);
        }}
      />
    </DashboardLayout>
  );
};

export default Projects;
