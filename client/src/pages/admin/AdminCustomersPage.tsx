import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  KeyRound,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  ConfirmDialog,
  DataTable,
  EmptyState,
  LoadingState,
  Modal,
  Pagination,
  SearchInput,
  type DataTableColumn,
} from '../../components/admin'
import { useAuth } from '../../features/auth'
import {
  activateCustomerPortalAccount,
  createCustomer,
  createCustomerPortalAccount,
  deleteCustomer,
  deactivateCustomerPortalAccount,
  getCustomer,
  getCustomerPortalAccount,
  listCustomers,
  resetCustomerPortalPassword,
  updateCustomer,
} from '../../features/customers/customers.api'
import type {
  Customer,
  CustomerDetail,
  CustomerMutationInput,
  CustomerPortalAccount,
  PaginationMeta,
} from '../../features/customers/customers.types'
import {
  customerFormSchema,
  type CustomerFormValues,
} from '../../features/customers/customers.validation'
import { ApiError } from '../../lib/apiClient'

const PAGE_SIZE = 10

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

const EMPTY_FORM: CustomerFormValues = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  identityNumber: '',
  birthday: '',
  source: '',
  note: '',
}

interface Feedback {
  type: 'success' | 'error'
  message: string
}

interface CustomerFormProps {
  customer: CustomerDetail | null
  error: string | null
  onCancel: () => void
  onSubmit: (values: CustomerFormValues) => Promise<void>
}

const formatDate = (value: string): string => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return 'Not yet'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

const copyText = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.append(textarea)
  textarea.select()

  try {
    if (!document.execCommand('copy')) {
      throw new Error('Copy failed.')
    }
  } finally {
    textarea.remove()
  }
}

const getFormValues = (
  customer: CustomerDetail | null,
): CustomerFormValues =>
  customer
    ? {
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email ?? '',
        address: customer.address ?? '',
        identityNumber: customer.identityNumber ?? '',
        birthday: customer.birthday?.slice(0, 10) ?? '',
        source: customer.source ?? '',
        note: customer.note ?? '',
      }
    : EMPTY_FORM

const optionalValue = (value: string): string | undefined => {
  const normalized = value.trim()
  return normalized || undefined
}

const toMutationInput = (
  values: CustomerFormValues,
): CustomerMutationInput => ({
  fullName: values.fullName.trim(),
  phone: values.phone.trim(),
  email: optionalValue(values.email),
  address: optionalValue(values.address),
  identityNumber: optionalValue(values.identityNumber),
  birthday: optionalValue(values.birthday),
  source: optionalValue(values.source),
  note: optionalValue(values.note),
})

function FieldError({
  id,
  message,
}: {
  id: string
  message?: string
}) {
  return message ? (
    <p className="field-error" id={id}>
      {message}
    </p>
  ) : null
}

