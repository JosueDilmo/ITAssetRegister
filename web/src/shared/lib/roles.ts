// Central definition of platform roles sourced from Entra ID app roles.
// Role meanings:
// - admin: full access to all modules
// - hr: Training Hub management (future phase)
// - hs_officer: H&S module management (future phase)
// - dept_manager: department-scoped views (future phase)
// - staff: default for users with no app role assignment (read-only)

export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  HS_OFFICER: 'hs_officer',
  DEPT_MANAGER: 'dept_manager',
  STAFF: 'staff',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// Highest priority first — used to derive the single display/legacy role
export const ROLE_PRIORITY: Role[] = [
  ROLES.ADMIN,
  ROLES.HR,
  ROLES.HS_OFFICER,
  ROLES.DEPT_MANAGER,
  ROLES.STAFF,
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
