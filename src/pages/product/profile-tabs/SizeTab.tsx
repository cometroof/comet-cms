import { Control, UseFormWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash } from "lucide-react";
import { ProfileFormData } from "../types";

interface SizeTabProps {
  control: Control<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
  addSizeItem: () => void;
  removeSizeItem: (index: number) => void;
}

export default function SizeTab({
  control,
  watch,
  addSizeItem,
  removeSizeItem,
}: SizeTabProps) {
  const sizeItems = watch("size") || [];

  return (
    <div className="max-h-[520px] overflow-y-auto">
      <div className="space-y-4 grid-flow-col">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Size Specifications</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={addSizeItem}
            disabled={sizeItems.length >= 5}
          >
            <PlusCircle className="h-4 w-4" />
            Add Size
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Add up to 5 size specifications with name, weight and thickness
        </p>

        {sizeItems.map((_, index) => (
          <div key={index} className="space-y-4 rounded-md border p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Size {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSizeItem(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={control}
                name={`size.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Size name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`size.${index}.weight`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight*</FormLabel>
                    <FormControl>
                      <Input placeholder="Weight" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`size.${index}.thickness`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thickness*</FormLabel>
                    <FormControl>
                      <Input placeholder="Thickness" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}

        {sizeItems.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No size specifications added yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add specifications including name, weight, and thickness
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 gap-1"
              onClick={addSizeItem}
            >
              <PlusCircle className="h-4 w-4" />
              Add Size
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
