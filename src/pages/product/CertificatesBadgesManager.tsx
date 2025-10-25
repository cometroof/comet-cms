import { useState, useEffect } from "react";
import { useProductQuery } from "@/contexts/ProductQueryContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Certificate, ProductBadge } from "./types";

interface CertificatesBadgesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  profileId?: string;
  entityType: "product" | "profile";
}

const CertificatesBadgesManager = ({
  isOpen,
  onClose,
  productId,
  profileId,
  entityType,
}: CertificatesBadgesManagerProps) => {
  const [activeTab, setActiveTab] = useState("certificates");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [badges, setBadges] = useState<ProductBadge[]>([]);

  const [selectedCertificates, setSelectedCertificates] = useState<string[]>(
    [],
  );
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

  const {
    availableCertificates,
    availableBadges,
    certificates: productCertificates,
    refetchAll,
  } = useProductQuery();

  const loadCertsAndBadges = async () => {
    setLoading(true);
    try {
      // Set available certificates and badges from context
      setCertificates((availableCertificates || []) as Certificate[]);
      setBadges((availableBadges || []) as ProductBadge[]);

      // Load assigned certificates
      let assignedCertificates: Certificate[] = [];
      if (entityType === "product" && productId) {
        // For products, we can use certificates from context
        assignedCertificates = (productCertificates || []) as Certificate[];
      } else if (entityType === "profile" && profileId) {
        // For profiles, we still need to fetch specifically
        assignedCertificates =
          await productService.getProfileCertificates(profileId);
      }

      // Set selected certificate IDs
      setSelectedCertificates(assignedCertificates.map((cert) => cert.id));

      // Load assigned badges (only for profiles)
      if (entityType === "profile" && profileId) {
        const assignedBadges = await productService.getProfileBadges(profileId);
        setSelectedBadges(assignedBadges.map((badge) => badge.id));
      } else {
        setSelectedBadges([]);
      }
    } catch (error) {
      console.error("Error loading certificates and badges:", error);
      toast.error("Failed to load certificates and badges");
    } finally {
      setLoading(false);
    }
  };

  // Load certificates and badges from context when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadCertsAndBadges();
    }
  }, [isOpen, productId, profileId, entityType]);

  const toggleCertificate = (id: string) => {
    setSelectedCertificates((prev) =>
      prev.includes(id)
        ? prev.filter((certId) => certId !== id)
        : [...prev, id],
    );
  };

  const toggleBadge = (id: string) => {
    setSelectedBadges((prev) =>
      prev.includes(id)
        ? prev.filter((badgeId) => badgeId !== id)
        : [...prev, id],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let certificateSaved = false;
      let badgesSaved = false;

      // Save certificates
      if (entityType === "product" && productId) {
        certificateSaved = await productService.assignCertificatesToProduct(
          productId,
          selectedCertificates,
        );
      } else if (entityType === "profile" && profileId) {
        certificateSaved = await productService.assignCertificatesToProfile(
          profileId,
          selectedCertificates,
        );

        // Save badges (only for profiles)
        badgesSaved = await productService.assignBadgesToProfile(
          profileId,
          selectedBadges,
        );
      }

      // Refresh data in the context
      refetchAll();

      if (certificateSaved && (entityType === "product" || badgesSaved)) {
        toast.success("Certificates and badges saved successfully");
        onClose();
      } else {
        toast.error("Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving certificates and badges:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Certificates & Badges</DialogTitle>
          <DialogDescription>
            {entityType === "product"
              ? "Assign certificates to this product"
              : "Assign certificates and badges to this profile"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="badges" disabled={entityType === "product"}>
              Badges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Certificates</CardTitle>
                <CardDescription>
                  Select the certificates to associate with this {entityType}
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
          </TabsContent>

          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Badges</CardTitle>
                <CardDescription>
                  Select the badges to associate with this profile
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

export default CertificatesBadgesManager;
