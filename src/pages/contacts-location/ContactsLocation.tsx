import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Contacts, SocialMedia } from "@/types/contacts-location";
import * as contactsLocationService from "@/services/contacts-location.service";
import { ContactsTab } from "./ContactsTab";
import { LocationsTab } from "./LocationsTab";
import { SocialMediaTab } from "./SocialMediaTab";

const ContactsLocation = () => {
  // Fetch contacts via react-query
  const {
    data: contacts,
    isLoading: isContactsLoading,
    isError: isContactsError,
  } = useQuery<Contacts, Error, Contacts>({
    queryKey: ["contacts"],
    queryFn: () => contactsLocationService.getContacts(),
  });

  const defaultContacts: Contacts = {
    id: "1",
    head_office: "",
    head_office_link: "",
    phone: "",
    fax: "",
    email: "",
    email_form: "",
    whatsapp_contact_service: "",
  };

  useEffect(() => {
    if (isContactsError) {
      console.error("Error loading contacts");
      toast.error("Failed to load contacts");
    }
  }, [isContactsError]);

  if (isContactsLoading) {
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
            <TabsTrigger value="social-media">Social Media</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-6">
            <ContactsTab initialContacts={contacts ?? defaultContacts} />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <LocationsTab />
          </TabsContent>

          <TabsContent value="social-media" className="space-y-6">
            <SocialMediaTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ContactsLocation;
