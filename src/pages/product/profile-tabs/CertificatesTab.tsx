import { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Check } from "lucide-react";
import { ProfileFormData } from "../types";

interface Certificate {
  id: string;
  name: string;
  image?: string;
}

interface CertificatesTabProps {
  control: Control<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  availableCertificates: Certificate[];
  loadingCertsAndBadges: boolean;
}

export default function CertificatesTab({
  watch,
  setValue,
  availableCertificates,
  loadingCertsAndBadges,
}: CertificatesTabProps) {
  const selectedCertificates = watch("certificates") || [];

  const handleToggleCertificate = (certificateId: string) => {
    const isSelected = selectedCertificates.includes(certificateId);
    if (isSelected) {
      setValue(
        "certificates",
        selectedCertificates.filter((id) => id !== certificateId),
      );
    } else {
      setValue("certificates", [...selectedCertificates, certificateId]);
    }
  };

  return (
    <div className="max-h-[520px] overflow-y-auto">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Certificates</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Select certificates to associate with this profile
          </p>
        </div>

        {loadingCertsAndBadges ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !availableCertificates || availableCertificates.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No certificates available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {availableCertificates.map((certificate) => {
              const isSelected = selectedCertificates.includes(certificate.id);
              return (
                <div
                  key={certificate.id}
                  className={`border rounded-md p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleToggleCertificate(certificate.id)}
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
                    <h4 className="font-medium text-sm">{certificate.name}</h4>
                  </div>
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
