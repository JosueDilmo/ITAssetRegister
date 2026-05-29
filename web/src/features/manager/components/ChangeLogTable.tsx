interface ChangeLogEntry {
  updatedBy: string
  updatedAt: string
  updatedField: string
  previousValue: (string | null)[]
  newValue: (string | null)[]
}

interface ChangeLogTableProps {
  changeLog: ChangeLogEntry[]
  title?: string
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AssetDiffCell({
  prev,
  next,
}: {
  prev: (string | null)[]
  next: (string | null)[]
}) {
  const prevSet = new Set(prev.filter(Boolean) as string[])
  const nextSet = new Set(next.filter(Boolean) as string[])
  const added = [...nextSet].filter(id => !prevSet.has(id))
  const removed = [...prevSet].filter(id => !nextSet.has(id))

  return (
    <td className="px-2 py-1.5" colSpan={2}>
      <div className="flex flex-col gap-0.5">
        {added.map(id => (
          <a
            key={id}
            href={`/manager/${id}`}
            className="font-mono text-green-500/80 hover:text-green-500 hover:underline text-xs truncate max-w-[200px]"
            title={id}
          >
            + {id.slice(0, 12)}…
          </a>
        ))}
        {removed.map(id => (
          <a
            key={id}
            href={`/manager/${id}`}
            className="font-mono text-red/80 hover:text-red hover:underline text-xs truncate max-w-[200px]"
            title={id}
          >
            − {id.slice(0, 12)}…
          </a>
        ))}
        {added.length === 0 && removed.length === 0 && (
          <span className="font-mono text-xs text-gray-100/40">unchanged</span>
        )}
      </div>
    </td>
  )
}

function truncateValue(values: (string | null)[]): string {
  const text = values.filter(Boolean).join(', ')
  if (!text) return '—'
  return text.length > 32 ? `${text.slice(0, 30)}…` : text
}

export function ChangeLogTable({
  changeLog,
  title = 'Change History',
}: ChangeLogTableProps) {
  if (!changeLog || changeLog.length === 0) {
    return (
      <div className="mt-2 rounded-lg border border-gray-500 bg-gray-600/50 p-4">
        <h3 className="mb-2 text-xs font-mono uppercase tracking-widest text-blue/70">
          {title}
        </h3>
        <p className="text-xs text-gray-100/50">No changes recorded.</p>
      </div>
    )
  }

  const sortedLog = [...changeLog].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return (
    <div className="mt-2 rounded-lg border border-gray-500 bg-gray-600/50 p-4">
      <h3 className="mb-3 text-xs font-mono uppercase tracking-widest text-blue/70">
        {title}
        <span className="ml-2 text-gray-100/40">({sortedLog.length})</span>
      </h3>
      <div className="max-h-64 overflow-y-auto scrollbar-hide">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-600">
            <tr className="border-b border-gray-500 text-left">
              <th className="px-2 py-1.5 font-mono uppercase tracking-wider text-blue/60">Date</th>
              <th className="px-2 py-1.5 font-mono uppercase tracking-wider text-blue/60">By</th>
              <th className="px-2 py-1.5 font-mono uppercase tracking-wider text-blue/60">Field</th>
              <th className="px-2 py-1.5 font-mono uppercase tracking-wider text-blue/60">Prev</th>
              <th className="px-2 py-1.5 font-mono uppercase tracking-wider text-blue/60">New</th>
            </tr>
          </thead>
          <tbody>
            {sortedLog.map((entry, i) => (
              <tr
                key={`${entry.updatedAt}-${i}`}
                className={`border-b border-gray-500/50 ${i % 2 === 0 ? 'bg-gray-600/30' : ''}`}
              >
                <td className="whitespace-nowrap px-2 py-1.5 font-mono text-gray-100">
                  {formatDate(entry.updatedAt)}
                </td>
                <td className="px-2 py-1.5 text-gray-100/70 max-w-[80px] truncate" title={entry.updatedBy}>
                  {entry.updatedBy.split('@')[0]}
                </td>
                <td className="px-2 py-1.5">
                  <span className="rounded bg-gray-500 px-1.5 py-0.5 font-mono text-blue">
                    {entry.updatedField}
                  </span>
                </td>
                {entry.updatedField === 'assetHistoryList' ? (
                  <AssetDiffCell prev={entry.previousValue} next={entry.newValue} />
                ) : (
                  <>
                    <td className="px-2 py-1.5 font-mono text-red/80" title={entry.previousValue.join(', ')}>
                      {truncateValue(entry.previousValue)}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-green-500/80" title={entry.newValue.join(', ')}>
                      {truncateValue(entry.newValue)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