function CustomerForm({
  customer,
  error,
  onCancel,
  onSubmit,
}: CustomerFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: getFormValues(customer),
  })

  useEffect(() => {
    reset(getFormValues(customer))
  }, [customer, reset])

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="max-h-[calc(100vh-13rem)] overflow-y-auto p-5 sm:p-6">
        {customer ? (
          <section
            aria-label="Related records"
            className="mb-6 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500">Cases</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {customer.relatedCounts.cases}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Appointments
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {customer.relatedCounts.appointments}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Documents</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {customer.relatedCounts.documents}
              </p>
            </div>
          </section>
        ) : null}

        {error ? (
          <div
            className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="customer-full-name">
              Full name <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={
                errors.fullName ? 'customer-full-name-error' : undefined
              }
              aria-invalid={Boolean(errors.fullName)}
              className="field-input"
              id="customer-full-name"
              {...register('fullName')}
            />
            <FieldError
              id="customer-full-name-error"
              message={errors.fullName?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="customer-phone">
              Phone <span aria-hidden="true">*</span>
            </label>
            <input
              aria-describedby={
                errors.phone ? 'customer-phone-error' : undefined
              }
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
              className="field-input"
              id="customer-phone"
              type="tel"
              {...register('phone')}
            />
            <FieldError
              id="customer-phone-error"
              message={errors.phone?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="customer-email">
              Email
            </label>
            <input
              aria-describedby={
                errors.email ? 'customer-email-error' : undefined
              }
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              className="field-input"
              id="customer-email"
              type="email"
              {...register('email')}
            />
            <FieldError
              id="customer-email-error"
              message={errors.email?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="customer-birthday">
              Birthday
            </label>
            <input
              aria-describedby={
                errors.birthday ? 'customer-birthday-error' : undefined
              }
              aria-invalid={Boolean(errors.birthday)}
              className="field-input"
              id="customer-birthday"
              type="date"
              {...register('birthday')}
            />
            <FieldError
              id="customer-birthday-error"
              message={errors.birthday?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="customer-identity">
              Identity number
            </label>
            <input
              aria-describedby={
                errors.identityNumber ? 'customer-identity-error' : undefined
              }
              aria-invalid={Boolean(errors.identityNumber)}
              className="field-input"
              id="customer-identity"
              {...register('identityNumber')}
            />
            <FieldError
              id="customer-identity-error"
              message={errors.identityNumber?.message}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="customer-source">
              Source
            </label>
            <input
              aria-describedby={
                errors.source ? 'customer-source-error' : undefined
              }
              aria-invalid={Boolean(errors.source)}
              className="field-input"
              id="customer-source"
              placeholder="Referral, website, event…"
              {...register('source')}
            />
            <FieldError
              id="customer-source-error"
              message={errors.source?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="customer-address">
              Address
            </label>
            <textarea
              aria-describedby={
                errors.address ? 'customer-address-error' : undefined
              }
              aria-invalid={Boolean(errors.address)}
              className="field-input min-h-20 resize-y"
              id="customer-address"
              rows={2}
              {...register('address')}
            />
            <FieldError
              id="customer-address-error"
              message={errors.address?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="customer-note">
              Note
            </label>
            <textarea
              aria-describedby={
                errors.note ? 'customer-note-error' : undefined
              }
              aria-invalid={Boolean(errors.note)}
              className="field-input min-h-28 resize-y"
              id="customer-note"
              rows={4}
              {...register('note')}
            />
            <FieldError
              id="customer-note-error"
              message={errors.note?.message}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? 'Saving…'
            : customer
              ? 'Save changes'
              : 'Create customer'}
        </button>
      </div>
    </form>
  )
}

function PortalAccessDialog({
  customer,
  onClose,
  onFeedback,
}: {
  customer: Customer | null
  onClose: () => void
  onFeedback: (feedback: Feedback) => void
}) {
  const [account, setAccount] = useState<CustomerPortalAccount | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [action, setAction] = useState<
    'create' | 'reset' | 'activate' | 'deactivate' | null
  >(null)

  const loadPortalAccount = useCallback(async () => {
    if (!customer) {
      return
    }

    setIsLoading(true)
    setError(null)
    setTemporaryPassword(null)
    setCopyMessage(null)

    try {
      const loadedAccount = await getCustomerPortalAccount(customer.id)
      setAccount(loadedAccount)
      setEmail(loadedAccount?.email ?? customer.email ?? '')
      setPassword('')
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          'Customer portal account could not be loaded.',
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }, [customer])

  useEffect(() => {
    if (customer) {
      void loadPortalAccount()
      return
    }

    setAccount(null)
    setEmail('')
    setPassword('')
    setTemporaryPassword(null)
    setCopyMessage(null)
    setError(null)
  }, [customer, loadPortalAccount])

  const handleClose = () => {
    if (!action) {
      onClose()
    }
  }

  const handleCreate = async () => {
    if (!customer) {
      return
    }

    setAction('create')
    setError(null)
    setTemporaryPassword(null)
    setCopyMessage(null)

    try {
      const result = await createCustomerPortalAccount(customer.id, {
        email: optionalValue(email),
        password: optionalValue(password),
      })
      setAccount(result.account)
      setEmail(result.account.email)
      setPassword('')
      setTemporaryPassword(result.temporaryPassword ?? null)
      onFeedback({
        type: 'success',
        message: `Portal access created for ${customer.fullName}.`,
      })
    } catch (createError) {
      setError(
        getErrorMessage(
          createError,
          'Customer portal account could not be created.',
        ),
      )
    } finally {
      setAction(null)
    }
  }

  const handleResetPassword = async () => {
    if (!customer) {
      return
    }

    setAction('reset')
    setError(null)
    setTemporaryPassword(null)
    setCopyMessage(null)

    try {
      const result = await resetCustomerPortalPassword(customer.id, {
        password: optionalValue(password),
      })
      setAccount(result.account)
      setEmail(result.account.email)
      setPassword('')
      setTemporaryPassword(result.temporaryPassword ?? null)
      onFeedback({
        type: 'success',
        message: `Portal password reset for ${customer.fullName}.`,
      })
    } catch (resetError) {
      setError(
        getErrorMessage(
          resetError,
          'Customer portal password could not be reset.',
        ),
      )
    } finally {
      setAction(null)
    }
  }

  const handleSetActive = async (nextIsActive: boolean) => {
    if (!customer) {
      return
    }

    setAction(nextIsActive ? 'activate' : 'deactivate')
    setError(null)
    setTemporaryPassword(null)
    setCopyMessage(null)

    try {
      const updatedAccount = nextIsActive
        ? await activateCustomerPortalAccount(customer.id)
        : await deactivateCustomerPortalAccount(customer.id)

      setAccount(updatedAccount)
      setEmail(updatedAccount.email)
      onFeedback({
        type: 'success',
        message: `Portal access ${nextIsActive ? 'activated' : 'deactivated'} for ${customer.fullName}.`,
      })
    } catch (activeError) {
      setError(
        getErrorMessage(
          activeError,
          'Customer portal account status could not be updated.',
        ),
      )
    } finally {
      setAction(null)
    }
  }

  const handleCopyTemporaryPassword = async () => {
    if (!temporaryPassword) {
      return
    }

    try {
      await copyText(temporaryPassword)
      setCopyMessage('Temporary password copied.')
    } catch (copyError) {
      setCopyMessage(getErrorMessage(copyError, 'Password could not be copied.'))
    }
  }

  const isBusy = Boolean(action) || isLoading

  return (
    <Modal
      description={
        customer
          ? `Manage customer portal access for ${customer.fullName}.`
          : undefined
      }
      isDismissible={!action}
      isOpen={Boolean(customer)}
      onClose={handleClose}
      size="md"
      title="Portal access"
    >
      <div className="max-h-[calc(100vh-13rem)] overflow-y-auto p-5 sm:p-6">
        {isLoading ? (
          <LoadingState label="Loading portal access" />
        ) : (
          <div className="space-y-5">
            {error ? (
              <div
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            {temporaryPassword ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-bold">
                  This password is shown once. Share it securely and ask the
                  customer to change it later.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <code className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-900 ring-1 ring-amber-200">
                    {temporaryPassword}
                  </code>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-800"
                    onClick={() => void handleCopyTemporaryPassword()}
                    type="button"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Copy
                  </button>
                </div>
                {copyMessage ? (
                  <p className="mt-2 text-xs font-semibold">{copyMessage}</p>
                ) : null}
              </div>
            ) : null}

            {account ? (
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Portal login email
                    </p>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900">
                      {account.email}
                    </p>
                  </div>
                  <span
                    className={`inline-flex self-start rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                      account.isActive
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                        : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                    }`}
                  >
                    {account.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-bold text-slate-400">Last login</dt>
                    <dd className="mt-1 font-semibold text-slate-700">
                      {formatDateTime(account.lastLoginAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-400">Created</dt>
                    <dd className="mt-1 font-semibold text-slate-700">
                      {formatDateTime(account.createdAt)}
                    </dd>
                  </div>
                </dl>
              </section>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No portal account exists for this customer yet.
              </div>
            )}

            <div className="grid gap-4">
              {!account ? (
                <div>
                  <label className="field-label" htmlFor="portal-account-email">
                    Login email
                  </label>
                  <input
                    className="field-input"
                    disabled={isBusy}
                    id="portal-account-email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={customer?.email ?? 'customer@example.com'}
                    type="email"
                    value={email}
                  />
                </div>
              ) : null}

              <div>
                <label className="field-label" htmlFor="portal-account-password">
                  {account ? 'New password' : 'Password'}
                </label>
                <input
                  className="field-input"
                  disabled={isBusy}
                  id="portal-account-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Leave blank to generate"
                  type="password"
                  value={password}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          disabled={Boolean(action)}
          onClick={handleClose}
          type="button"
        >
          Close
        </button>
        {account ? (
          <>
            {account.isActive ? (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isBusy}
                onClick={() => void handleSetActive(false)}
                type="button"
              >
                <Power className="h-4 w-4" aria-hidden="true" />
                {action === 'deactivate' ? 'Deactivating...' : 'Deactivate'}
              </button>
            ) : (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isBusy}
                onClick={() => void handleSetActive(true)}
                type="button"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {action === 'activate' ? 'Activating...' : 'Activate'}
              </button>
            )}
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onClick={() => void handleResetPassword()}
              type="button"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {action === 'reset' ? 'Resetting...' : 'Reset password'}
            </button>
          </>
        ) : (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy}
            onClick={() => void handleCreate()}
            type="button"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {action === 'create' ? 'Creating...' : 'Create portal access'}
          </button>
        )}
      </div>
    </Modal>
  )
}

export function AdminCustomersPage() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [customerDetail, setCustomerDetail] =
    useState<CustomerDetail | null>(null)
  const [detailTarget, setDetailTarget] = useState<Customer | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [portalTarget, setPortalTarget] = useState<Customer | null>(null)
  const listRequestSequence = useRef(0)
  const detailRequestSequence = useRef(0)

  const canDelete = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const canManagePortal = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const loadCustomers = useCallback(async () => {
    const requestSequence = ++listRequestSequence.current
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await listCustomers({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
      })

      if (requestSequence !== listRequestSequence.current) {
        return
      }

      setCustomers(result.items)
      setMeta(result.meta)
    } catch (error) {
      if (requestSequence !== listRequestSequence.current) {
        return
      }

      setLoadError(
        error instanceof Error
          ? error.message
          : 'Customers could not be loaded. Please try again.',
      )
    } finally {
      if (requestSequence === listRequestSequence.current) {
        setIsLoading(false)
      }
    }
  }, [page, search])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  const openCreateForm = () => {
    detailRequestSequence.current += 1
    setFormMode('create')
    setCustomerDetail(null)
    setDetailTarget(null)
    setIsDetailLoading(false)
    setFormError(null)
    setIsFormOpen(true)
  }

  const loadCustomerDetail = async (customer: Customer) => {
    const requestSequence = ++detailRequestSequence.current
    setIsDetailLoading(true)
    setFormError(null)

    try {
      const result = await getCustomer(customer.id)

      if (requestSequence === detailRequestSequence.current) {
        setCustomerDetail(result)
      }
    } catch (error) {
      if (requestSequence === detailRequestSequence.current) {
        setFormError(
          error instanceof Error
            ? error.message
            : 'Customer details could not be loaded.',
        )
      }
    } finally {
      if (requestSequence === detailRequestSequence.current) {
        setIsDetailLoading(false)
      }
    }
  }

  const openEditForm = (customer: Customer) => {
    setFormMode('edit')
    setCustomerDetail(null)
    setDetailTarget(customer)
    setFormError(null)
    setIsFormOpen(true)
    void loadCustomerDetail(customer)
  }

  const closeForm = () => {
    detailRequestSequence.current += 1
    setIsFormOpen(false)
    setCustomerDetail(null)
    setDetailTarget(null)
    setIsDetailLoading(false)
    setFormError(null)
  }

  const refreshFromFirstPage = async () => {
    const needsStateChange = page !== 1 || search !== ''
    setPage(1)
    setSearch('')
    setSearchInput('')

    if (!needsStateChange) {
      await loadCustomers()
    }
  }

  const handleSave = async (values: CustomerFormValues) => {
    setFormError(null)

    try {
      if (formMode === 'edit') {
        if (!customerDetail) {
          setFormError('Customer details are not ready. Please try again.')
          return
        }

        await updateCustomer(customerDetail.id, toMutationInput(values))
        closeForm()
        setFeedback({
          type: 'success',
          message: 'Customer updated successfully.',
        })
        await loadCustomers()
        return
      }

      await createCustomer(toMutationInput(values))
      closeForm()
      setFeedback({
        type: 'success',
        message: 'Customer created successfully.',
      })
      await refreshFromFirstPage()
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'The customer could not be saved. Please try again.',
      )
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setIsDeleting(true)
    setFeedback(null)

    try {
      await deleteCustomer(deleteTarget.id)
      setDeleteTarget(null)
      setFeedback({
        type: 'success',
        message: 'Customer deleted successfully.',
      })

      if (customers.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await loadCustomers()
      }
    } catch (error) {
      setDeleteTarget(null)
      setFeedback({
        type: 'error',
        message:
          error instanceof ApiError && error.status === 409
            ? 'This customer cannot be deleted because related records exist.'
            : error instanceof Error
              ? error.message
              : 'The customer could not be deleted. Please try again.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const submitSearch = () => {
    const nextSearch = searchInput.trim()

    if (page === 1 && search === nextSearch) {
      void loadCustomers()
      return
    }

    setPage(1)
    setSearch(nextSearch)
  }

  const columns: DataTableColumn<Customer>[] = [
    {
      key: 'name',
      header: 'Full name',
      className: 'min-w-52',
      render: (customer) => (
        <div>
          <p className="font-semibold text-slate-900">{customer.fullName}</p>
          {customer.identityNumber ? (
            <p className="mt-0.5 text-xs text-slate-400">
              ID: {customer.identityNumber}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (customer) => customer.phone,
    },
    {
      key: 'email',
      header: 'Email',
      className: 'max-w-64',
      render: (customer) => (
        <span className="block truncate">{customer.email ?? '—'}</span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (customer) => customer.source ?? '—',
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (customer) => formatDate(customer.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (customer) => (
        <div className="flex justify-end gap-1">
          <button
            aria-label={`View and edit ${customer.fullName}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
            onClick={() => openEditForm(customer)}
            type="button"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            View / Edit
          </button>
          {canManagePortal ? (
            <button
              aria-label={`Manage portal access for ${customer.fullName}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
              onClick={() => setPortalTarget(customer)}
              type="button"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Portal
            </button>
          ) : null}
          {canDelete ? (
            <button
              aria-label={`Delete ${customer.fullName}`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setDeleteTarget(customer)}
              type="button"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">CRM records</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Customers
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Search, review and maintain customer profiles.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:self-auto"
          onClick={openCreateForm}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Customer
        </button>
      </header>

      {feedback ? (
        <div
          className={`mt-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      ) : null}

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <SearchInput
            isDisabled={isLoading}
            label="Search customers"
            onChange={setSearchInput}
            onSubmit={submitSearch}
            placeholder="Name, phone, email or identity…"
            value={searchInput}
          />
          <button
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
            disabled={isLoading}
            onClick={() => void loadCustomers()}
            type="button"
          >
            <RefreshCw
              aria-hidden="true"
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        {isLoading && customers.length === 0 ? (
          <LoadingState label="Loading customers" />
        ) : loadError && customers.length === 0 ? (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div className="max-w-md">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-bold text-slate-900">
                Customers could not be loaded
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {loadError}
              </p>
              <button
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                onClick={() => void loadCustomers()}
                type="button"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try again
              </button>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            action={
              search ? (
                <button
                  className="text-sm font-bold text-blue-700 hover:text-blue-800"
                  onClick={() => {
                    setSearchInput('')
                    setSearch('')
                    setPage(1)
                  }}
                  type="button"
                >
                  Clear search
                </button>
              ) : (
                <button
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
                  onClick={openCreateForm}
                  type="button"
                >
                  Create the first customer
                </button>
              )
            }
            description={
              search
                ? `No customer matched “${search}”. Try another search.`
                : 'Add a customer profile to begin tracking their work.'
            }
            icon={<UsersRound className="h-6 w-6" aria-hidden="true" />}
            title={search ? 'No matching customers' : 'No customers yet'}
          />
        ) : (
          <>
            {loadError ? (
              <div
                className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800"
                role="alert"
              >
                Refresh failed: {loadError}. Showing the latest available data.
              </div>
            ) : null}
            <DataTable
              caption="Customer records"
              columns={columns}
              getRowKey={(customer) => customer.id}
              items={customers}
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

      <Modal
        description={
          formMode === 'create'
            ? 'Create a customer profile for future cases and appointments.'
            : 'Review profile details and save any changes.'
        }
        isOpen={isFormOpen}
        onClose={closeForm}
        size="lg"
        title={formMode === 'create' ? 'Create customer' : 'Customer profile'}
      >
        {formMode === 'edit' && isDetailLoading ? (
          <LoadingState label="Loading customer details" />
        ) : formMode === 'edit' && !customerDetail ? (
          <div className="p-6 text-center">
            <AlertTriangle
              aria-hidden="true"
              className="mx-auto h-8 w-8 text-rose-500"
            />
            <p className="mt-3 text-sm text-rose-700">
              {formError ?? 'Customer details could not be loaded.'}
            </p>
            {detailTarget ? (
              <button
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                onClick={() => void loadCustomerDetail(detailTarget)}
                type="button"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : (
          <CustomerForm
            customer={customerDetail}
            error={formError}
            onCancel={closeForm}
            onSubmit={handleSave}
          />
        )}
      </Modal>

      <ConfirmDialog
        isLoading={isDeleting}
        isOpen={Boolean(deleteTarget)}
        message={
          deleteTarget
            ? `Delete ${deleteTarget.fullName}? This action cannot be undone.`
            : ''
        }
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => void handleDelete()}
        title="Delete customer"
      />

      <PortalAccessDialog
        customer={portalTarget}
        onClose={() => setPortalTarget(null)}
        onFeedback={setFeedback}
      />
    </div>
  )
}
