import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  fireEvent,
  getDefaultNormalizer,
  render,
  screen,
} from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProjectPicker } from '@/features/hs/components/ProjectPicker'

const rawName = (name: string) =>
  screen.getByText(name, {
    normalizer: getDefaultNormalizer({
      collapseWhitespace: false,
      trim: false,
    }),
  })

const PROJECTS = [
  {
    id: 'a1',
    name: 'PR1913 EMS - Silver Stream & Trinity Care',
    code: 'PR1913',
  },
  { id: 'b2', name: 'PR1982  DRT DUB 13 Dehumidifiers', code: 'PR1982' },
  { id: 'c3', name: "PR1983 St. Andrew's", code: 'PR1983' },
]

const src = (rel: string) =>
  readFileSync(join(__dirname, '..', 'src', rel), 'utf8')

describe('ProjectPicker rendering (D-13, D-15)', () => {
  it('renders one radio row per project named projectId', () => {
    const { container } = render(
      <ProjectPicker projects={PROJECTS} stale={false} cachedAtLabel="14:20" />
    )
    const radios = container.querySelectorAll('input[type="radio"]')
    expect(radios).toHaveLength(3)
    for (const r of radios) expect(r).toHaveAttribute('name', 'projectId')
  })

  it('shows the raw folder name with its double space preserved (D-15)', () => {
    render(
      <ProjectPicker projects={PROJECTS} stale={false} cachedAtLabel="14:20" />
    )
    const el = rawName('PR1982  DRT DUB 13 Dehumidifiers')
    expect(el.textContent).toBe('PR1982  DRT DUB 13 Dehumidifiers')
    expect(el.className).toContain('whitespace-pre-wrap')
  })

  it('wraps the rows in a GET form that targets /hs/new/permit', () => {
    const { container } = render(
      <ProjectPicker projects={PROJECTS} stale={false} cachedAtLabel="14:20" />
    )
    const form = container.querySelector('form')
    expect(form).toHaveAttribute('action', '/hs/new/permit')
    expect(form).toHaveAttribute('method', 'get')
  })

  it('keeps Continue disabled until a row is selected', () => {
    render(
      <ProjectPicker projects={PROJECTS} stale={false} cachedAtLabel="14:20" />
    )
    const button = screen.getByRole('button', { name: 'Continue' })
    expect(button).toBeDisabled()
    fireEvent.click(screen.getAllByRole('radio')[1])
    expect(button).toBeEnabled()
  })
})

describe('/hs/new page structure (D-13, ACC-03)', () => {
  const page = src('app/(project)/hs/new/page.tsx')

  it('awaits the H&S guard', () => {
    expect(page).toContain('await requireHsRoleOrRedirect()')
  })

  it('fetches the list through the generated client', () => {
    expect(page).toMatch(/from '@\/http\/api'/)
    expect(page).toContain('getApiHsProjects()')
  })

  it('formats the cache time in Europe/Dublin on the server (D-17)', () => {
    expect(page).toContain("timeZone: 'Europe/Dublin'")
  })
})
