import type { getApiMe } from '@/http/api'
import * as Icons from 'lucide-react'

type MeStaff = NonNullable<Awaited<ReturnType<typeof getApiMe>>['staff']>

const DASH = '—'
const LOAD_ERROR =
  'We could not load your account details. Refresh the page to try again. If it keeps happening, contact IT support.'

function StatusBadge({ status }: { status: string }) {
  const base =
    'inline-flex items-center gap-2 font-mono text-xs uppercase border px-2 py-1 rounded shrink-0'

  if (status === 'ACTIVE') {
    return (
      <span className={`${base} border-green-500 text-green-500`}>
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-full bg-green-500 animate-status-dot"
        />
        {status}
      </span>
    )
  }

  if (status === 'INACTIVE') {
    return (
      <span className={`${base} border-red text-red`}>
        <span aria-hidden="true" className="w-2 h-2 rounded-full bg-red" />
        {status}
      </span>
    )
  }

  return (
    <span className={`${base} border-gray-300 text-gray-100`}>
      {status || DASH}
    </span>
  )
}

function Field({
  label,
  valueClassName,
  value,
}: {
  label: string
  valueClassName: string
  value: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="font-mono text-xs uppercase tracking-widest text-gray-100">
        {label}
      </dt>
      <dd className={valueClassName}>{value || DASH}</dd>
    </div>
  )
}

export function ProfileCard({
  staff,
  email,
  failed,
}: {
  staff: MeStaff | null
  email: string
  failed: boolean
}) {
  return (
    <section
      aria-labelledby="profile-title"
      className="rounded border border-gray-600 bg-gray-800 p-6"
    >
      <div className="flex items-center gap-2">
        <Icons.UserRound aria-hidden="true" className="w-4 h-4 text-gray-100" />
        <h2
          id="profile-title"
          className="font-heading text-sm font-semibold uppercase tracking-wider leading-tight text-gray-100"
        >
          Profile
        </h2>
      </div>

      {failed ? (
        <p className="mt-4 text-sm text-red">{LOAD_ERROR}</p>
      ) : staff === null ? (
        <p className="mt-4 py-2 text-sm text-gray-100">
          No staff record found for {email}. Contact IT support to be added.
        </p>
      ) : (
        <dl className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Name"
            value={staff.name}
            valueClassName="text-sm font-semibold text-gray-50"
          />
          <Field
            label="Email"
            value={staff.email}
            valueClassName="font-mono text-xs text-gray-50 break-all"
          />
          <Field
            label="Department"
            value={staff.department}
            valueClassName="text-sm text-gray-50"
          />
          <Field
            label="Job title"
            value={staff.jobTitle}
            valueClassName="text-sm text-gray-50"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <dt className="font-mono text-xs uppercase tracking-widest text-gray-100">
              Status
            </dt>
            <dd>
              <StatusBadge status={staff.status} />
            </dd>
          </div>
        </dl>
      )}
    </section>
  )
}
