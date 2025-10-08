import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit, Trash2, Download, Upload, FileText, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import CertificateFormDialog from "@/components/CertificateFormDialog";
import FileUploadDialog from "@/components/FileUploadDialog";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { CompanyProfile, Certificate } from "./types";

const Files = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterImportant, setFilterImportant] = useState<boolean | null>(null);
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock company profile data
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>({
    id: "1",
    file_url: "/placeholder.pdf",
    filename: "Company_Profile_2024.pdf",
    file_size: 2457600, // 2.4 MB
    uploaded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Mock certificates data
  const [certificates, setCertificates] = useState<Certificate[]>([
    {
      id: "1",
      name: "ISO 9001:2015",
      info: "Quality Management System",
      is_important: true,
      description_en: "International standard for quality management systems",
      description_id: "Standar internasional untuk sistem manajemen mutu",
      file_url: "/placeholder.pdf",
      filename: "ISO_9001_Certificate.pdf",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "2",
      name: "ISO 14001:2015",
      info: "Environmental Management",
      is_important: true,
      description_en: "Environmental management system certification",
      description_id: "Sertifikasi sistem manajemen lingkungan",
      file_url: "/placeholder.pdf",
      filename: "ISO_14001_Certificate.pdf",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Product Safety Certificate",
      info: "Fire Resistance Rating",
      is_important: false,
      description_en: "Certificate for fire resistance and safety standards",
      description_id: "Sertifikat untuk standar ketahanan api dan keamanan",
      file_url: "/placeholder.pdf",
      filename: "Product_Safety.pdf",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const filteredCertificates = certificates
    .filter((cert) => {
      const matchesSearch =
        cert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.info.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterImportant === null || cert.is_important === filterImportant;
      return matchesSearch && matchesFilter;
    });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleUploadCompanyProfile = (file: File) => {
    // Simulate upload
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setCompanyProfile({
            id: "1",
            file_url: URL.createObjectURL(file),
            filename: file.name,
            file_size: file.size,
            uploaded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          toast({
            title: "Success",
            description: "Company profile uploaded successfully",
          });
          setUploadDialogOpen(false);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleAddCertificate = () => {
    setEditingCertificate(null);
    setCertificateDialogOpen(true);
  };

  const handleEditCertificate = (certificate: Certificate) => {
    setEditingCertificate(certificate);
    setCertificateDialogOpen(true);
  };

  const handleDeleteCertificate = (id: string) => {
    setCertificates(certificates.filter((c) => c.id !== id));
    toast({
      title: "Success",
      description: "Certificate deleted successfully",
    });
  };

  const handleSaveCertificate = (certData: Partial<Certificate>) => {
    if (editingCertificate) {
      setCertificates(certificates.map((c) =>
        c.id === editingCertificate.id
          ? { ...c, ...certData, updated_at: new Date().toISOString() }
          : c
      ));
      toast({
        title: "Success",
        description: "Certificate updated successfully",
      });
    } else {
      const newCert: Certificate = {
        id: Date.now().toString(),
        ...certData as Omit<Certificate, 'id' | 'created_at' | 'updated_at'>,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCertificates([...certificates, newCert]);
      toast({
        title: "Success",
        description: "Certificate created successfully",
      });
    }
    setCertificateDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Files Management</h1>
          <p className="text-muted-foreground mt-1">Manage company profile and certificates</p>
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
                <CardDescription>Upload and manage your company profile PDF</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {companyProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{companyProfile.filename}</h3>
                        <p className="text-sm text-muted-foreground">
                          Size: {formatFileSize(companyProfile.file_size)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded: {new Date(companyProfile.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setUploadDialogOpen(true)}
                        >
                          <Upload className="w-4 h-4" />
                          Replace
                        </Button>
                      </div>
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="space-y-2">
                        <Label>Uploading...</Label>
                        <Progress value={uploadProgress} />
                        <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No company profile uploaded</h3>
                    <p className="text-muted-foreground mb-4">Upload your company profile PDF</p>
                    <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
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
                    <CardDescription>Manage company and product certificates</CardDescription>
                  </div>
                  <Button onClick={handleAddCertificate} size="sm" className="gap-2">
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
                      variant={filterImportant === false ? "default" : "outline"}
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
                        <TableHead className="w-32 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCertificates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
                            <TableCell className="text-muted-foreground">{cert.info}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="truncate max-w-[200px]">{cert.filename}</span>
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
                                  onClick={() => handleDeleteCertificate(cert.id)}
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

      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUploadCompanyProfile}
        acceptedTypes=".pdf"
        maxSize={10}
        title="Upload Company Profile"
      />
    </DashboardLayout>
  );
};

export default Files;
