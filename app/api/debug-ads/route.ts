import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Debug API to check ads data loading
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'ads.json')
    
    // Check if file exists
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false)
    
    if (!fileExists) {
      return NextResponse.json({
        error: 'ads.json file not found',
        filePath,
        exists: false
      })
    }
    
    // Read file content
    const fileContent = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(fileContent)
    
    // Filter active ads
    const activeAds = data.filter((ad: any) => ad.isActive)
    
    return NextResponse.json({
      success: true,
      filePath,
      fileExists,
      totalAds: data.length,
      activeAds: activeAds.length,
      allAds: data,
      activeAdsData: activeAds,
      positions: [...new Set(data.map((ad: any) => ad.position))],
      activePositions: [...new Set(activeAds.map((ad: any) => ad.position))]
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to load ads data',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}