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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Plus, Trash2, Loader2, GripVertical, X } from "lucide-react";
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

interface LocationInput {
  id: string;
  name: string;
  link: string;
}

export const LocationsTab = ({}: LocationsTabProps) => {
  const queryClient = useQueryClient();
  const [newLocation, setNewLocation] = useState({
    area: "",
  });
  const [locationInputs, setLocationInputs] = useState<LocationInput[]>([
    { id: crypto.randomUUID(), name: "", link: "" },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [areaLocationInputs, setAreaLocationInputs] = useState<LocationInput[]>(
    [{ id: crypto.randomUUID(), name: "", link: "" }],
  );
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);

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
    },
    onError: (error) => {
      console.error("Error adding location:", error);
      throw error;
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

  // Mutation to delete an area
  const deleteAreaMutation = useMutation({
    mutationFn: contactsLocationService.deleteArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast.success("Area deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting area:", error);
      toast.error("Failed to delete area");
    },
  });

  // Mutation to reorder areas
  const reorderAreasMutation = useMutation({
    mutationFn: contactsLocationService.reorderAreas,
    onMutate: async (newAreas) => {
      await queryClient.cancelQueries({ queryKey: ["areas"] });
      const previousAreas = queryClient.getQueryData(["areas"]);
      queryClient.setQueryData(["areas"], newAreas);
      return { previousAreas };
    },
    onSuccess: () => {
      toast.success("Area order updated");
    },
    onError: (error, _, context) => {
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

  const handleAddLocations = async () => {
    if (!newLocation.area.trim()) {
      toast.error("Please enter area name");
      return;
    }

    const validLocations = locationInputs.filter((loc) => loc.name.trim());
    if (validLocations.length === 0) {
      toast.error("Please enter at least one location name");
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      for (const location of validLocations) {
        try {
          setLoadingSubmit(true);
          await addLocationMutation.mutateAsync({
            area: newLocation.area,
            location: {
              name: location.name,
              link: location.link,
            },
          });
          setLoadingSubmit(false);
          successCount++;
        } catch (error) {
          failCount++;
          console.error("Failed to add location:", location.name, error);
        }
      }

      if (successCount > 0) {
        toast.success(
          `Successfully added ${successCount} location${successCount !== 1 ? "s" : ""}`,
        );
      }
      if (failCount > 0) {
        toast.error(
          `Failed to add ${failCount} location${failCount !== 1 ? "s" : ""}`,
        );
      }

      setNewLocation({ area: "" });
      setLocationInputs([{ id: crypto.randomUUID(), name: "", link: "" }]);
      setDialogOpen(false);
    } catch (error) {
      console.error("Error in bulk add:", error);
    }
  };

  const handleDeleteLocation = (locationId: string) => {
    deleteLocationMutation.mutate(locationId);
  };

  const handleDeleteArea = (areaId: string) => {
    deleteAreaMutation.mutate(areaId);
  };

  const handleAddLocationsToArea = async () => {
    const validLocations = areaLocationInputs.filter((loc) => loc.name.trim());
    if (validLocations.length === 0) {
      toast.error("Please enter at least one location name");
      return;
    }

    const selectedArea = areas.find((a) => a.id === selectedAreaId);
    if (!selectedArea) {
      toast.error("Area not found");
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      for (const location of validLocations) {
        try {
          setLoadingSubmit(true);
          await addLocationMutation.mutateAsync({
            area: selectedArea.name,
            location: {
              name: location.name,
              link: location.link,
            },
          });
          successCount++;
          setLoadingSubmit(false);
        } catch (error) {
          failCount++;
          console.error("Failed to add location:", location.name, error);
        }
      }

      if (successCount > 0) {
        toast.success(
          `Successfully added ${successCount} location${successCount !== 1 ? "s" : ""}`,
        );
      }
      if (failCount > 0) {
        toast.error(
          `Failed to add ${failCount} location${failCount !== 1 ? "s" : ""}`,
        );
      }

      setAreaLocationInputs([{ id: crypto.randomUUID(), name: "", link: "" }]);
      setAreaDialogOpen(false);
    } catch (error) {
      console.error("Error in bulk add to area:", error);
    }
  };

  const openAddLocationDialog = (areaId: string) => {
    setSelectedAreaId(areaId);
    setAreaDialogOpen(true);
  };

  const addNewLocationInput = () => {
    setLocationInputs([
      ...locationInputs,
      { id: crypto.randomUUID(), name: "", link: "" },
    ]);
  };

  const removeLocationInput = (id: string) => {
    if (locationInputs.length > 1) {
      setLocationInputs(locationInputs.filter((input) => input.id !== id));
    }
  };

  const updateLocationInput = (
    id: string,
    field: "name" | "link",
    value: string,
  ) => {
    setLocationInputs(
      locationInputs.map((input) =>
        input.id === id ? { ...input, [field]: value } : input,
      ),
    );
  };

  const addNewAreaLocationInput = () => {
    setAreaLocationInputs([
      ...areaLocationInputs,
      { id: crypto.randomUUID(), name: "", link: "" },
    ]);
  };

  const removeAreaLocationInput = (id: string) => {
    if (areaLocationInputs.length > 1) {
      setAreaLocationInputs(
        areaLocationInputs.filter((input) => input.id !== id),
      );
    }
  };

  const updateAreaLocationInput = (
    id: string,
    field: "name" | "link",
    value: string,
  ) => {
    setAreaLocationInputs(
      areaLocationInputs.map((input) =>
        input.id === id ? { ...input, [field]: value } : input,
      ),
    );
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
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
                <DialogDescription>
                  Add new locations with area information. You can add multiple
                  locations at once.
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

                <div className="space-y-4">
                  <Label>Locations</Label>
                  {locationInputs.map((input, index) => (
                    <div
                      key={input.id}
                      className="space-y-2 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Location {index + 1}
                        </span>
                        {locationInputs.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeLocationInput(input.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Location name"
                          value={input.name}
                          onChange={(e) =>
                            updateLocationInput(
                              input.id,
                              "name",
                              e.target.value,
                            )
                          }
                        />
                        <Input
                          type="url"
                          placeholder="Location link (optional)"
                          value={input.link}
                          onChange={(e) =>
                            updateLocationInput(
                              input.id,
                              "link",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={addNewLocationInput}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Location
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setNewLocation({ area: "" });
                    setLocationInputs([
                      { id: crypto.randomUUID(), name: "", link: "" },
                    ]);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddLocations} disabled={loadingSubmit}>
                  {loadingSubmit && (
                    <Loader2 className="animate-spin size-3 mr-1" />
                  )}
                  Add {locationInputs.filter((l) => l.name.trim()).length}{" "}
                  Location
                  {locationInputs.filter((l) => l.name.trim()).length !== 1
                    ? "s"
                    : ""}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog for adding location to specific area */}
          <Dialog open={areaDialogOpen} onOpenChange={setAreaDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Location to Area</DialogTitle>
                <DialogDescription>
                  Add new locations to{" "}
                  {areas.find((a) => a.id === selectedAreaId)?.name ||
                    "this area"}
                  . You can add multiple locations at once.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-4">
                  <Label>Locations</Label>
                  {areaLocationInputs.map((input, index) => (
                    <div
                      key={input.id}
                      className="space-y-2 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Location {index + 1}
                        </span>
                        {areaLocationInputs.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeAreaLocationInput(input.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Location name"
                          value={input.name}
                          onChange={(e) =>
                            updateAreaLocationInput(
                              input.id,
                              "name",
                              e.target.value,
                            )
                          }
                        />
                        <Input
                          type="url"
                          placeholder="Location link (optional)"
                          value={input.link}
                          onChange={(e) =>
                            updateAreaLocationInput(
                              input.id,
                              "link",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={addNewAreaLocationInput}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Location
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAreaDialogOpen(false);
                    setAreaLocationInputs([
                      { id: crypto.randomUUID(), name: "", link: "" },
                    ]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLocationsToArea}
                  disabled={loadingSubmit}
                >
                  {loadingSubmit && (
                    <Loader2 className="animate-spin size-3 mr-1" />
                  )}
                  Add {areaLocationInputs.filter((l) => l.name.trim()).length}{" "}
                  Location
                  {areaLocationInputs.filter((l) => l.name.trim()).length !== 1
                    ? "s"
                    : ""}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">
                                  {area.locations.length}{" "}
                                  {area.locations.length === 1
                                    ? "location"
                                    : "locations"}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openAddLocationDialog(area.id)
                                    }
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="ghost">
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete Area
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "
                                          {area.name}"? This will also delete
                                          all {area.locations.length} location
                                          {area.locations.length !== 1
                                            ? "s"
                                            : ""}{" "}
                                          in this area. This action cannot be
                                          undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteArea(area.id)
                                          }
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
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
                                                <AlertDialog>
                                                  <AlertDialogTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="ml-2 shrink-0"
                                                    >
                                                      <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                  <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                      <AlertDialogTitle>
                                                        Delete Area
                                                      </AlertDialogTitle>
                                                      <AlertDialogDescription>
                                                        Are you sure you want to
                                                        delete this location?
                                                        This action cannot be
                                                        undone.
                                                      </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                      <AlertDialogCancel>
                                                        Cancel
                                                      </AlertDialogCancel>
                                                      <AlertDialogAction
                                                        onClick={() =>
                                                          handleDeleteLocation(
                                                            location.id,
                                                          )
                                                        }
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                      >
                                                        Delete
                                                      </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                  </AlertDialogContent>
                                                </AlertDialog>
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
