import { Control, UseFormWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProfileFormData } from "../types";

interface GeneralTabProps {
  control: Control<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
}

export default function GeneralTab({ control, watch }: GeneralTabProps) {
  return (
    <div className="max-h-[520px] overflow-y-auto space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter profile name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="size_per_panel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Size per Panel</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 1060mm × 2500mm"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="effective_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Effective Size</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 1000mm × 2400mm"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="panel_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Panel Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Number of panels"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="materials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Materials</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Zinc, Aluminum, Steel"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="tkdn_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>TKDN Value</FormLabel>
              <FormControl>
                <Input
                  placeholder="TKDN value"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
