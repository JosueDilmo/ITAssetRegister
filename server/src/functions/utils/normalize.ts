// Utility functions for normalizing staff and asset data on the server side

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizeName(name: string): string {
  return name.trim().toUpperCase()
}

export function normalizeDepartment(department: string): string {
  return department.trim().toUpperCase()
}

export function normalizeJobTitle(jobTitle: string): string {
  return jobTitle.trim().toUpperCase()
}

export function normalizeSerialNumber(serialNumber: string): string {
  return serialNumber.trim().toUpperCase()
}

export function normalizeAssetNumber(assetNumber: string): string {
  return assetNumber.trim().toUpperCase()
}

export function normalizeAssignedTo(assignedTo?: string | null): string | null {
  return assignedTo ? assignedTo.trim().toLowerCase() : null
}
