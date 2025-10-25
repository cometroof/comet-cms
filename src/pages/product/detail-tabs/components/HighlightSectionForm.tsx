import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components";
import { Sparkles, Upload, X } from "lucide-react";
import { Product } from "../../types";

interface HighlightSectionFormProps {
  product: Product;
  onProductChange: (updates: Partial<Product>) => void;
  onIconSelect: () => void;
}

export default function HighlightSectionForm({
  product,
  onProductChange,
  onIconSelect,
}: HighlightSectionFormProps) {
  const [formData, setFormData] = useState({
    is_highlight_section: product?.is_highlight_section || false,
    highlight_icon: product?.highlight_icon || "",
    highlight_top_label_en: product?.highlight_top_label_en || "",
    highlight_top_label_id: product?.highlight_top_label_id || "",
    highlight_top_description_en: product?.highlight_top_description_en || "",
    highlight_top_description_id: product?.highlight_top_description_id || "",
    highlight_bottom_label_en: product?.highlight_bottom_label_en || "",
    highlight_bottom_label_id: product?.highlight_bottom_label_id || "",
    highlight_bottom_description_en:
      product?.highlight_bottom_description_en || "",
    highlight_bottom_description_id:
      product?.highlight_bottom_description_id || "",
  });

  const handleFieldChange = (field: string, value: string | boolean) => {
    const updates = { ...formData, [field]: value };
    setFormData(updates);
    onProductChange(updates);
  };

  const handleRemoveIcon = () => {
    handleFieldChange("highlight_icon", "");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Highlight Section
          </CardTitle>
          <Switch
            checked={formData.is_highlight_section}
            onCheckedChange={(checked) =>
              handleFieldChange("is_highlight_section", checked)
            }
          />
        </div>
        <CardDescription>
          Special highlight content for product page
        </CardDescription>
      </CardHeader>
      {formData.is_highlight_section && (
        <CardContent className="space-y-6">
          {/* Highlight Icon */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Highlight Icon</Label>
            <div className="flex items-start gap-3">
              {formData.highlight_icon ? (
                <div className="relative w-20 h-20 border rounded-md overflow-hidden bg-muted/20 flex items-center justify-center group">
                  <img
                    src={formData.highlight_icon}
                    alt="Highlight icon"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={handleRemoveIcon}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 border-2 border-dashed rounded-md bg-muted/20 flex items-center justify-center text-muted-foreground">
                  <Upload className="h-6 w-6" />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onIconSelect}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {formData.highlight_icon ? "Change Icon" : "Select Icon"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Top Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Top Section</Label>
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="en">EN</TabsTrigger>
                <TabsTrigger value="id">ID</TabsTrigger>
              </TabsList>
              <TabsContent value="en" className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="top-label-en" className="text-xs">
                    Label (English)
                  </Label>
                  <Input
                    id="top-label-en"
                    value={formData.highlight_top_label_en}
                    onChange={(e) =>
                      handleFieldChange(
                        "highlight_top_label_en",
                        e.target.value,
                      )
                    }
                    placeholder="Enter top label in English"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="top-description-en" className="text-xs">
                    Description (English)
                  </Label>
                  <Textarea
                    id="top-description-en"
                    value={formData.highlight_top_description_en}
                    onChange={(e) =>
                      handleFieldChange(
                        "highlight_top_description_en",
                        e.target.value,
                      )
                    }
                    placeholder="Enter top description in English"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </TabsContent>
              <TabsContent value="id" className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="top-label-id" className="text-xs">
                    Label (Indonesian)
                  </Label>
                  <Input
                    id="top-label-id"
                    value={formData.highlight_top_label_id}
                    onChange={(e) =>
                      handleFieldChange(
                        "highlight_top_label_id",
                        e.target.value,
                      )
                    }
                    placeholder="Masukkan label atas dalam Bahasa Indonesia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="top-description-id" className="text-xs">
                    Description (Indonesian)
                  </Label>
                  <Textarea
                    id="top-description-id"
                    value={formData.highlight_top_description_id}
                    onChange={(e) =>
                      handleFieldChange(
                        "highlight_top_description_id",
                        e.target.value,
                      )
                    }
                    placeholder="Masukkan deskripsi atas dalam Bahasa Indonesia"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Separator />

          {/* Bottom Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Bottom Section</Label>
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="en">EN</TabsTrigger>
                <TabsTrigger value="id">ID</TabsTrigger>
              </TabsList>
              <TabsContent value="en" className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="bottom-label-en" className="text-xs">
                    Label (English)
                  </Label>
                  <Input
                    id="bottom-label-en"
                    value={formData.highlight_bottom_label_en}
                    onChange={(e) =>
                      handleFieldChange(
                        "highlight_bottom_label_en",
                        e.target.value,
                      )
                    }
                    placeholder="Enter bottom label in English"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bottom-description-en" className="text-xs">
                    Description (English)
                  </Label>
                  <Textarea
                    id="bottom-description-en"
                    value={formData.highlight_bottom_description_en}
                    onChange={(e) =>
                      handleFieldChange(
                        "highlight_bottom_description_en",
                        e.target.value,
                      )
                    }
                    placeholder="Enter bottom description in English"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </TabsContent>
              <TabsContent value="id" className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="bottom-label-id" className="text-xs">
                    Label (Indonesian)
                  </Label>
                  <Input
                    id="bottom-label-id"
                    value={formData.highlight_bottom_label_id}
                    onChange={(e) =>
                      handleFieldChange(
                        "highlight_bottom_label_id",
                        e.target.value,
                      )
                    }
                    placeholder="Masukkan label bawah dalam Bahasa Indonesia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bottom-description-id" className="text-xs">
                    Description (Indonesian)
                  </Label>
                  <Textarea
                    id="bottom-description-id"
                    value={formData.highlight_bottom_description_id}
                    onChange={(e) =>
                      handleFieldChange(
                        "highlight_bottom_description_id",
                        e.target.value,
                      )
                    }
                    placeholder="Masukkan deskripsi bawah dalam Bahasa Indonesia"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
