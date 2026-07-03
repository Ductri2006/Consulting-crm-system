import {
  AlertCircle,
  Eye,
  Inbox,
  LoaderCircle,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  DataTable,
  EmptyState,
  Modal,
  Pagination,
  SearchInput,
  type DataTableColumn,
} from '../../components/admin'
import {
  getConsultationRequest,
  getConsultationRequests,
  updateConsultationRequestStatus,
} from '../../features/consultationRequests/consultationRequests.api'
import {
  consultationRequestStatuses,
  editableConsultationRequestStatuses,
  type ConsultationRequest,
  type ConsultationRequestStatus,
  type EditableConsultationRequestStatus,
  type PaginationMeta,
} from '../../features/consultationRequests/consultationRequests.types'
import { cn } from '../../utils/cn'

const PAGE_SIZE = 10

const statusStyles: Record<ConsultationRequestStatus, string> = {
  NEW: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  CONTACTED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  CONVERTED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CLOSED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

function formatStatus(status: ConsultationRequestStatus): string {
  return `${status.charAt(0)}${status.slice(1).toLowerCase()}`
}

function formatDate(value: string, includeTime = false): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

function StatusBadge({ status }: { status: ConsultationRequestStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        statusStyles[status],
      )}
    >
      {formatStatus(status)}
    </span>
  )
}

function DetailItem({
  label,
  children,
  wide = false,
}: {
  label: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={cn('min-w-0', wide && 'sm:col-span-2')}>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm leading-6 text-slate-800">
        {children}
      </dd>
    </div>
  )
}

interface RequestDetailModalProps {
  isOpen: boolean
  request: ConsultationRequest | null
  isLoading: boolean
  isUpdating: boolean
  error: string | null
  onClose: () => void
  onRetry: () => void
  onUpdateStatus: (status: EditableConsultationRequestStatus) => Promise<void>
}

