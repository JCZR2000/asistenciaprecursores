import { useState, useMemo, useEffect } from 'react';

export type SortOrder = 'asc' | 'desc';

export interface UseTableControlsOptions<T> {
  data: T[];
  storageKey?: string;
  initialSortField?: string;
  initialSortOrder?: SortOrder;
  filterFn?: (item: T, search: string, filters: Record<string, any>) => boolean;
  sortFn?: (a: T, b: T, field: string, order: SortOrder) => number;
}

export function useTableControls<T>({
  data,
  storageKey,
  initialSortField = '',
  initialSortOrder = 'asc',
  filterFn,
  sortFn,
}: UseTableControlsOptions<T>) {
  // Load initial preferences from localStorage if storageKey is given
  const [search, setSearch] = useState<string>('');
  const [sortField, setSortField] = useState<string>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`table_sort_${storageKey}`);
      if (saved) return saved;
    }
    return initialSortField;
  });

  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`table_order_${storageKey}`) as SortOrder;
      if (saved === 'asc' || saved === 'desc') return saved;
    }
    return initialSortOrder;
  });

  const [filters, setFilters] = useState<Record<string, any>>({});

  // Persist preferences
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`table_sort_${storageKey}`, sortField);
      localStorage.setItem(`table_order_${storageKey}`, sortOrder);
    }
  }, [storageKey, sortField, sortOrder]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const setFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({});
  };

  // Filtered and sorted rows
  const processedData = useMemo(() => {
    let result = [...data];

    // Filter
    if (filterFn) {
      result = result.filter((item) => filterFn(item, search, filters));
    }

    // Sort
    if (sortField && sortFn) {
      result.sort((a, b) => sortFn(a, b, sortField, sortOrder));
    }

    return result;
  }, [data, search, filters, sortField, sortOrder, filterFn, sortFn]);

  return {
    search,
    setSearch,
    sortField,
    sortOrder,
    toggleSort,
    setSortField,
    setSortOrder,
    filters,
    setFilter,
    clearFilters,
    processedData,
    totalCount: data.length,
    filteredCount: processedData.length,
  };
}
