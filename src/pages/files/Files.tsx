import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import CertificateFormDialog from "@/components/CertificateFormDialog";
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
  CompanyProfile,
  CertificateFormData,
  CompanyProfileFormData,
} from "./types";
import {
  getCompanyProfile,
  updateCompanyProfile,
  getCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "@/lib/files-service";

const Files = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterImportant, setFilterImportant] = useState<boolean | null>(null);
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] =
    useState<Certificate | null>(null);
  const [fileSelectorOpen, setFileSelectorOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(
    null,
  );

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
  }, [profileError, certificatesError, toast]);

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      cert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.info.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterImportant === null || cert.is_important === filterImportant;
    return matchesSearch && matchesFilter;
  });

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
    };

    updateProfileMutation.mutate(
      { profileData, id: companyProfile?.id },
      {
        onSettled: () => {
          // Clear interval and set progress to 100%
          clearInterval(interval);
          setUploadProgress(100);
        },
      },
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
          (oldData: Certificate[] = []) => oldData.filter((c) => c.id !== id),
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
              oldData.map((c) => (c.id === editingCertificate.id ? result : c)),
          );

          toast({
            title: "Success",
            description: "Certificate updated successfully",
          });
        } else {
          // Add new certificate to cache
          queryClient.setQueryData(
            ["certificates"],
            (oldData: Certificate[] = []) => [...oldData, result],
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
    certData: CertificateFormData,
  ): Promise<void> => {
    await saveCertificateMutation.mutateAsync({
      id: editingCertificate?.id,
      data: certData,
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
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
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
                            companyProfile.uploaded_at || "",
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Certificates</CardTitle>
                    <CardDescription>
                      Manage company and product certificates
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleAddCertificate}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Certificate
                  </Button>
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
                  <div className="flex gap-2">
                    <Button
                      variant={filterImportant === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterImportant(null)}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterImportant === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterImportant(true)}
                    >
                      Important
                    </Button>
                    <Button
                      variant={
                        filterImportant === false ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setFilterImportant(false)}
                    >
                      Regular
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Info</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead className="w-32 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificatesLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <div className="flex justify-center items-center">
                              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                              <span>Loading certificates...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredCertificates.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground py-8"
                          >
                            No certificates found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCertificates.map((cert) => (
                          <TableRow key={cert.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{cert.name}</span>
                                {cert.is_important && (
                                  <Badge variant="default" className="gap-1">
                                    <Star className="w-3 h-3" />
                                    Important
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {cert.info}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="truncate max-w-[200px]">
                                  {cert.filename}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCertificate(cert)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleConfirmDeleteCertificate(cert.id)
                                  }
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
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

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              certificate and remove it from our servers.
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
