import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Save,
  Loader2,
  Building2,
  MapPin,
  PhoneCall,
  Printer,
  Mail,
  MessageCircle,
  SendHorizonal,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import type { Contacts } from "@/types/contacts-location";
import * as contactsLocationService from "@/services/contacts-location.service";

// Zod Schema untuk validasi
const contactsSchema = z.object({
  head_office: z.string().min(1, "Head office is required"),
  head_office_link: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "Head office link is required")
    .refine(
      (url) => url.includes("google.com/maps") || url.includes("goo.gl/maps"),
      "Please provide a valid Google Maps link",
    ),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
      "Please enter a valid phone number",
    ),
  fax: z
    .string()
    .regex(
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
      "Please enter a valid fax number",
    )
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  email_form: z
    .string()
    .min(1, "Email form is required")
    .email("Please enter a valid email address"),
  whatsapp_contact_service: z
    .string()
    .min(1, "WhatsApp number is required")
    .regex(
      /^[\+]?[0-9]{10,15}$/,
      "Please enter a valid WhatsApp number (10-15 digits)",
    ),
});

type ContactsFormData = z.infer<typeof contactsSchema>;

interface ContactsTabProps {
  initialContacts: Contacts;
}

export const ContactsTab = ({ initialContacts }: ContactsTabProps) => {
  const form = useForm<ContactsFormData>({
    resolver: zodResolver(contactsSchema),
    defaultValues: {
      head_office: initialContacts.head_office || "",
      head_office_link: initialContacts.head_office_link || "",
      phone: initialContacts.phone || "",
      fax: initialContacts.fax || "",
      email: initialContacts.email || "",
      email_form: initialContacts.email_form || "",
      whatsapp_contact_service: initialContacts.whatsapp_contact_service || "",
    },
  });

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

  const onSubmit = (data: ContactsFormData) => {
    updateContactsMutation.mutate(data as Contacts);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="head_office"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="size-4" /> Head Office
                  </FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="head_office_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    Head Office Link{" "}
                    <span className="text-xs text-primary">
                      (Google Maps Embed)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://maps.google.com/?q=..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <PhoneCall className="size-4" />
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+62-21-1234567"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Printer className="size-4" /> Fax
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+62-21-1234568"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="size-4" /> Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="info@company.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email_form"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <SendHorizonal className="size-4" /> Email Form
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="info@company.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="whatsapp_contact_service"
                render={({ field }) => (
                  <FormItem className="py-2 px-3 rounded-md bg-green-100 border border-green-800">
                    <FormLabel className="flex items-center gap-2">
                      <MessageCircle className="size-4" /> WhatsApp Contact
                      Service
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+6281234567890"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateContactsMutation.isPending}>
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
