import AdminPanel from "@/components/AdminPanelOptimized"
import { isAdminEnabled } from "@/lib/admin-security"
import { redirect } from "next/navigation"

export default function AdminPage() {
  if (!isAdminEnabled()) {
    redirect('/')
  }
  
  return <AdminPanel />
}

export const metadata = {
  title: "Admin - Game Management",
  description: "Manage games and website settings",
  robots: "noindex, nofollow, noarchive, nosnippet, noimageindex"
}