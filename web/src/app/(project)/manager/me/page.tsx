import { redirect } from 'next/navigation'

// Interim "My staff record" route, kept only so stale bookmarks still land
// somewhere useful. /account handles the signed-out case itself.
export default function MyStaffPage() {
  redirect('/account')
}
