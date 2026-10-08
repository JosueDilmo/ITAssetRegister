// Central definition of platform roles sourced from Entra ID app roles.
// Role meanings:
// - admin: full access to all modules
// - hr: Training Hub management (future phase)
// - hs_officer: H&S module management and permit approval
// - dept_manager: department-scoped views (future phase)
// - site_supervisor: raises H&S permits for projects
// - staff: default for users with no app role assignment (read-only)
//
// ROLE_PRIORITY only drives the single display badge. Access decisions
// (module visibility, /hs guard) always use the full roles array (D-02).

export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  HS_OFFICER: 'hs_officer',
  DEPT_MANAGER: 'dept_manager',
  SITE_SUPERVISOR: 'site_supervisor',
  STAFF: 'staff',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// Highest priority first — used to derive the single display/legacy role
export const ROLE_PRIORITY: Role[] = [
  ROLES.ADMIN,
  ROLES.HR,
  ROLES.HS_OFFICER,
  ROLES.DEPT_MANAGER,
  ROLES.SITE_SUPERVISOR,
  ROLES.STAFF,
]

// Display names for the sidebar badge. Like ROLE_PRIORITY, labels are display
// only; access decisions use the full roles array (D-02).
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  hr: 'HR',
  hs_officer: 'H&S Officer',
  dept_manager: 'Department Manager',
  site_supervisor: 'Site Supervisor',
  staff: 'Staff',
}

// Unknown values (legacy 'viewer', inherited keys such as 'constructor', '')
// come back unchanged.
export function roleLabel(role: string): string {
  return Object.hasOwn(ROLE_LABELS, role) ? ROLE_LABELS[role as Role] : role
}

// Roles allowed into the H&S Permits module
export const HS_ROLES: Role[] = [
  ROLES.SITE_SUPERVISOR,
  ROLES.HS_OFFICER,
  ROLES.ADMIN,
]

export function highestRole(roles: string[]): Role {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role
  }
  return ROLES.STAFF
}

export function hasRole(userRoles: string[] | undefined, role: Role): boolean {
  return userRoles?.includes(role) ?? false
}
