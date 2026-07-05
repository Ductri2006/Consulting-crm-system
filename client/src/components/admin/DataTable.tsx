import type { Key, ReactNode } from 'react'
import { cn } from '../../utils/cn'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
  headerClassName?: string
}

export interface DataTableProps<T> {
  columns: readonly DataTableColumn<T>[]
  items: readonly T[]
  getRowKey: (item: T) => Key
  caption: string
}

export function DataTable<T>({
  columns,
  items,
  getRowKey,
  caption,
}: DataTableProps<T>) {
  return (
    <div className="max-w-full overflow-x-auto overscroll-x-contain">
      <table className="min-w-full table-auto divide-y divide-slate-200">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50/80">
          <tr>
            {columns.map((column) => (
              <th
                className={cn(
                  'whitespace-nowrap px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500',
                  column.headerClassName,
                )}
                key={column.key}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((item) => (
            <tr
              className="transition-colors hover:bg-slate-50/80"
              key={getRowKey(item)}
            >
              {columns.map((column) => (
                <td
                  className={cn(
                    'px-5 py-4 align-top text-sm text-slate-600 [overflow-wrap:anywhere]',
                    column.className,
                  )}
                  key={column.key}
                >
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
