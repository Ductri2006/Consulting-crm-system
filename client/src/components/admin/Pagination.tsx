import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  page: number
  totalPages: number
  totalItems?: number
  isDisabled?: boolean
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  isDisabled = false,
  onPageChange,
}: PaginationProps) {
  const displayTotalPages = Math.max(1, totalPages)
  const previousDisabled = isDisabled || page <= 1
  const nextDisabled = isDisabled || totalPages === 0 || page >= totalPages

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-slate-500">
        {typeof totalItems === 'number'
          ? `${totalItems.toLocaleString()} total result${totalItems === 1 ? '' : 's'}`
          : `Page ${page} of ${displayTotalPages}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={previousDisabled}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </button>
        <span
          aria-current="page"
          className="min-w-24 text-center text-sm font-semibold text-slate-700"
        >
          {page} / {displayTotalPages}
        </span>
        <button
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={nextDisabled}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
