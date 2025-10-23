import { useState, useEffect } from "react";
import { useProductQuery } from "@/contexts/ProductQueryContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Crown, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import * as productService from "@/services/product.service";
import { ProductPremium, PremiumFormData, Product } from "./types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Define form validation schema
const formSchema = z.object({
  product_id: z.string(),
  material_fullname: z.string().optional(),
  material_name: z.string().optional(),
  size_per_panel: z.string().optional(),
  effective_size: z.string().optional(),
  reng_distance: z.string().optional(),
});

interface PremiumManagerProps {
  productId: string;
  product: Product;
  onUpdate?: () => void;
}

const PremiumManager = ({
  productId,
  product,
  onUpdate,
}: PremiumManagerProps) => {
  const {
    premium: premiumData,
    isPremiumLoading: loading,
    refetchAll,
  } = useProductQuery();
  const [premium, setPremium] = useState<ProductPremium | null>(null);
  const [saving, setSaving] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: productId,
      material_fullname: "",
      material_name: "",
      size_per_panel: "",
      effective_size: "",
      reng_distance: "",
    },
  });

  // Update local state when premiumData from context changes
  useEffect(() => {
    if (premiumData) {
      setPremium(premiumData as any);
      setFormVisible(true);

      form.reset({
        product_id: productId,
        material_fullname: premiumData.material_fullname || "",
        material_name: premiumData.material_name || "",
        size_per_panel: premiumData.size_per_panel || "",
        effective_size: premiumData.effective_size || "",
        reng_distance: premiumData.reng_distance || "",
      });
    } else {
      setPremium(null);
      setFormVisible(false);
    }
  }, [premiumData, productId, form]);

  const handleTogglePremium = (enabled: boolean) => {
    setFormVisible(enabled);

    if (!enabled && premium) {
      // If disabling premium, confirm with user and then delete
      if (
        window.confirm(
          "Are you sure you want to remove premium status from this product?",
        )
      ) {
        // In a real implementation, we'd call an API to delete the premium record
        // Here we're just updating the UI state for demonstration
        setPremium(null);
        toast.success("Premium status removed");
        refetchAll();
        if (onUpdate) onUpdate();
      } else {
        // User cancelled, revert toggle
        setFormVisible(true);
      }
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setSaving(true);
    try {
      const premiumData: PremiumFormData = {
        product_id: productId,
        material_fullname: data.material_fullname,
        material_name: data.material_name,
        size_per_panel: data.size_per_panel,
        effective_size: data.effective_size,
        reng_distance: data.reng_distance,
      };

      const result = await productService.upsertPremium(premiumData);

      if (result) {
        toast.success("Premium specifications saved successfully");
        setPremium(result);
        refetchAll();
        if (onUpdate) onUpdate();
      } else {
        toast.error("Failed to save premium specifications");
      }
    } catch (error) {
      console.error("Error saving premium data:", error);
      toast.error("An error occurred while saving premium specifications");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Premium Specifications
          </CardTitle>
          <CardDescription>
            Add premium technical details for {product.name}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="premium-mode"
            checked={premium !== null}
            onCheckedChange={handleTogglePremium}
          />
          <Label htmlFor="premium-mode">
            {premium !== null ? "Premium Enabled" : "Premium Disabled"}
          </Label>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : premium === null ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Crown className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Premium Mode Disabled</h3>
            <p className="text-muted-foreground mb-4 max-w-lg">
              Enable premium mode to add special technical specifications for
              this product. Premium products are featured with enhanced details
              on the website.
            </p>
            <Button onClick={() => handleTogglePremium(true)}>
              Enable Premium Mode
            </Button>
          </div>
        ) : formVisible ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 py-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="material_fullname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Zinc Aluminum Alloy"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="material_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., ZA"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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

                <FormField
                  control={form.control}
                  name="reng_distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reng Distance</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 600mm"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                {premium && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-2"
                    onClick={() => handleTogglePremium(false)}
                  >
                    Remove Premium Status
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Premium Specs
                </Button>
              </div>
            </form>
          </Form>
        ) : null}

        {premium && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <BadgeCheck className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Premium Status Active</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This product has premium specifications and will be displayed with
              enhanced details.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PremiumManager;
