import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Table Component
 * Consistent data tables across the application
 */
const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  onRowClick,
  className = '',
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-secondary">
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-outline-variant">
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-4 py-3 text-left text-sm font-semibold text-secondary ${
                  column.className || ''
                }`}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={`border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-4 py-3 text-sm text-on-surface ${
                    column.cellClassName || ''
                  }`}
                >
                  {column.render
                    ? column.render(row[column.accessor], row, rowIndex)
                    : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Table Pagination Component
 */
export const TablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant">
      <p className="text-sm text-secondary">
        Affichage {startItem}-{endItem} sur {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm text-on-surface">
          Page {currentPage} sur {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Table;
