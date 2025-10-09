import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Plus, Trash2, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import type { Area } from "@/types/contacts-location";
import * as contactsLocationService from "@/services/contacts-location.service";

interface LocationsTabProps {}

export const LocationsTab = ({}: LocationsTabProps) => {
  const queryClient = useQueryClient();
  const [newLocation, setNewLocation] = useState({
    area: "",
    name: "",
    link: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  // Query to fetch all areas
  const {
    data: areas = [],
    isLoading: loading,
    refetch: loadAllAreas,
  } = useQuery({
    queryKey: ["areas"],
    queryFn: contactsLocationService.getAllAreas,
  });

  // Mutation to add a location
  const addLocationMutation = useMutation({
    mutationFn: (params: {
      area: string;
      location: { name: string; link: string };
    }) => contactsLocationService.addLocation(params.area, params.location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      setNewLocation({ area: "", name: "", link: "" });
      setDialogOpen(false);
      toast.success("Location added successfully");
    },
    onError: (error) => {
      console.error("Error adding location:", error);
      toast.error("Failed to add location");
    },
  });

  // Mutation to delete a location
  const deleteLocationMutation = useMutation({
    mutationFn: contactsLocationService.deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast.success("Location deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    },
  });

  // Mutation to reorder areas
  const reorderAreasMutation = useMutation({
    mutationFn: contactsLocationService.reorderAreas,
    onMutate: async (newAreas) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["areas"] });

      // Snapshot previous value
      const previousAreas = queryClient.getQueryData(["areas"]);

      // Optimistically update
      queryClient.setQueryData(["areas"], newAreas);

      return { previousAreas };
    },
    onSuccess: () => {
      toast.success("Area order updated");
    },
    onError: (error, _, context) => {
      // Revert on error
      if (context?.previousAreas) {
        queryClient.setQueryData(["areas"], context.previousAreas);
      }
      console.error("Error reordering areas:", error);
      toast.error("Failed to update area order");
    },
  });

  // Mutation to reorder locations
  const reorderLocationsMutation = useMutation({
    mutationFn: (params: { areaId: string; locations: any[] }) =>
      contactsLocationService.reorderLocations(params.areaId, params.locations),
    onMutate: async ({ areaId, locations }) => {
      await queryClient.cancelQueries({ queryKey: ["areas"] });

      const previousAreas = queryClient.getQueryData(["areas"]);

      // Optimistically update
      queryClient.setQueryData(["areas"], (old: Area[] = []) =>
        old.map((a) => (a.id === areaId ? { ...a, locations } : a)),
      );

      return { previousAreas };
    },
    onSuccess: () => {
      toast.success("Location order updated");
    },
    onError: (error, _, context) => {
      if (context?.previousAreas) {
        queryClient.setQueryData(["areas"], context.previousAreas);
      }
      console.error("Error reordering locations:", error);
      toast.error("Failed to update location order");
    },
  });

  const handleAddLocation = () => {
    if (!newLocation.area.trim()) {
      toast.error("Please enter area name");
      return;
    }
    if (!newLocation.name.trim()) {
      toast.error("Please enter location name");
      return;
    }

    addLocationMutation.mutate({
      area: newLocation.area,
      location: {
        name: newLocation.name,
        link: newLocation.link,
      },
    });
  };

  const handleDeleteLocation = (locationId: string) => {
    deleteLocationMutation.mutate(locationId);
  };

  const onDragEndAreas = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(areas);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderAreasMutation.mutate(items);
  };

  const onDragEndLocations = (result: DropResult, areaId: string) => {
    if (!result.destination) return;

    const area = areas.find((a) => a.id === areaId);
    if (!area) return;

    const items = Array.from(area.locations);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderLocationsMutation.mutate({ areaId, locations: items });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Location Management</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Add a new location with area information. Fill in the details
                below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dialog_area">Area</Label>
                <Input
                  id="dialog_area"
                  placeholder="Enter area name (e.g., Jakarta Selatan)"
                  value={newLocation.area}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      area: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog_location_name">Location Name</Label>
                <Input
                  id="dialog_location_name"
                  placeholder="Enter location name"
                  value={newLocation.name}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog_location_link">
                  Location Link (Optional)
                </Label>
                <Input
                  id="dialog_location_link"
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={newLocation.link}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      link: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setNewLocation({ area: "", name: "", link: "" });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddLocation}>Add Location</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* All Areas Display */}
          {areas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/30">
              <p className="mb-2">No locations added yet.</p>
              <p className="text-sm">
                Click the "Add Location" button above to get started.
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEndAreas}>
              <Droppable droppableId="areas">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-6"
                  >
                    {areas.map((area, areaIndex) => (
                      <Draggable
                        key={area.id}
                        draggableId={area.id}
                        index={areaIndex}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`space-y-3 border rounded-lg p-4 ${
                              snapshot.isDragging
                                ? "bg-muted shadow-lg"
                                : "bg-card"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                </div>
                                <h4 className="font-semibold text-base">
                                  {area.name}
                                </h4>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {area.locations.length}{" "}
                                {area.locations.length === 1
                                  ? "location"
                                  : "locations"}
                              </span>
                            </div>

                            {/* Locations within Area */}
                            <DragDropContext
                              onDragEnd={(result) =>
                                onDragEndLocations(result, area.id)
                              }
                            >
                              <Droppable droppableId={`locations-${area.id}`}>
                                {(provided) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-2 pl-8"
                                  >
                                    {area.locations.length === 0 ? (
                                      <div className="text-sm text-muted-foreground italic p-3 border rounded-lg bg-muted/20">
                                        No locations in this area yet.
                                      </div>
                                    ) : (
                                      area.locations.map(
                                        (location, locationIndex) => (
                                          <Draggable
                                            key={location.id}
                                            draggableId={location.id}
                                            index={locationIndex}
                                          >
                                            {(provided, snapshot) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                                                  snapshot.isDragging
                                                    ? "bg-muted shadow-lg"
                                                    : "bg-background"
                                                }`}
                                              >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                  <div
                                                    {...provided.dragHandleProps}
                                                  >
                                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-medium">
                                                      {location.name}
                                                    </p>
                                                    {location.link && (
                                                      <a
                                                        href={location.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-primary hover:underline truncate block"
                                                      >
                                                        {location.link}
                                                      </a>
                                                    )}
                                                  </div>
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    handleDeleteLocation(
                                                      location.id,
                                                    )
                                                  }
                                                  className="ml-2 shrink-0"
                                                >
                                                  <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                              </div>
                                            )}
                                          </Draggable>
                                        ),
                                      )
                                    )}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </DragDropContext>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
