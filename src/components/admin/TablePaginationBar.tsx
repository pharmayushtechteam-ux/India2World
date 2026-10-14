import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TablePaginationBarProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  itemLabel?: string;
  pageSizeOptions?: number[];
}

export const TablePaginationBar: React.FC<TablePaginationBarProps> = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'records',
  pageSizeOptions = [5, 6, 8],
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = totalItems === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, activePage * pageSize);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="font-bold text-slate-700">{startIndex}</span> to{' '}
          <span className="font-bold text-slate-700">{endIndex}</span> of{' '}
          <span className="font-bold text-[#0066FF]">{totalItems}</span> {itemLabel}
        </span>
        <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
          <span className="text-slate-400">Rows per page:</span>
          {pageSizeOptions.map((size) => (
            <button
              key={size}
              onClick={() => {
                onPageSizeChange(size);
                onPageChange(1);
              }}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                pageSize === size
                  ? 'bg-[#0066FF] text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-500 mr-2">
          Page <span className="font-bold text-slate-800">{activePage}</span> of{' '}
          <span className="font-bold text-slate-800">{totalPages}</span>
        </span>
        <button
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activePage === page
                ? 'bg-[#0066FF] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
