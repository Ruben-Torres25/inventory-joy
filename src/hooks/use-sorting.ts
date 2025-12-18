import { useState, useCallback } from "react";

export type SortOrder = "asc" | "desc" | null;

export interface SortConfig {
  sortBy: string | null;
  sortOrder: SortOrder;
}

export function useSorting(initialSortBy: string | null = null, initialSortOrder: SortOrder = null) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    sortBy: initialSortBy,
    sortOrder: initialSortOrder,
  });

  const handleSort = useCallback((field: string) => {
    setSortConfig((prev) => {
      if (prev.sortBy !== field) {
        return { sortBy: field, sortOrder: "asc" };
      }
      if (prev.sortOrder === "asc") {
        return { sortBy: field, sortOrder: "desc" };
      }
      if (prev.sortOrder === "desc") {
        return { sortBy: null, sortOrder: null };
      }
      return { sortBy: field, sortOrder: "asc" };
    });
  }, []);

  const resetSort = useCallback(() => {
    setSortConfig({ sortBy: null, sortOrder: null });
  }, []);

  return {
    sortBy: sortConfig.sortBy,
    sortOrder: sortConfig.sortOrder,
    handleSort,
    resetSort,
  };
}
