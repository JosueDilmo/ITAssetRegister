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
    status: 'live',
    group: [
      { name: 'Register', href: '/registration' },
      { name: 'Management', href: '/manager', roles: [ROLES.ADMIN] },
      { name: 'Tickets', href: '/tickets', roles: [ROLES.ADMIN] },
    ],
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

export function visibleNavItems(
  module: ModuleDef,
  userRoles: string[]
): ModuleNavItem[] {
  return (module.group ?? []).filter(
    i => !i.roles || i.roles.some(r => userRoles.includes(r))
  )
}
