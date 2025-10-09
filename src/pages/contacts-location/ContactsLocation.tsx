import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Contacts } from "@/types/contacts-location";
import * as contactsLocationService from "@/services/contacts-location.service";
import { ContactsTab } from "./ContactsTab";
import { LocationsTab } from "./LocationsTab";

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

  const [loading, setLoading] = useState(true);

  // Load data from Supabase on mount
  useEffect(() => {
    loadData();
  }, []);

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
            <ContactsTab initialContacts={contacts} />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <LocationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ContactsLocation;
