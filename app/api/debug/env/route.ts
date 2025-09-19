import { NextRequest, NextResponse } from 'next/server'

// GET /api/debug/env - 检查环境变量状态
export async function GET(request: NextRequest) {
  const debugInfo = {
    NODE_ENV: process.env.NODE_ENV,
    ENABLE_ADMIN: process.env.ENABLE_ADMIN,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(debugInfo)
}