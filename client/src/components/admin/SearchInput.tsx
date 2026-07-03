import { Search, X } from 'lucide-react'
import { useId } from 'react'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  label?: string
  isDisabled?: boolean
}

export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search',
  label = 'Search',
  isDisabled = false,
}: SearchInputProps) {
  const inputId = useId()

  return (
    <form
      className="relative w-full sm:max-w-sm"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      role="search"
    >
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      />
      <input
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-20 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        disabled={isDisabled}
        id={inputId}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {value ? (
          <button
            aria-label="Clear search"
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={() => {
              onChange('')
            }}
            type="button"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
        <button
          className="rounded-md bg-slate-900 px-2 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
          disabled={isDisabled}
          type="submit"
        >
          Search
        </button>
      </div>
    </form>
  )
}