function RequestDetailModal({
  isOpen,
  request,
  isLoading,
  isUpdating,
  error,
  onClose,
  onRetry,
  onUpdateStatus,
}: RequestDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<
    EditableConsultationRequestStatus | ''
  >('')

  useEffect(() => {
    if (
      request &&
      editableConsultationRequestStatuses.some(
        (status) => status === request.status,
      )
    ) {
      setSelectedStatus(request.status as EditableConsultationRequestStatus)
      return
    }

    setSelectedStatus('')
  }, [request])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (selectedStatus) {
      void onUpdateStatus(selectedStatus)
    }
  }

  return (
    <Modal
      description="Review the enquiry and keep its follow-up status current."
      isDismissible={!isUpdating}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={request?.fullName ?? 'Consultation request'}
    >
      <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6">
          {isLoading ? (
            <div className="grid min-h-64 place-items-center">
              <div className="text-center text-sm font-semibold text-slate-500">
                <LoaderCircle className="mx-auto mb-3 h-7 w-7 animate-spin text-blue-600" />
                Loading request details…
              </div>
            </div>
          ) : error && !request ? (
            <div
              className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center"
              role="alert"
            >
              <AlertCircle className="mx-auto h-7 w-7 text-rose-600" />
              <p className="mt-3 text-sm text-rose-800">{error}</p>
              <button
                className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-bold text-rose-700 shadow-sm ring-1 ring-rose-200"
                onClick={onRetry}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : request ? (
            <>
              {error ? (
                <div
                  className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <DetailItem label="Full name">{request.fullName}</DetailItem>
                <DetailItem label="Status">
                  <StatusBadge status={request.status} />
                </DetailItem>
                <DetailItem label="Phone">{request.phone}</DetailItem>
                <DetailItem label="Email">
                  {request.email ?? <span className="text-slate-400">Not provided</span>}
                </DetailItem>
                <DetailItem label="Service">
                  {request.service?.name ?? (
                    <span className="text-slate-400">Not selected</span>
                  )}
                </DetailItem>
                <DetailItem label="Submitted">
                  <time dateTime={request.createdAt}>
                    {formatDate(request.createdAt, true)}
                  </time>
                </DetailItem>
                <DetailItem label="Message" wide>
                  {request.message ?? (
                    <span className="text-slate-400">No message provided</span>
                  )}
                </DetailItem>
                {request.convertedAt ? (
                  <DetailItem label="Converted at">
                    <time dateTime={request.convertedAt}>
                      {formatDate(request.convertedAt, true)}
                    </time>
                  </DetailItem>
                ) : null}
                {request.convertedCustomerId ? (
                  <DetailItem label="Converted customer ID">
                    <span className="font-mono text-xs">
                      {request.convertedCustomerId}
                    </span>
                  </DetailItem>
                ) : null}
                {request.convertedCaseProfileId ? (
                  <DetailItem label="Converted case ID" wide>
                    <span className="font-mono text-xs">
                      {request.convertedCaseProfileId}
                    </span>
                  </DetailItem>
                ) : null}
              </dl>

              <form
                className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4"
                onSubmit={handleSubmit}
              >
                <label
                  className="text-sm font-bold text-slate-800"
                  htmlFor="consultation-request-status"
                >
                  Update status
                </label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <select
                    className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    disabled={isUpdating}
                    id="consultation-request-status"
                    onChange={(event) =>
                      setSelectedStatus(
                        event.target.value as EditableConsultationRequestStatus | '',
                      )
                    }
                    value={selectedStatus}
                  >
                    {selectedStatus === '' ? (
                      <option value="">Select a new status</option>
                    ) : null}
                    {editableConsultationRequestStatuses.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={
                      isUpdating ||
                      !selectedStatus ||
                      selectedStatus === request.status
                    }
                    type="submit"
                  >
                    {isUpdating ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : null}
                    Save status
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Conversion is handled by a separate workflow and cannot be
                  selected here.
                </p>
              </form>
            </>
          ) : null}
      </div>
    </Modal>
  )
}

export function AdminConsultationRequestsPage() {
  const [requests, setRequests] = useState<ConsultationRequest[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  })
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<ConsultationRequestStatus | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailRequest, setDetailRequest] =
    useState<ConsultationRequest | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const listRequestSequence = useRef(0)
  const detailRequestSequence = useRef(0)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1)
      setDebouncedSearch(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    if (!notice) {
      return
    }

    const timeoutId = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [notice])

  const loadRequests = useCallback(async () => {
    const sequence = ++listRequestSequence.current
    setIsLoading(true)
    setError(null)

    try {
      const result = await getConsultationRequests({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: status || undefined,
      })

      if (sequence === listRequestSequence.current) {
        const validPage = Math.max(1, result.meta.totalPages)

        if (page > validPage) {
          setPage(validPage)
          return
        }

        setRequests(result.items)
        setMeta(result.meta)
      }
    } catch (requestError) {
      if (sequence === listRequestSequence.current) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load consultation requests.',
        )
      }
    } finally {
      if (sequence === listRequestSequence.current) {
        setIsLoading(false)
      }
    }
  }, [debouncedSearch, page, status])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  const loadDetail = useCallback(async (id: string) => {
    const sequence = ++detailRequestSequence.current
    setIsDetailLoading(true)
    setDetailError(null)

    try {
      const request = await getConsultationRequest(id)

      if (sequence === detailRequestSequence.current) {
        setDetailRequest(request)
      }
    } catch (requestError) {
      if (sequence === detailRequestSequence.current) {
        setDetailError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load this consultation request.',
        )
      }
    } finally {
      if (sequence === detailRequestSequence.current) {
        setIsDetailLoading(false)
      }
    }
  }, [])

  const openDetail = (id: string) => {
    setDetailId(id)
    setDetailRequest(null)
    setDetailError(null)
    void loadDetail(id)
  }

  const closeDetail = useCallback(() => {
    detailRequestSequence.current += 1
    setDetailId(null)
    setDetailRequest(null)
    setDetailError(null)
  }, [])

  const handleStatusUpdate = async (
    nextStatus: EditableConsultationRequestStatus,
  ) => {
    if (!detailRequest) {
      return
    }

    setIsUpdating(true)
    setDetailError(null)

    try {
      const updatedRequest = await updateConsultationRequestStatus(
        detailRequest.id,
        { status: nextStatus },
      )
      setDetailRequest(updatedRequest)
      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === updatedRequest.id ? updatedRequest : request,
        ),
      )
      setNotice(`Status updated to ${formatStatus(updatedRequest.status)}.`)
      void loadRequests()
    } catch (requestError) {
      setDetailError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to update the request status.',
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const tableColumns: readonly DataTableColumn<ConsultationRequest>[] = [
    {
      key: 'fullName',
      header: 'Full name',
      render: (request) => (
        <span className="font-semibold text-slate-900">{request.fullName}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (request) => request.phone,
    },
    {
      key: 'email',
      header: 'Email',
      className: 'max-w-52 truncate',
      render: (request) => request.email ?? '—',
    },
    {
      key: 'service',
      header: 'Service',
      className: 'max-w-52 truncate',
      render: (request) => request.service?.name ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (request) => <StatusBadge status={request.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (request) => (
        <time dateTime={request.createdAt}>{formatDate(request.createdAt)}</time>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (request) => (
        <button
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
          onClick={() => openDetail(request.id)}
          type="button"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          View / Update
        </button>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">Inbox</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Consultation Requests
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Review incoming enquiries and keep their follow-up status current.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-60 sm:self-auto"
          disabled={isLoading}
          onClick={() => void loadRequests()}
          type="button"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {notice ? (
        <div
          className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:p-5">
          <SearchInput
            isDisabled={isLoading}
            label="Search consultation requests"
            onChange={setSearchInput}
            onSubmit={() => {
              setPage(1)
              setDebouncedSearch(searchInput.trim())
            }}
            placeholder="Search name, phone, email or message…"
            value={searchInput}
          />
          <label className="relative sm:w-56">
            <span className="sr-only">Filter by status</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              onChange={(event) => {
                setPage(1)
                setStatus(event.target.value as ConsultationRequestStatus | '')
              }}
              value={status}
            >
              <option value="">All statuses</option>
              {consultationRequestStatuses.map((requestStatus) => (
                <option key={requestStatus} value={requestStatus}>
                  {formatStatus(requestStatus)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && requests.length === 0 ? (
          <div className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
                <AlertCircle className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-bold text-slate-900">
                Couldn&apos;t load consultation requests
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {error}
              </p>
              <button
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                onClick={() => void loadRequests()}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        ) : isLoading && requests.length === 0 ? (
          <div className="grid min-h-80 place-items-center p-8">
            <div className="text-center text-sm font-semibold text-slate-500">
              <LoaderCircle className="mx-auto mb-3 h-7 w-7 animate-spin text-blue-600" />
              Loading consultation requests…
            </div>
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            description="Try changing the search or status filter."
            icon={<Inbox className="h-6 w-6" aria-hidden="true" />}
            title="No consultation requests found"
          />
        ) : (
          <>
            {error ? (
              <div
                className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800"
                role="alert"
              >
                <span>Refresh failed: {error}. Showing the latest data.</span>
                <button
                  className="shrink-0 font-bold underline"
                  onClick={() => void loadRequests()}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : null}
            <DataTable
              caption="Consultation requests"
              columns={tableColumns}
              getRowKey={(request) => request.id}
              items={requests}
            />
            <Pagination
              isDisabled={isLoading}
              onPageChange={setPage}
              page={meta.page}
              totalItems={meta.total}
              totalPages={meta.totalPages}
            />
          </>
        )}
      </section>

      <RequestDetailModal
        error={detailError}
        isLoading={isDetailLoading}
        isOpen={detailId !== null}
        isUpdating={isUpdating}
        onClose={closeDetail}
        onRetry={() => {
          if (detailId) {
            void loadDetail(detailId)
          }
        }}
        onUpdateStatus={handleStatusUpdate}
        request={detailRequest}
      />
    </div>
  )
}
