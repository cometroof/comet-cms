import { useState } from "react";
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
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import type { Contacts, Province, City } from "@/types/contacts-location";

const ContactsLocation = () => {
  // Mock data for contacts
  const [contacts, setContacts] = useState<Contacts>({
    id: "1",
    head_office: "<p>Head Office Location Information</p>",
    head_office_link: "https://maps.google.com/?q=office",
    phone: "+62-21-1234567",
    fax: "+62-21-1234568",
    email: "info@company.com",
    whatsapp_contact_service: "+6281234567890",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Mock data for provinces and cities
  const [provinces, setProvinces] = useState<Province[]>([
    { id: "1", name: "DKI Jakarta", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "2", name: "Jawa Barat", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "3", name: "Jawa Timur", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]);

  const [cities, setCities] = useState<City[]>([
    { id: "1", province_id: "1", name: "Jakarta Pusat", link: "https://maps.google.com/?q=Jakarta+Pusat", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "2", province_id: "1", name: "Jakarta Selatan", link: "https://maps.google.com/?q=Jakarta+Selatan", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "3", province_id: "2", name: "Bandung", link: "https://maps.google.com/?q=Bandung", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]);

  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [newCity, setNewCity] = useState({ name: "", link: "" });

  const handleSaveContacts = () => {
    toast.success("Contacts information saved successfully");
    console.log("Saving contacts:", contacts);
  };

  const handleAddCity = () => {
    if (!selectedProvince) {
      toast.error("Please select a province first");
      return;
    }
    if (!newCity.name.trim()) {
      toast.error("Please enter city name");
      return;
    }

    const city: City = {
      id: Date.now().toString(),
      province_id: selectedProvince,
      name: newCity.name,
      link: newCity.link,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCities([...cities, city]);
    setNewCity({ name: "", link: "" });
    toast.success("City added successfully");
  };

  const handleDeleteCity = (cityId: string) => {
    setCities(cities.filter((c) => c.id !== cityId));
    toast.success("City deleted successfully");
  };

  const filteredCities = selectedProvince
    ? cities.filter((city) => city.province_id === selectedProvince)
    : cities;

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
                  <Label htmlFor="head_office_link">Head Office Link (Google Maps)</Label>
                  <Input
                    id="head_office_link"
                    type="url"
                    placeholder="https://maps.google.com/?q=..."
                    value={contacts.head_office_link}
                    onChange={(e) =>
                      setContacts({ ...contacts, head_office_link: e.target.value })
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
                        setContacts({ ...contacts, whatsapp_contact_service: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveContacts}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
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
                    <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                      <SelectTrigger id="province">
                        <SelectValue placeholder="Select a province" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province.id} value={province.id}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProvince && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h3 className="font-semibold">Add City</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city_name">City Name</Label>
                          <Input
                            id="city_name"
                            placeholder="Enter city name"
                            value={newCity.name}
                            onChange={(e) =>
                              setNewCity({ ...newCity, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city_link">City Link</Label>
                          <Input
                            id="city_link"
                            type="url"
                            placeholder="https://maps.google.com/?q=..."
                            value={newCity.link}
                            onChange={(e) =>
                              setNewCity({ ...newCity, link: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddCity} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add City
                      </Button>
                    </div>
                  )}

                  {selectedProvince && filteredCities.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">
                        Cities in {provinces.find((p) => p.id === selectedProvince)?.name}
                      </h3>
                      <div className="space-y-2">
                        {filteredCities.map((city) => (
                          <div
                            key={city.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-background"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{city.name}</p>
                              {city.link && (
                                <a
                                  href={city.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  {city.link}
                                </a>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCity(city.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!selectedProvince && (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a province to view and manage cities
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
