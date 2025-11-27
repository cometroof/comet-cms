import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  onSave?: (certificateIds: string[], badgeIds: string[]) => Promise<void>;
}

const CertificatesBadgesProfileDialog = ({
  isOpen,
  onClose,
  profileId,
  onSave,
}: Props) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("certificates");
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>(
    []
  );
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

  // Fetch all certificates
  const { data: certificates = [], isLoading: certificatesLoading } = useQuery({
    queryKey: ["all-certificates"],
    queryFn: productService.getAllCertificates,
    enabled: isOpen,
  });

  // Fetch all badges
  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ["all-badges"],
    queryFn: productService.getAllBadges,
    enabled: isOpen,
  });

  // Fetch assigned certificates (only in edit mode)
  const { data: assignedCertificates = [] } = useQuery({
    queryKey: ["profile-certificates", profileId],
    queryFn: () => productService.getProfileCertificates(profileId!),
    enabled: isOpen && !!profileId,
  });

  // Fetch assigned badges (only in edit mode)
  const { data: assignedBadges = [] } = useQuery({
    queryKey: ["profile-badges", profileId],
    queryFn: () => productService.getProfileBadges(profileId!),
    enabled: isOpen && !!profileId,
  });

  // Update selected items when assigned data changes
  useEffect(() => {
    if (assignedCertificates.length > 0) {
      setSelectedCertificates(assignedCertificates.map((c) => c.id));
    } else if (isOpen && !profileId) {
      // Create mode - reset to empty
      setSelectedCertificates([]);
    }
  }, [assignedCertificates, isOpen, profileId]);

  useEffect(() => {
    if (assignedBadges.length > 0) {
      setSelectedBadges(assignedBadges.map((b) => b.id));
    } else if (isOpen && !profileId) {
      // Create mode - reset to empty
      setSelectedBadges([]);
    }
  }, [assignedBadges, isOpen, profileId]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // If onSave callback is provided (create mode), use it
      if (onSave) {
        await onSave(selectedCertificates, selectedBadges);
        return;
      }

      // Edit mode - save directly
      if (!profileId) {
        throw new Error("Profile ID is missing");
      }

      const [certOk, badgesOk] = await Promise.all([
        productService.assignCertificatesToProfile(
          profileId,
          selectedCertificates
        ),
        productService.assignBadgesToProfile(profileId, selectedBadges),
      ]);

      if (!certOk || !badgesOk) {
        throw new Error("Failed to save certificates or badges");
      }
    },
    onSuccess: () => {
      if (onSave) {
        toast.success("Certificates and badges will be saved with the profile");
      } else {
        toast.success("Certificates and badges saved");
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({
          queryKey: ["profile-certificates", profileId],
        });
        queryClient.invalidateQueries({
          queryKey: ["profile-badges", profileId],
        });
      }
      onClose();
    },
    onError: (error) => {
      console.error("Error saving certificates/badges:", error);
      toast.error("An error occurred while saving");
    },
  });

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

  const handleSave = () => {
    saveMutation.mutate();
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
                  {certificatesLoading || badgesLoading ? (
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
                  {certificatesLoading || badgesLoading ? (
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
            <Button
              variant="outline"
              type="button"
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={saveMutation.isPending} onClick={handleSave}>
            {saveMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CertificatesBadgesProfileDialog;
