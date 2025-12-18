import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

export interface ProductFilters {
  priceMin?: number;
  priceMax?: number;
  stockMin?: number;
  stockMax?: number;
  lowStockOnly: boolean;
  zeroStockOnly: boolean;
}

interface ProductAdvancedFiltersProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
}

const defaultFilters: ProductFilters = {
  priceMin: undefined,
  priceMax: undefined,
  stockMin: undefined,
  stockMax: undefined,
  lowStockOnly: false,
  zeroStockOnly: false,
};

export function ProductAdvancedFilters({
  filters,
  onChange,
}: ProductAdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const activeFilterCount = [
    filters.priceMin !== undefined,
    filters.priceMax !== undefined,
    filters.stockMin !== undefined,
    filters.stockMax !== undefined,
    filters.lowStockOnly,
    filters.zeroStockOnly,
  ].filter(Boolean).length;

  const handleChange = (key: keyof ProductFilters, value: number | boolean | undefined) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  const handleClearAll = () => {
    setLocalFilters(defaultFilters);
    onChange(defaultFilters);
  };

  const parseNumber = (value: string): number | undefined => {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filtros avanzados</h4>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 text-muted-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Price range */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Precio mínimo</Label>
              <Input
                type="number"
                placeholder="0"
                value={localFilters.priceMin ?? ""}
                onChange={(e) => handleChange("priceMin", parseNumber(e.target.value))}
                min={0}
                step={0.01}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Precio máximo</Label>
              <Input
                type="number"
                placeholder="Sin límite"
                value={localFilters.priceMax ?? ""}
                onChange={(e) => handleChange("priceMax", parseNumber(e.target.value))}
                min={0}
                step={0.01}
              />
            </div>

            {/* Stock range */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Stock mínimo</Label>
              <Input
                type="number"
                placeholder="0"
                value={localFilters.stockMin ?? ""}
                onChange={(e) => handleChange("stockMin", parseNumber(e.target.value))}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Stock máximo</Label>
              <Input
                type="number"
                placeholder="Sin límite"
                value={localFilters.stockMax ?? ""}
                onChange={(e) => handleChange("stockMax", parseNumber(e.target.value))}
                min={0}
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lowStock"
                checked={localFilters.lowStockOnly}
                onCheckedChange={(checked) =>
                  handleChange("lowStockOnly", checked === true)
                }
              />
              <Label htmlFor="lowStock" className="text-sm cursor-pointer">
                Solo productos con stock bajo
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="zeroStock"
                checked={localFilters.zeroStockOnly}
                onCheckedChange={(checked) =>
                  handleChange("zeroStockOnly", checked === true)
                }
              />
              <Label htmlFor="zeroStock" className="text-sm cursor-pointer">
                Solo productos sin stock
              </Label>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { defaultFilters as defaultProductFilters };
