import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

async function loadFromFile() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'recommended-games.json')
    const fileContent = await fs.readFile(filePath, 'utf8')
    const data = JSON.parse(fileContent)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.log('Failed to load recommendations from file, using empty:', error)
    return []
  }
}

export async function GET() {
  try {
    const recommendations = await loadFromFile()
    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json([], { status: 200 })
  }
}