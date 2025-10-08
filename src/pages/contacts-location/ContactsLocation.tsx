import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Contacts, Province, Location } from "@/types/contacts-location";
import * as contactsLocationService from "@/services/contacts-location.service";
import provinceData from "./province.json";

const ContactsLocation = () => {
  const [contacts, setContacts] = useState<Contacts>({
    id: "1",
    head_office: "",
    head_office_link: "",
    phone: "",
    fax: "",
    email: "",
    whatsapp_contact_service: "",
  });

  const [provinces] = useState<Province[]>(provinceData.data);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [newLocation, setNewLocation] = useState({ name: "", link: "" });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load data from Supabase on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load locations when province changes
  useEffect(() => {
    if (selectedProvince) {
      loadLocations(selectedProvince);
    } else {
      setLocations([]);
    }
  }, [selectedProvince]);

  const loadData = async () => {
    setLoading(true);
    try {
      const contactsData = await contactsLocationService.getContacts();

      if (contactsData) {
        setContacts(contactsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async (provinceCode: string) => {
    try {
      const locationsData =
        await contactsLocationService.getLocationsByProvince(provinceCode);
      setLocations(locationsData);
    } catch (error) {
      console.error("Error loading locations:", error);
      toast.error("Failed to load locations");
    }
  };

  const handleSaveContacts = async () => {
    setSaving(true);
    try {
      const success = await contactsLocationService.updateContacts(contacts);

      if (success) {
        toast.success("Contacts information saved successfully");
      } else {
        toast.error("Failed to save contacts information");
      }
    } catch (error) {
      console.error("Error saving contacts:", error);
      toast.error("Failed to save contacts information");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLocation = async () => {
    if (!selectedProvince) {
      toast.error("Please select a province first");
      return;
    }
    if (!newLocation.name.trim()) {
      toast.error("Please enter location name");
      return;
    }

    try {
      const location = await contactsLocationService.addLocation({
        province_code: selectedProvince,
        name: newLocation.name,
        link: newLocation.link,
      });

      if (location) {
        setLocations([...locations, location]);
        setNewLocation({ name: "", link: "" });
        toast.success("Location added successfully");
      } else {
        toast.error("Failed to add location");
      }
    } catch (error) {
      console.error("Error adding location:", error);
      toast.error("Failed to add location");
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
      const success = await contactsLocationService.deleteLocation(locationId);

      if (success) {
        setLocations(locations.filter((l) => l.id !== locationId));
        toast.success("Location deleted successfully");
      } else {
        toast.error("Failed to delete location");
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    }
  };

  const filteredLocations = selectedProvince
    ? locations.filter(
        (location) => location.province_code === selectedProvince,
      )
    : locations;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contacts & Location</h1>
            <p className="text-muted-foreground mt-1">
              Manage contact information and locations
            </p>
          </div>
        </div>

        <Tabs defaultValue="contacts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Head Office</Label>
                  <RichTextEditor
                    value={contacts.head_office}
                    onChange={(value) =>
                      setContacts({ ...contacts, head_office: value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="head_office_link">
                    Head Office Link (Google Maps)
                  </Label>
                  <Input
                    id="head_office_link"
                    type="url"
                    placeholder="https://maps.google.com/?q=..."
                    value={contacts.head_office_link}
                    onChange={(e) =>
                      setContacts({
                        ...contacts,
                        head_office_link: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+62-21-1234567"
                      value={contacts.phone}
                      onChange={(e) =>
                        setContacts({ ...contacts, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fax">Fax</Label>
                    <Input
                      id="fax"
                      type="tel"
                      placeholder="+62-21-1234568"
                      value={contacts.fax}
                      onChange={(e) =>
                        setContacts({ ...contacts, fax: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="info@company.com"
                      value={contacts.email}
                      onChange={(e) =>
                        setContacts({ ...contacts, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp Contact Service</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="+6281234567890"
                      value={contacts.whatsapp_contact_service}
                      onChange={(e) =>
                        setContacts({
                          ...contacts,
                          whatsapp_contact_service: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveContacts} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="province">Select Province</Label>
                    <Select
                      value={selectedProvince}
                      onValueChange={setSelectedProvince}
                    >
                      <SelectTrigger id="province">
                        <SelectValue placeholder="Select a province" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province.code} value={province.code}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProvince && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h3 className="font-semibold">Add Location</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location_name">Location Name</Label>
                          <Input
                            id="location_name"
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
                          <Label htmlFor="location_link">Location Link</Label>
                          <Input
                            id="location_link"
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
                      <Button onClick={handleAddLocation} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Location
                      </Button>
                    </div>
                  )}

                  {selectedProvince && filteredLocations.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">
                        Locations in{" "}
                        {
                          provinces.find((p) => p.code === selectedProvince)
                            ?.name
                        }
                      </h3>
                      <div className="space-y-2">
                        {filteredLocations.map((location) => (
                          <div
                            key={location.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-background"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{location.name}</p>
                              {location.link && (
                                <a
                                  href={location.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  {location.link}
                                </a>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLocation(location.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProvince && filteredLocations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No locations found. Add a location above.
                    </div>
                  )}

                  {!selectedProvince && (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a province to view and manage locations
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ContactsLocation;
