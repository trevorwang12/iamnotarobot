import { NextResponse } from 'next/server'
import categoriesData from '@/data/categories.json'

export async function GET() {
  try {
    // Return active categories only
    const activeCategories = categoriesData.filter((category: any) => category.isActive)
    return NextResponse.json(activeCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json([], { status: 200 })
  }
}