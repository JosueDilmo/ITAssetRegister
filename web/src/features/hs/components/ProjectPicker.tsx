'use client'

import { useState } from 'react'

type Project = { id: string; name: string; code: string }

type ProjectPickerProps = {
  projects: Project[]
  stale: boolean
  cachedAtLabel: string
}

// Matching only: the visible label always stays the raw folder name (D-15).
export function normaliseForSearch(s: string): string {
  return s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
}

export function filterProjects<T extends Project>(
  projects: T[],
  query: string
): T[] {
  const q = normaliseForSearch(query)
  if (q === '') return projects
  return projects.filter(
    p =>
      normaliseForSearch(p.name).includes(q) ||
      normaliseForSearch(p.code).includes(q)
  )
}

export function ProjectPicker({
  projects,
  stale,
  cachedAtLabel,
}: ProjectPickerProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = filterProjects(projects, query)
  const canContinue = filtered.some(p => p.id === selectedId)

  return (
    <form action="/hs/new/permit" method="get" className="flex flex-col gap-4">
      {stale && (
        // biome-ignore lint/a11y/useSemanticElements: a live status message, not a form-result <output> (plan 03-09 contract)
        <p
          role="status"
          className="text-xs text-yellow-500 border border-yellow-500 rounded px-3 py-2"
        >
          Showing list from {cachedAtLabel} - SharePoint unreachable
        </p>
      )}
      <input
        type="search"
        aria-label="Search projects"
        placeholder="Search projects"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="min-h-12 w-full text-base px-4 rounded border border-gray-600 bg-gray-800 text-gray-50"
      />
      <p className="font-mono text-xs text-gray-100">
        {`${filtered.length} of ${projects.length} projects`}
      </p>
      <fieldset className="max-h-[60dvh] overflow-y-auto flex flex-col gap-2">
        <legend className="sr-only">Project</legend>
        {projects.length === 0 ? (
          <p className="text-sm text-gray-100">
            No open projects found in SharePoint.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-100">
            {`No projects match "${query.trim()}"`}
          </p>
        ) : (
          filtered.map(project => (
            <label
              key={project.id}
              className="flex w-full min-h-12 items-center gap-3 px-4 rounded border border-gray-600 hover:border-blue"
            >
              <input
                type="radio"
                name="projectId"
                value={project.id}
                checked={selectedId === project.id}
                onChange={() => setSelectedId(project.id)}
              />
              <span className="whitespace-pre-wrap text-gray-50">
                {project.name}
              </span>
              <span className="ml-auto font-mono text-xs text-gray-100">
                {project.code}
              </span>
            </label>
          ))
        )}
      </fieldset>
      <div>
        <button
          type="submit"
          disabled={!canContinue}
          className="min-h-12 px-6 rounded border border-blue text-blue hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent"
        >
          Continue
        </button>
      </div>
    </form>
  )
}
