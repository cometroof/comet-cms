import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Upload,
  FileText,
  Star,
  Loader2,
  GripVertical,
  Image,
  ArrowUpRight,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import CertificateFormDialog from "@/components/CertificateFormDialog";
import ProductBadgeFormDialog from "@/components/ProductBadgeFormDialog";
import FileSelectorDialog from "@/components/FileSelectorDialog/FileSelectorDialog";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  Certificate,
  CertificateFormData,
  CompanyProfileFormData,
  ProductBadge,
  ProductBadgeFormData,
} from "./types";
import {
  getCompanyProfile,
  updateCompanyProfile,
  getProductCatalogue,
  updateProductCatalogue,
  getCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  updateCertificateOrder,
  getProductBadges,
  createProductBadge,
  updateProductBadge,
  updateProductBadgeOrder,
  deleteProductBadge,
} from "@/lib/files-service";
import { Link } from "react-router-dom";

const Files = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  // No longer needed filter
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] =
    useState<Certificate | null>(null);
  const [fileSelectorOpen, setFileSelectorOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(
    null
  );
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<ProductBadge | null>(null);
  const [badgeToDelete, setBadgeToDelete] = useState<string | null>(null);
  const [catalogueFileSelectorOpen, setCatalogueFileSelectorOpen] =
    useState(false);
  const [catalogueUploadProgress, setCatalogueUploadProgress] = useState(0);

  // Query for company profile
  const {
    data: companyProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["companyProfile"],
    queryFn: getCompanyProfile,
  });

  // Query for certificates
  const {
    data: certificates = [],
    isLoading: certificatesLoading,
    error: certificatesError,
  } = useQuery({
    queryKey: ["certificates"],
    queryFn: getCertificates,
  });

  // Query for product badges
  const {
    data: productBadges = [],
    isLoading: badgesLoading,
    error: badgesError,
  } = useQuery({
    queryKey: ["productBadges"],
    queryFn: getProductBadges,
  });

  // Query for product catalogue
  const {
    data: productCatalogue,
    isLoading: catalogueLoading,
    error: catalogueError,
  } = useQuery({
    queryKey: ["productCatalogue"],
    queryFn: getProductCatalogue,
  });

  // Show toast for query errors
  React.useEffect(() => {
    if (profileError) {
      console.error("Error loading company profile:", profileError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load company profile",
      });
    }

    if (certificatesError) {
      console.error("Error loading certificates:", certificatesError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load certificates",
      });
    }

    if (badgesError) {
      console.error("Error loading product badges:", badgesError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load product badges",
      });
    }

    if (catalogueError) {
      console.error("Error loading product catalogue:", catalogueError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load product catalogue",
      });
    }
  }, [profileError, certificatesError, badgesError, catalogueError, toast]);

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      cert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.info.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Mutation for updating certificate order
  const updateOrderMutation = useMutation({
    mutationFn: (certificates: { id: string; order: number }[]) =>
      updateCertificateOrder(certificates),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certificate order updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating certificate order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update certificate order",
      });
      // Refetch to restore original order
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
  });

  // Mutation for updating product badge order
  const updateBadgeOrderMutation = useMutation({
    mutationFn: (badges: { id: string; order: number }[]) =>
      updateProductBadgeOrder(badges),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product badge order updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating product badge order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product badge order",
      });
      // Refetch to restore original order
      queryClient.invalidateQueries({ queryKey: ["productBadges"] });
    },
  });

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    // Create a copy of the current certificates array
    const updatedCertificates = [...certificates];

    // Remove the dragged item and insert at the destination
    const [removed] = updatedCertificates.splice(sourceIndex, 1);
    updatedCertificates.splice(destinationIndex, 0, removed);

    // Update order property for all certificates based on their new positions
    const reorderedCertificates = updatedCertificates.map((cert, index) => ({
      ...cert,
      order: index,
    }));

    // Update the cache immediately for a responsive UI
    queryClient.setQueryData(["certificates"], reorderedCertificates);

    // Save the new order to the database
    updateOrderMutation.mutate(
      reorderedCertificates.map((cert) => ({
        id: cert.id,
        order: cert.order as number,
      }))
    );
  };

  // Handle drag and drop reordering for product badges
  const handleBadgeDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const updatedBadges = [...productBadges];
    const [removed] = updatedBadges.splice(sourceIndex, 1);
    updatedBadges.splice(destinationIndex, 0, removed);

    const reordered = updatedBadges.map((b, index) => ({
      ...b,
      order: index,
    }));

    // Optimistically update cache
    queryClient.setQueryData(["productBadges"], reordered);

    updateBadgeOrderMutation.mutate(
      reordered.map((b) => ({ id: b.id as string, order: b.order as number }))
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Mutation for updating company profile
  const updateProfileMutation = useMutation({
    mutationFn: ({
      profileData,
      id,
    }: {
      profileData: CompanyProfileFormData;
      id?: string;
    }) => updateCompanyProfile(profileData, id),
    onSuccess: (result) => {
      // Update react-query cache
      queryClient.setQueryData(["companyProfile"], result);

      toast({
        title: "Success",
        description: "Company profile updated successfully",
      });

      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    },
    onError: (error) => {
      console.error("Error updating company profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update company profile",
      });

      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    },
  });

  const handleSelectCompanyProfile = (fileUrl: string) => {
    setUploadProgress(0);
    const filename = fileUrl.split("/").pop() || "company_profile.pdf";

    // Simulate progress for user feedback
    const interval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    // Create or update company profile in Supabase
    const profileData: CompanyProfileFormData = {
      file_url: fileUrl,
      filename: filename,
      file_size: 1000000, // Estimate file size since we don't have actual size
      type: "company_profile",
    };

    updateProfileMutation.mutate(
      { profileData, id: companyProfile?.id },
      {
        onSettled: () => {
          // Clear interval and set progress to 100%
          clearInterval(interval);
          setUploadProgress(100);
        },
      }
    );
  };

  // Mutation for updating product catalogue
  const updateCatalogueMutation = useMutation({
    mutationFn: ({
      catalogueData,
      id,
    }: {
      catalogueData: CompanyProfileFormData;
      id?: string;
    }) => updateProductCatalogue(catalogueData, id),
    onSuccess: (result) => {
      // Update react-query cache
      queryClient.setQueryData(["productCatalogue"], result);

      toast({
        title: "Success",
        description: "Product catalogue updated successfully",
      });

      // Reset progress after a delay
      setTimeout(() => {
        setCatalogueUploadProgress(0);
      }, 1000);
    },
    onError: (error) => {
      console.error("Error updating product catalogue:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product catalogue",
      });

      setTimeout(() => {
        setCatalogueUploadProgress(0);
      }, 1000);
    },
  });

  const handleSelectProductCatalogue = (fileUrl: string) => {
    setCatalogueUploadProgress(0);
    const filename = fileUrl.split("/").pop() || "product_catalogue.pdf";

    // Simulate progress for user feedback
    const interval = setInterval(() => {
      setCatalogueUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    // Create or update product catalogue in Supabase
    const catalogueData: CompanyProfileFormData = {
      file_url: fileUrl,
      filename: filename,
      file_size: 1000000, // Estimate file size since we don't have actual size
      type: "product_catalogue",
    };

    updateCatalogueMutation.mutate(
      { catalogueData, id: productCatalogue?.id },
      {
        onSettled: () => {
          // Clear interval and set progress to 100%
          clearInterval(interval);
          setCatalogueUploadProgress(100);
        },
      }
    );
  };

  const handleAddCertificate = () => {
    setEditingCertificate(null);
    setCertificateDialogOpen(true);
  };

  const handleEditCertificate = (certificate: Certificate) => {
    setEditingCertificate(certificate);
    setCertificateDialogOpen(true);
  };

  const handleConfirmDeleteCertificate = (id: string) => {
    setCertificateToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Mutation for deleting certificates
  const deleteCertificateMutation = useMutation({
    mutationFn: (id: string) => deleteCertificate(id),
    onSuccess: (success, id) => {
      if (success) {
        // Update react-query cache
        queryClient.setQueryData(
          ["certificates"],
          (oldData: Certificate[] = []) => oldData.filter((c) => c.id !== id)
        );

        toast({
          title: "Success",
          description: "Certificate deleted successfully",
        });
      } else {
        throw new Error("Failed to delete certificate");
      }
    },
    onError: (error, id) => {
      console.error(`Error deleting certificate with id ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete certificate",
      });
    },
  });

  const handleDeleteCertificate = () => {
    if (certificateToDelete) {
      deleteCertificateMutation.mutate(certificateToDelete);
      setDeleteDialogOpen(false);
      setCertificateToDelete(null);
    } else if (badgeToDelete) {
      handleDeleteBadge();
    }
  };

  // Mutation for saving certificates (create or update)
  const saveCertificateMutation = useMutation<
    Certificate | null,
    Error,
    { id?: string; data: CertificateFormData }
  >({
    mutationFn: ({ id, data }: { id?: string; data: CertificateFormData }) =>
      id ? updateCertificate(id, data) : createCertificate(data),
    onSuccess: (result) => {
      if (result) {
        if (editingCertificate) {
          // Update existing certificate in cache
          queryClient.setQueryData(
            ["certificates"],
            (oldData: Certificate[] = []) =>
              oldData.map((c) => (c.id === editingCertificate.id ? result : c))
          );

          toast({
            title: "Success",
            description: "Certificate updated successfully",
          });
        } else {
          // Add new certificate to cache
          queryClient.setQueryData(
            ["certificates"],
            (oldData: Certificate[] = []) => [...oldData, result]
          );

          toast({
            title: "Success",
            description: "Certificate created successfully",
          });
        }
      } else {
        throw new Error("Failed to save certificate");
      }
    },
    onError: (error) => {
      console.error("Error saving certificate:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save certificate",
      });
      throw error; // Re-throw to let the dialog component know the operation failed
    },
  });

  const handleSaveCertificate = async (
    certData: CertificateFormData
  ): Promise<void> => {
    await saveCertificateMutation.mutateAsync({
      id: editingCertificate?.id,
      data: certData,
    });
  };

  // Product Badge handling functions
  const handleAddBadge = () => {
    setEditingBadge(null);
    setBadgeDialogOpen(true);
  };

  const handleEditBadge = (badge: ProductBadge) => {
    setEditingBadge(badge);
    setBadgeDialogOpen(true);
  };

  const handleConfirmDeleteBadge = (id: string) => {
    setBadgeToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Mutation for deleting product badges
  const deleteProductBadgeMutation = useMutation<boolean, Error, string>({
    mutationFn: (id: string) => deleteProductBadge(id),
    onSuccess: (success, id) => {
      if (success) {
        // Update react-query cache
        queryClient.setQueryData(
          ["productBadges"],
          (oldData: ProductBadge[] = []) => oldData.filter((b) => b.id !== id)
        );

        toast({
          title: "Success",
          description: "Product badge deleted successfully",
        });
      } else {
        throw new Error("Failed to delete product badge");
      }
    },
    onError: (error, id) => {
      console.error(`Error deleting product badge with id ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product badge",
      });
    },
  });

  const handleDeleteBadge = () => {
    if (badgeToDelete) {
      deleteProductBadgeMutation.mutate(badgeToDelete);
      setDeleteDialogOpen(false);
      setBadgeToDelete(null);
    }
  };

  // Mutation for saving product badges (create or update)
  const saveProductBadgeMutation = useMutation<
    ProductBadge | null,
    Error,
    { id?: string; data: ProductBadgeFormData }
  >({
    mutationFn: ({ id, data }: { id?: string; data: ProductBadgeFormData }) =>
      id ? updateProductBadge(id, data) : createProductBadge(data),
    onSuccess: (result) => {
      if (result) {
        if (editingBadge) {
          // Update existing badge in cache
          queryClient.setQueryData(
            ["productBadges"],
            (oldData: ProductBadge[] = []) =>
              oldData.map((b) => (b.id === editingBadge.id ? result : b))
          );

          toast({
            title: "Success",
            description: "Product badge updated successfully",
          });
        } else {
          // Add new badge to cache
          queryClient.setQueryData(
            ["productBadges"],
            (oldData: ProductBadge[] = []) => [...oldData, result]
          );

          toast({
            title: "Success",
            description: "Product badge created successfully",
          });
        }
      } else {
        throw new Error("Failed to save product badge");
      }
    },
    onError: (error) => {
      console.error("Error saving product badge:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save product badge",
      });
      throw error;
    },
  });

  const handleSaveBadge = async (
    badgeData: ProductBadgeFormData
  ): Promise<void> => {
    await saveProductBadgeMutation.mutateAsync({
      id: editingBadge?.id || undefined,
      data: badgeData,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Files Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage company profile and certificates
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Company Profile</TabsTrigger>
            <TabsTrigger value="product-catalogue">
              Product Catalogue
            </TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="product-badges">Product Badges</TabsTrigger>
          </TabsList>

          {/* Company Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile Document</CardTitle>
                <CardDescription>
                  Upload and manage your company profile PDF
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileLoading ? (
                  <div className="flex justify-center items-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
                    <p>Loading company profile...</p>
                  </div>
                ) : companyProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {companyProfile.filename}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Size: {formatFileSize(companyProfile.file_size)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded:{" "}
                          {new Date(
                            companyProfile.uploaded_at || ""
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            window.open(companyProfile.file_url, "_blank")
                          }
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setFileSelectorOpen(true)}
                        >
                          <Upload className="w-4 h-4" />
                          Replace
                        </Button>
                      </div>
                    </div>

                    {uploadProgress > 0 && (
                      <div className="space-y-2">
                        <Label>Uploading...</Label>
                        <Progress value={uploadProgress} />
                        <p className="text-sm text-muted-foreground">
                          {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No company profile uploaded
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your company profile PDF
                    </p>
                    <Button
                      onClick={() => setFileSelectorOpen(true)}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div>
                    <CardTitle>Certificates</CardTitle>
                    <CardDescription>
                      Manage company and product certificates
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search certificates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div>
                    <Button
                      size="sm"
                      onClick={() => handleAddCertificate()}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Certificate
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="w-16"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead className="w-32 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="certificates">
                        {(provided) => (
                          <TableBody
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {certificatesLoading ? (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center py-8"
                                >
                                  <div className="flex justify-center items-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                                    <span>Loading certificates...</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : filteredCertificates.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center text-muted-foreground py-8"
                                >
                                  No certificates found
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredCertificates.map((cert, index) => (
                                <Draggable
                                  key={cert.id}
                                  draggableId={cert.id}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <TableRow
                                      key={cert.id}
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={
                                        snapshot.isDragging ? "opacity-50" : ""
                                      }
                                    >
                                      <TableCell
                                        {...provided.dragHandleProps}
                                        className="w-8 cursor-grab"
                                      >
                                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                                      </TableCell>
                                      <TableCell>
                                        {cert.image ? (
                                          <div className="flex justify-center items-center">
                                            <img
                                              src={cert.image}
                                              alt={cert.name}
                                              className="h-10 w-10 object-contain"
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex justify-center items-center h-10 w-10">
                                            <FileText className="h-6 w-6 text-muted-foreground" />
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            {cert.name}
                                          </span>
                                          {cert.label_name && (
                                            <div className="text-sm text-muted-foreground">
                                              {cert.label_name}
                                            </div>
                                          )}
                                          <div className="text-muted-foreground">
                                            {cert.info}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                          <Link
                                            to={cert.file_url}
                                            target="_blank"
                                            className="flex gap-1 items-center"
                                          >
                                            <FileText className="size-4 text-muted-foreground" />
                                            <ArrowUpRight className="size-4 text-primary" />
                                          </Link>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleEditCertificate(cert)
                                            }
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleConfirmDeleteCertificate(
                                                cert.id
                                              )
                                            }
                                          >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </TableBody>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Product Badges Tab */}
          <TabsContent value="product-badges" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div>
                    <CardTitle>Product Badges</CardTitle>
                    <CardDescription>
                      Manage badges displayed on products
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleAddBadge} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Badge
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="w-16">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-32 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <DragDropContext onDragEnd={handleBadgeDragEnd}>
                      <Droppable droppableId="productBadges">
                        {(provided) => (
                          <TableBody
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {badgesLoading ? (
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className="text-center py-8"
                                >
                                  <div className="flex justify-center items-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                                    <span>Loading badges...</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : productBadges.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className="text-center text-muted-foreground py-8"
                                >
                                  No product badges found
                                </TableCell>
                              </TableRow>
                            ) : (
                              productBadges.map((badge, index) => (
                                <Draggable
                                  key={badge.id}
                                  draggableId={badge.id}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <TableRow
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={
                                        snapshot.isDragging ? "opacity-50" : ""
                                      }
                                    >
                                      <TableCell
                                        {...provided.dragHandleProps}
                                        className="w-8 cursor-grab"
                                      >
                                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                                      </TableCell>
                                      <TableCell>
                                        {badge.image ? (
                                          <div className="flex justify-center items-center">
                                            <img
                                              src={badge.image}
                                              alt={badge.name}
                                              className="h-10 w-10 object-contain"
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex justify-center items-center h-10 w-10">
                                            <Image className="h-6 w-6 text-muted-foreground" />
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <span className="font-medium">
                                          {badge.name}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleEditBadge(badge)
                                            }
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleConfirmDeleteBadge(
                                                badge.id as string
                                              )
                                            }
                                          >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </TableBody>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Product Catalogue Tab */}
          <TabsContent value="product-catalogue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Catalogue Document</CardTitle>
                <CardDescription>
                  Upload and manage your product catalogue PDF
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {catalogueLoading ? (
                  <div className="flex justify-center items-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
                    <p>Loading product catalogue...</p>
                  </div>
                ) : productCatalogue ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {productCatalogue.filename}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Size: {formatFileSize(productCatalogue.file_size)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded:{" "}
                          {new Date(
                            productCatalogue.uploaded_at || ""
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            window.open(productCatalogue.file_url, "_blank")
                          }
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setCatalogueFileSelectorOpen(true)}
                        >
                          <Upload className="w-4 h-4" />
                          Replace
                        </Button>
                      </div>
                    </div>

                    {catalogueUploadProgress > 0 && (
                      <div className="space-y-2">
                        <Label>Uploading...</Label>
                        <Progress value={catalogueUploadProgress} />
                        <p className="text-sm text-muted-foreground">
                          {catalogueUploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No product catalogue uploaded
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your product catalogue PDF
                    </p>
                    <Button
                      onClick={() => setCatalogueFileSelectorOpen(true)}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Catalogue
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CertificateFormDialog
        open={certificateDialogOpen}
        onOpenChange={setCertificateDialogOpen}
        certificate={editingCertificate}
        onSave={handleSaveCertificate}
      />

      <FileSelectorDialog
        open={fileSelectorOpen}
        onOpenChange={setFileSelectorOpen}
        onSelect={handleSelectCompanyProfile}
        title="Select Company Profile"
        acceptedFileTypes=".pdf"
        maxFileSize={10}
      />

      <ProductBadgeFormDialog
        open={badgeDialogOpen}
        onOpenChange={setBadgeDialogOpen}
        badge={editingBadge}
        onSave={handleSaveBadge}
      />

      <FileSelectorDialog
        open={catalogueFileSelectorOpen}
        onOpenChange={setCatalogueFileSelectorOpen}
        onSelect={handleSelectProductCatalogue}
        title="Select Product Catalogue"
        acceptedFileTypes=".pdf"
        maxFileSize={10}
      />

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              {certificateToDelete ? " certificate " : " product badge "}
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCertificate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Files;
