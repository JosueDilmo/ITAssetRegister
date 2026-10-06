import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  fireEvent,
  getDefaultNormalizer,
  render,
  screen,
} from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  ProjectPicker,
  filterProjects,
  normaliseForSearch,
} from '@/features/hs/components/ProjectPicker'

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

describe('search normalisation and filtering (D-16)', () => {
  it('normaliseForSearch collapses whitespace, trims and lower-cases', () => {
    expect(normaliseForSearch('  PR1982  DRT ')).toBe('pr1982 drt')
  })

  it('normaliseForSearch folds to NFC so decomposed accents match', () => {
    expect(normaliseForSearch('Cafe\u0301')).toBe(
      normaliseForSearch('Caf\u00e9')
    )
  })

  it.each([
    ['pr1982 drt', ['b2']],
    ['  SILVER   stream ', ['a1']],
    ['pr1913', ['a1']],
    ['', ['a1', 'b2', 'c3']],
    ['   ', ['a1', 'b2', 'c3']],
    ['zzz', []],
  ])('filterProjects(%j) -> %j', (query, ids) => {
    expect(filterProjects(PROJECTS, query).map(p => p.id)).toEqual(ids)
  })
})

describe('ProjectPicker search, stale and empty states', () => {
  const search = () => screen.getByLabelText('Search projects')

  it('hides non-matching rows and shows the count when typing', () => {
    render(
      <ProjectPicker projects={PROJECTS} stale={false} cachedAtLabel="14:20" />
    )
    fireEvent.change(search(), { target: { value: 'silver' } })
    expect(screen.getAllByRole('radio')).toHaveLength(1)
    expect(screen.getByText('1 of 3 projects')).toBeInTheDocument()
  })

  it('matches across a double space in the stored name', () => {
    render(
      <ProjectPicker projects={PROJECTS} stale={false} cachedAtLabel="14:20" />
    )
    fireEvent.change(search(), { target: { value: 'pr1982 drt' } })
    expect(screen.getAllByRole('radio')).toHaveLength(1)
    expect(rawName('PR1982  DRT DUB 13 Dehumidifiers')).toBeInTheDocument()
  })

  it('disables Continue when the selected row is filtered out', () => {
    render(
      <ProjectPicker projects={PROJECTS} stale={false} cachedAtLabel="14:20" />
    )
    fireEvent.click(screen.getAllByRole('radio')[0])
    const button = screen.getByRole('button', { name: 'Continue' })
    expect(button).toBeEnabled()
    fireEvent.change(search(), { target: { value: 'dehumidifiers' } })
    expect(button).toBeDisabled()
  })

  it('shows the stale notice with the cache time (D-17)', () => {
    render(<ProjectPicker projects={PROJECTS} stale cachedAtLabel="14:20" />)
    expect(screen.getByRole('status')).toHaveTextContent(
      /^Showing list from 14:20 - SharePoint unreachable$/
    )
  })

  it('shows no status element when the list is fresh', () => {
    render(
      <ProjectPicker projects={PROJECTS} stale={false} cachedAtLabel="14:20" />
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the empty message when SharePoint has no open projects', () => {
    render(<ProjectPicker projects={[]} stale={false} cachedAtLabel="14:20" />)
    expect(
      screen.getByText('No open projects found in SharePoint.')
    ).toBeInTheDocument()
  })

  it('shows the no-match message for a search with no result', () => {
    render(
      <ProjectPicker projects={PROJECTS} stale={false} cachedAtLabel="14:20" />
    )
    fireEvent.change(search(), { target: { value: 'zzz' } })
    expect(screen.getByText('No projects match "zzz"')).toBeInTheDocument()
  })
})

describe('/hs/new error states and /hs/new/permit (T-03-32..34)', () => {
  const page = src('app/(project)/hs/new/page.tsx')
  const permit = src('app/(project)/hs/new/permit/page.tsx')

  it('words a configuration failure and an unreachable failure differently', () => {
    expect(page).toContain(
      'H&S SharePoint access is not configured on the server. Contact IT.'
    )
    expect(page).toContain(
      'SharePoint is unreachable and no saved project list is available yet. Try again in a few minutes.'
    )
    expect(page).toContain('HS_NOT_CONFIGURED')
    expect(page).toContain('href="/hs/new"')
  })

  it('guards the Continue target and re-checks the project id', () => {
    expect(permit).toContain('await requireHsRoleOrRedirect()')
    expect(permit).toContain('await searchParams')
    expect(permit).toContain('getApiHsProjects()')
    expect(permit).toMatch(/from '@\/http\/api'/)
    expect(permit).toContain("redirect('/hs/new')")
  })

  it('renders names as text only, never as raw HTML', () => {
    expect(src('features/hs/components/ProjectPicker.tsx')).not.toContain(
      'dangerouslySetInnerHTML'
    )
  })
})
