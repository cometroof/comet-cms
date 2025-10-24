import { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Award, Loader2, Check } from "lucide-react";
import { ProfileFormData } from "../types";

interface Badge {
  id: string;
  name: string;
  image?: string;
}

interface BadgesTabProps {
  control: Control<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  availableBadges: Badge[];
  loadingCertsAndBadges: boolean;
}

export default function BadgesTab({
  watch,
  setValue,
  availableBadges,
  loadingCertsAndBadges,
}: BadgesTabProps) {
  const selectedBadges = watch("badges") || [];

  const handleToggleBadge = (badgeId: string) => {
    const isSelected = selectedBadges.includes(badgeId);
    if (isSelected) {
      setValue(
        "badges",
        selectedBadges.filter((id) => id !== badgeId),
      );
    } else {
      setValue("badges", [...selectedBadges, badgeId]);
    }
  };

  return (
    <div className="max-h-[520px] overflow-y-auto">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Badges</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Select badges to associate with this profile
          </p>
        </div>

        {loadingCertsAndBadges ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !availableBadges || availableBadges.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No badges available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {availableBadges.map((badge) => {
              const isSelected = selectedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`border rounded-md p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleToggleBadge(badge.id)}
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
                    <h4 className="font-medium text-sm">{badge.name}</h4>
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
