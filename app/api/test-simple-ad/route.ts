import { NextResponse } from 'next/server'

// Test API with simple HTML ad to verify rendering
export async function GET() {
  const testAds = [
    {
      id: "test-header",
      htmlContent: "<div style='background: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 8px;'><h3>🔥 TEST AD - Header</h3><p>This is a simple HTML test ad</p></div>",
      position: "header",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "test-sidebar", 
      htmlContent: "<div style='background: #4ecdc4; color: white; padding: 15px; text-align: center; border-radius: 8px; margin: 10px 0;'><h4>✨ TEST AD - Sidebar</h4><p style='font-size: 12px;'>Simple HTML content works!</p><p style='font-size: 10px; opacity: 0.8;'>No external scripts</p></div>",
      position: "sidebar",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "test-content",
      htmlContent: "<div style='background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 25px; text-align: center; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);'><h3>🎮 TEST AD - Content</h3><p>Beautiful gradient test ad</p><small>Static HTML - No Scripts</small></div>",
      position: "content-top",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
  
  return NextResponse.json(testAds)
}