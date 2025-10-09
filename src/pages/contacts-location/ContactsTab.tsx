import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import type { Contacts } from "@/types/contacts-location";
import * as contactsLocationService from "@/services/contacts-location.service";

interface ContactsTabProps {
  initialContacts: Contacts;
}

export const ContactsTab = ({ initialContacts }: ContactsTabProps) => {
  const [contacts, setContacts] = useState<Contacts>(initialContacts);

  const updateContactsMutation = useMutation({
    mutationFn: (data: Contacts) =>
      contactsLocationService.updateContacts(data),
    onSuccess: () => {
      toast.success("Contacts information saved successfully");
    },
    onError: (error) => {
      console.error("Error saving contacts:", error);
      toast.error("Failed to save contacts information");
    },
  });

  const handleSaveContacts = () => {
    updateContactsMutation.mutate(contacts);
  };

  return (
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
          <Button
            onClick={handleSaveContacts}
            disabled={updateContactsMutation.isPending}
          >
            {updateContactsMutation.isPending ? (
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
  );
};
