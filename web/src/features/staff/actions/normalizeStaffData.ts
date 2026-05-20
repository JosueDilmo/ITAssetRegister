import type { staffNormalizeData } from '@/shared/interface/index'

export function normalizeStaffData({
  name,
  email,
  department,
  jobTitle,
  createdBy,
}: staffNormalizeData) {
  return {
    name: name.toUpperCase().trim(),
    email: email.toLowerCase().trim(),
    department: department.toUpperCase().trim(),
    jobTitle: jobTitle.toUpperCase().trim(),
    createdBy,
  }
}
