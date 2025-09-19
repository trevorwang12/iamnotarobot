import { NextResponse } from 'next/server'
import { createAdminResponse, logAdminAccess } from '@/lib/admin-security'
import { persistentDataManager } from '@/lib/persistent-data-manager'
import { githubStorage } from '@/lib/github-storage'

export async function GET() {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/storage-status', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }
  
  try {
    logAdminAccess('/api/admin/storage-status', true)
    
    const storageInfo = persistentDataManager.getStorageInfo()
    const isProduction = process.env.NODE_ENV === 'production'
    const hasGitHubToken = !!process.env.GITHUB_TOKEN
    const isGitHubConfigured = githubStorage.isConfigured()
    
    const status = {
      environment: process.env.NODE_ENV || 'development',
      storageMode: storageInfo.mode,
      isProduction,
      hasGitHubToken,
      isGitHubConfigured,
      isPersistent: isProduction && isGitHubConfigured,
      warning: !isProduction || !isGitHubConfigured 
        ? 'Data changes may not persist in production without GitHub token' 
        : null,
      recommendations: []
    }
    
    // Add recommendations based on current configuration
    if (isProduction && !hasGitHubToken) {
      status.recommendations.push('Set GITHUB_TOKEN environment variable for data persistence')
    }
    
    if (!isProduction) {
      status.recommendations.push('Data persistence will work automatically in production with GitHub token')
    }
    
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get storage status' }, { status: 500 })
  }
}