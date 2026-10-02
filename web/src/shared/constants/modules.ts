import { ROLES, type Role } from '@/shared/lib/roles'

export type ModuleStatus = 'live' | 'coming_soon'

export interface ModuleNavItem {
  name: string
  href: string
  roles?: Role[] // omitted = visible to everyone
}

export interface ModuleDef {
  id: string
  name: string
  description: string
  icon: string // lucide-react icon name; unknown names fall back to Box
  href: string // '#' for coming_soon
  staffHref?: string // target for users without the admin role; omitted = href
  status: ModuleStatus
  roles?: Role[] // omitted = visible to everyone
  group?: ModuleNavItem[] // sidebar sub-items
}

export const MODULES: ModuleDef[] = [
  {
    id: 'it-assets',
    name: 'IT Assets',
    description: 'Asset register, staff assignments and audit history',
    icon: 'Laptop',
    href: '/registration',
    // /registration is admin-only; everyone else lands on their own staff
    // detail page (read-only), resolved server-side from the session email.
    staffHref: '/manager/me',
    status: 'live',
  },
  {
    id: 'licences',
    name: 'Licences',
    description: 'Software licence register and staff assignments',
    icon: 'KeyRound',
    href: '/registration/licence',
    status: 'live',
    roles: [ROLES.ADMIN],
  },
  {
    id: 'tickets',
    name: 'Tickets',
    description: 'IT support ticket queue',
    icon: 'Ticket',
    href: '/tickets',
    status: 'live',
    roles: [ROLES.ADMIN],
  },
  {
    id: 'support',
    name: 'Support',
    description: 'Raise and track IT support tickets',
    icon: 'LifeBuoy',
    href: '/support',
    status: 'live',
  },
  {
    id: 'clock-in',
    name: 'Clock-In Hub',
    description: 'One-click clock in/out for Mech & Elec staff',
    icon: 'Clock',
    href: '#',
    status: 'coming_soon',
  },
  {
    id: 'documents',
    name: 'Document Hub',
    description: 'RAMS, permits and procedures by department',
    icon: 'FolderOpen',
    href: '#',
    status: 'coming_soon',
  },
  {
    id: 'org-chart',
    name: 'Org Chart',
    description: 'Company structure across all divisions',
    icon: 'Network',
    href: '#',
    status: 'coming_soon',
  },
  {
    id: 'fleet',
    name: 'Fleet Manager',
    description: 'Vehicles, MOT, service and driver tracking',
    icon: 'Truck',
    href: '#',
    status: 'coming_soon',
    roles: [ROLES.ADMIN, ROLES.DEPT_MANAGER],
  },
  {
    id: 'training',
    name: 'Training Hub',
    description: 'Courses and role-based training matrix',
    icon: 'GraduationCap',
    href: '#',
    status: 'coming_soon',
  },
  {
    id: 'hs',
    name: 'Health & Safety',
    description: 'Inductions, RAMS sign-off and accident reporting',
    icon: 'ShieldCheck',
    href: '#',
    status: 'coming_soon',
  },
]

export function visibleModules(userRoles: string[]): ModuleDef[] {
  return MODULES.filter(
    m => !m.roles || m.roles.some(r => userRoles.includes(r))
  )
}

export function moduleHref(module: ModuleDef, userRoles: string[]): string {
  const isAdmin = userRoles.includes(ROLES.ADMIN)
  return !isAdmin && module.staffHref ? module.staffHref : module.href
}

export function visibleNavItems(
  module: ModuleDef,
  userRoles: string[]
): ModuleNavItem[] {
  return (module.group ?? []).filter(
    i => !i.roles || i.roles.some(r => userRoles.includes(r))
  )
}

export interface NavGroupDef {
  label: string
  items: ModuleNavItem[]
}

// Verb-grouped sidebar accordion config. Drives the Register/Management
// collapsible parents. Role-filtered per item via visibleNavGroups().
export const NAV_GROUPS: NavGroupDef[] = [
  {
    label: 'Register',
    items: [
      { name: 'Asset', href: '/registration/asset', roles: [ROLES.ADMIN] },
      { name: 'Staff', href: '/registration/staff', roles: [ROLES.ADMIN] },
      { name: 'Licence', href: '/registration/licence', roles: [ROLES.ADMIN] },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'IT Assets', href: '/manager/asset', roles: [ROLES.ADMIN] },
      { name: 'Staff', href: '/manager/staff', roles: [ROLES.ADMIN] },
      { name: 'Licences', href: '/manager/licence', roles: [ROLES.ADMIN] },
    ],
  },
]

export function visibleNavGroups(userRoles: string[]): NavGroupDef[] {
  return NAV_GROUPS.map(group => ({
    label: group.label,
    items: group.items.filter(
      i => !i.roles || i.roles.some(r => userRoles.includes(r))
    ),
  })).filter(group => group.items.length > 0)
}
