"use client"

import { useAdminAuth } from "@/lib/auth"
import AdminLogin from "./AdminLogin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Shield } from "lucide-react"

// 直接导入组件，避免lazy loading问题
import GamesManager from "./admin/GamesManager"
import AdsManager from "./admin/AdsManager"
import FeaturedGamesManager from "./admin/FeaturedGamesManager"
import RecommendedGamesManager from "./RecommendedGamesManager"
import HomepageManager from "./HomepageManager"
import SEOManager from "./SEOManager"

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

        {/* Admin Tabs */}
        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="ads">Ads</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="homepage">Homepage</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>
          
          <TabsContent value="games">
            <GamesManager />
          </TabsContent>
          
          <TabsContent value="featured">
            <FeaturedGamesManager />
          </TabsContent>
          
          <TabsContent value="ads">
            <AdsManager />
          </TabsContent>
          
          <TabsContent value="recommendations">
            <RecommendedGamesManager />
          </TabsContent>
          
          <TabsContent value="homepage">
            <HomepageManager />
          </TabsContent>
          
          <TabsContent value="seo">
            <SEOManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}