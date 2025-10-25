import { useState, useEffect } from "react";
import {
  ProductPremium,
  useProductQuery,
} from "@/contexts/ProductQueryContext";
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
import { Loader2, Crown, BadgeCheck, Trash } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import * as productService from "@/services/product.service";
import { PremiumFormData, Product } from "./types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ImageSelectorDialog } from "@/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/RichTextEditor";

// Define form validation schema
const formSchema = z.object({
  product_id: z.string(),
  material_fullname: z.string(),
  premium_image_url: z.string().optional(),
  description_en: z.string().optional(),
  description_id: z.string().optional(),
}) satisfies z.ZodType<Partial<ProductPremium>>;

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
  const [showPremiumImageSelector, setShowPremiumImageSelector] =
    useState(false);

  function onSelectPremiumImage() {
    setShowPremiumImageSelector(true);
  }

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: productId,
      material_fullname: "",
      premium_image_url: "",
      description_en: "",
      description_id: "",
    },
  });
  const { watch, control } = form;

  // Update local state when premiumData from context changes
  useEffect(() => {
    if (premiumData) {
      setPremium(premiumData);
      setFormVisible(true);

      form.reset({
        product_id: productId,
        material_fullname: premiumData.material_fullname || "",
        premium_image_url: premiumData.premium_image_url || "",
        description_en: premiumData.description_en || "",
        description_id: premiumData.description_id || "",
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
        premium_image_url: data.premium_image_url,
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

  const w_descriptionId = watch("description_id");
  const w_descriptionEn = watch("description_en");
  const [_descIdLoaded, setDescIdLoaded] = useState(false);
  const [_descEnLoaded, setDescEnLoaded] = useState(false);

  useEffect(() => {
    if (w_descriptionId !== undefined) setDescIdLoaded(true);
  }, [w_descriptionId]);

  useEffect(() => {
    if (w_descriptionEn !== undefined) setDescEnLoaded(true);
  }, [w_descriptionEn]);

  //
  const fieldImage = (
    <div>
      {/* Premium Image */}
      <FormField
        control={form.control}
        name="premium_image_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Premium Brand Image</FormLabel>
            <FormControl>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Premium image URL"
                    {...field}
                    value={field.value || ""}
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSelectPremiumImage}
                  >
                    Select
                  </Button>
                </div>
                {field.value && (
                  <div className="relative w-full h-32 border rounded-md overflow-hidden">
                    <img
                      src={field.value}
                      alt="Premium brand"
                      className="w-full h-full object-contain bg-muted"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => field.onChange("")}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </FormControl>
            <FormDescription>Brand image for premium profile</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
  //

  return (
    <>
      <Card>
        <CardHeader
          className={`flex flex-row items-center justify-between space-y-0 pb-2 p-6 rounded-md border-2 border-amber-700 ${premium === null ? "" : "bg-amber-50"}`}
        >
          <div className="space-y-1">
            <div className="flex items-start gap-4">
              <Crown className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  Premium Specifications
                </CardTitle>
                <CardDescription className="text-amber-800">
                  Add premium technical details for{" "}
                  <strong>{product.name}</strong>
                </CardDescription>
              </div>
            </div>
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
                this product. Premium products are featured with enhanced
                details on the website.
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
                <div className="xl:flex xl:items-start xl:gap-20">
                  {/*COL 1*/}
                  <div className="xl:w-1/3 xl:space-y-10">
                    {/*Material Name*/}
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
                    <div className="hidden xl:block">{fieldImage}</div>
                  </div>

                  {/*COL 2*/}
                  <div className="xl:w-2/3">
                    {/* Premium Descriptions */}
                    <div className="space-y-2">
                      <Label className="text-base font-medium">
                        Description
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Detailed description of this premium profile in multiple
                        languages
                      </p>
                      <Tabs defaultValue="en" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="en">English</TabsTrigger>
                          <TabsTrigger value="id">Bahasa Indonesia</TabsTrigger>
                        </TabsList>
                        <TabsContent value="id" className="mt-4">
                          <FormField
                            control={control}
                            name="description_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  {_descIdLoaded ? (
                                    <RichTextEditor
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-[300px] border rounded-lg">
                                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                  )}
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        <TabsContent value="en" className="mt-4">
                          <FormField
                            control={control}
                            name="description_en"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  {_descEnLoaded ? (
                                    <RichTextEditor
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-[300px] border rounded-lg">
                                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                  )}
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                    <div className="xl:hidden">{fieldImage}</div>
                  </div>
                </div>

                {/*ACTION AREA*/}
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
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
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
                <span className="text-sm font-medium">
                  Premium Status Active
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                This product has premium specifications and will be displayed
                with enhanced details.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Premium Image Selector */}
      <ImageSelectorDialog
        open={showPremiumImageSelector}
        onOpenChange={setShowPremiumImageSelector}
        onSelect={(url) => {
          form.setValue("premium_image_url", url);
          setShowPremiumImageSelector(false);
        }}
        title="Select Premium Brand Image"
        multiple={false}
        multipleSelection={false}
      />
    </>
  );
};

export default PremiumManager;
