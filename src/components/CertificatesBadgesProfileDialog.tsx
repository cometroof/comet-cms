import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, X, FileText, Award, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as productService from "@/services/product.service";
import type { Certificate, ProductBadge } from "@/pages/product/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profileId?: string | null;
}

const CertificatesBadgesProfileDialog = ({
  isOpen,
  onClose,
  profileId,
}: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [badges, setBadges] = useState<ProductBadge[]>([]);

  const [activeTab, setActiveTab] = useState<string>("certificates");

  const [selectedCertificates, setSelectedCertificates] = useState<string[]>(
    []
  );
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

  useEffect(() => {
    // Load lists and assigned items when dialog opens for a profile
    if (!isOpen || !profileId) return;

    let mounted = true;
    const doLoad = async () => {
      setLoading(true);
      try {
        const [allCerts, allBadges, assignedCerts, assignedBadges] =
          await Promise.all([
            productService.getAllCertificates(),
            productService.getAllBadges(),
            productService.getProfileCertificates(profileId),
            productService.getProfileBadges(profileId),
          ]);

        if (!mounted) return;

        setCertificates(allCerts || []);
        setBadges(allBadges || []);
        setSelectedCertificates((assignedCerts || []).map((c) => c.id));
        setSelectedBadges((assignedBadges || []).map((b) => b.id));
      } catch (error) {
        console.error("Error loading profile certificates/badges:", error);
        toast.error("Failed to load certificates or badges");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    doLoad();

    return () => {
      mounted = false;
    };
  }, [isOpen, profileId]);

  const toggleCertificate = (id: string) => {
    setSelectedCertificates((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleBadge = (id: string) => {
    setSelectedBadges((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!profileId) return toast.error("Profile ID is missing");
    setSaving(true);
    try {
      const certOk = await productService.assignCertificatesToProfile(
        profileId,
        selectedCertificates
      );
      const badgesOk = await productService.assignBadgesToProfile(
        profileId,
        selectedBadges
      );

      if (certOk && badgesOk) {
        toast.success("Certificates and badges saved");
        onClose();
      } else {
        toast.error("Failed to save certificates or badges");
      }
    } catch (error) {
      console.error("Error saving certificates/badges:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Manage Certificates & Badges (Profile)</DialogTitle>
          <DialogDescription>
            Assign certificates and badges to this profile.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="certificates" className="p-0">
            <div className="max-h-[60vh] overflow-auto p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Certificates</CardTitle>
                  <CardDescription>
                    Select certificates to assign to this profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : certificates.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No certificates available
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {certificates.map((certificate) => (
                        <div
                          key={certificate.id}
                          className={`border rounded-md p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                            selectedCertificates.includes(certificate.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => toggleCertificate(certificate.id)}
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                            {certificate.image ? (
                              <img
                                src={certificate.image}
                                alt={certificate.name}
                                className="w-8 h-8 object-contain"
                              />
                            ) : (
                              <FileText className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-medium">{certificate.name}</h4>
                          </div>
                          <div className="flex-shrink-0">
                            {selectedCertificates.includes(certificate.id) ? (
                              <Check className="w-5 h-5 text-primary" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="badges" className="p-0">
            <div className="max-h-[60vh] overflow-auto p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                  <CardDescription>
                    Select badges to assign to this profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : badges.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No badges available
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {badges.map((badge) => (
                        <div
                          key={badge.id}
                          className={`border rounded-md p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                            selectedBadges.includes(badge.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => toggleBadge(badge.id)}
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                            {badge.image ? (
                              <img
                                src={badge.image}
                                alt={badge.name}
                                className="w-8 h-8 object-contain"
                              />
                            ) : (
                              <Award className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-medium">{badge.name}</h4>
                          </div>
                          <div className="flex-shrink-0">
                            {selectedBadges.includes(badge.id) ? (
                              <Check className="w-5 h-5 text-primary" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button" disabled={saving}>
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={saving} onClick={handleSave}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CertificatesBadgesProfileDialog;
