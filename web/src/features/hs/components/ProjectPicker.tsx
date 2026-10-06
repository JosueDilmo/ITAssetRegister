'use client'

import { useState } from 'react'

type Project = { id: string; name: string; code: string }

type ProjectPickerProps = {
  projects: Project[]
  stale: boolean
  cachedAtLabel: string
}

export function ProjectPicker({ projects }: ProjectPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <form action="/hs/new/permit" method="get" className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Project</legend>
        {projects.map(project => (
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
        ))}
      </fieldset>
      <div>
        <button
          type="submit"
          disabled={selectedId === null}
          className="min-h-12 px-6 rounded border border-blue text-blue hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent"
        >
          Continue
        </button>
      </div>
    </form>
  )
}
