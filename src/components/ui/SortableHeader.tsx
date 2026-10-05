import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSortField: string;
  currentSortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  field,
  currentSortField,
  currentSortOrder,
  onSort,
  className = '',
  align = 'left',
}) => {
  const isActive = currentSortField === field;

  return (
    <th
      onClick={() => onSort(field)}
      className={`p-3.5 cursor-pointer select-none transition-colors hover:text-foreground group ${
        isActive ? 'text-primary font-bold' : ''
      } ${className}`}
    >
      <div
        className={`flex items-center gap-1.5 ${
          align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
        }`}
      >
        <span>{label}</span>
        <span className="inline-flex items-center text-muted-foreground group-hover:text-foreground">
          {isActive ? (
            currentSortOrder === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-primary" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-primary" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-75" />
          )}
        </span>
      </div>
    </th>
  );
};
