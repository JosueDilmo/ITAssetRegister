// Server-side H&S role allow-list. admin is listed explicitly, never implied
// (D-03, D-14): a role gains H&S access only by being named here.
export const HS_ROLES = ['site_supervisor', 'hs_officer', 'admin'] as const
