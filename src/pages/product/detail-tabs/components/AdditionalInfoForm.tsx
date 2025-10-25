import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components";
import { CheckCircle, FileText, Plus, X } from "lucide-react";
import { Product, ProductWithRelations } from "../../types";
import FileSelectorDialog from "@/components/FileSelectorDialog/FileSelectorDialog";

interface AdditionalInfoFormProps {
  product: Product;
  onProductChange: (updates: Partial<Product>) => void;
}

export default function AdditionalInfoForm({
  product,
  onProductChange,
}: AdditionalInfoFormProps) {
  // Parse suitables
  const getSuitableItems = () => {
    if (!product?.suitables) return [];

    let suitableItems = [];
    try {
      if (typeof product.suitables === "string") {
        suitableItems = JSON.parse(product.suitables);
      } else if (Array.isArray(product.suitables)) {
        suitableItems = product.suitables;
      } else {
        suitableItems = [String(product.suitables)];
      }
    } catch {
      suitableItems = [String((product as ProductWithRelations).suitables)];
    }

    if (!Array.isArray(suitableItems)) {
      suitableItems = [String(suitableItems)];
    }

    return suitableItems;
  };

  const [suitables, setSuitables] = useState<string[]>(getSuitableItems());
  const [newSuitable, setNewSuitable] = useState("");
  const [catalogueUrl, setCatalogueUrl] = useState(product?.catalogue || "");
  const [catalogueDialogOpen, setCatalogueDialogOpen] = useState(false);

  const handleAddSuitable = () => {
    if (newSuitable.trim()) {
      const updatedSuitables = [...suitables, newSuitable.trim()];
      setSuitables(updatedSuitables);
      onProductChange({ suitables: JSON.stringify(updatedSuitables) });
      setNewSuitable("");
    }
  };

  const handleRemoveSuitable = (index: number) => {
    const updatedSuitables = suitables.filter((_, i) => i !== index);
    setSuitables(updatedSuitables);
    onProductChange({ suitables: JSON.stringify(updatedSuitables) });
  };

  const handleCatalogueChange = (value: string) => {
    setCatalogueUrl(value);
    onProductChange({ catalogue: value });
  };

  const handleCatalogueSelect = (fileUrl: string) => {
    setCatalogueUrl(fileUrl);
    onProductChange({ catalogue: fileUrl });
    setCatalogueDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Suitables */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Suitable For</Label>
        <div className="flex flex-wrap gap-2">
          {suitables.map((suitable, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1.5 group"
            >
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <span>{suitable}</span>
              <button
                onClick={() => handleRemoveSuitable(index)}
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newSuitable}
            onChange={(e) => setNewSuitable(e.target.value)}
            placeholder="Add suitable item"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSuitable();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSuitable}
            disabled={!newSuitable.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Catalogue */}
      <div className="space-y-3">
        <Label htmlFor="catalogue" className="text-sm font-medium">
          Catalogue URL
        </Label>
        <Input
          id="catalogue"
          value={catalogueUrl}
          onChange={(e) => handleCatalogueChange(e.target.value)}
          placeholder="Enter catalogue URL or select file"
          type="url"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCatalogueDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Select File
          </Button>
          {catalogueUrl && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex items-center gap-2"
            >
              <a href={catalogueUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                View Catalogue
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* File Selector Dialog */}
      <FileSelectorDialog
        open={catalogueDialogOpen}
        onOpenChange={setCatalogueDialogOpen}
        onSelect={handleCatalogueSelect}
        title="Select Catalogue File"
        acceptedFileTypes=".pdf,.doc,.docx"
        maxFileSize={10}
        multiple={false}
        multipleSelection={false}
        initialSelection={catalogueUrl}
      />
    </div>
  );
}
