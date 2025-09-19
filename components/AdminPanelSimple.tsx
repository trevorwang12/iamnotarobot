"use client"

import { useAdminAuth } from "@/lib/auth"
import AdminLogin from "./AdminLogin"
import AdminTabsLoader from "./admin/AdminTabsLoader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Shield, Users, Settings } from "lucide-react"

export default function AdminPanel() {
  const { isAuthenticated, isLoading, login, logout } = useAdminAuth()

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Authentication required
  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} />
  }

  // Main admin interface
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="container mx-auto p-6">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Admin Panel</CardTitle>
                  <p className="text-sm text-gray-600">Manage your gaming platform</p>
                </div>
              </div>
              <Button variant="outline" onClick={logout} className="flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Admin Tabs with Lazy Loading */}
        <AdminTabsLoader />
      </div>
    </div>
  )
}