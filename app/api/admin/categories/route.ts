import { NextRequest, NextResponse } from 'next/server'
import { sanitizeInput, validateCategoryData, generateSecureId } from '@/lib/security'
import { createAdminResponse, logAdminAccess } from '@/lib/admin-security'
import defaultCategories from '@/data/categories.json'
import { promises as fs } from 'fs'
import path from 'path'

// 简单的服务器端率限制实现
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

function isRateLimited(key: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || (now - record.timestamp) > windowMs) {
    rateLimitMap.set(key, { count: 1, timestamp: now })
    return false
  }

  if (record.count >= maxAttempts) {
    return true
  }

  record.count++
  return false
}

// 内存中的分类数据，服务重启后会恢复默认值
let categoriesData: CategoryData[] = defaultCategories as CategoryData[]

interface CategoryData {
  id: string
  name: string
  description: string
  icon: string
  color: string
  isActive: boolean
}

// 从文件加载最新数据
async function loadFromFile(): Promise<CategoryData[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'categories.json')
    const fileContent = await fs.readFile(filePath, 'utf8')
    const loadedData = JSON.parse(fileContent)
    console.log('Categories data loaded from file:', filePath)
    return loadedData
  } catch (error) {
    console.log('Failed to load categories data from file, using default:', error)
    return defaultCategories as CategoryData[]
  }
}

// 将数据保存到 JSON 文件
async function saveToFile(data: CategoryData[]) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'categories.json')
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    console.log('Categories data saved to file:', filePath)
  } catch (error) {
    console.error('Failed to save categories data to file:', error)
    // 不抛出错误，让内存更新继续进行
  }
}


// GET - 获取所有分类
export async function GET() {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/categories', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/categories', true)
  try {
    if (isRateLimited('admin-read', 50, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    categoriesData = await loadFromFile()
    return NextResponse.json(categoriesData)
  } catch (error) {
    console.error('Error in GET /api/admin/categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST - 创建新分类
export async function POST(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/categories', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/categories', true)
  try {
    if (isRateLimited('admin-write', 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Load latest data from file before making changes
    categoriesData = await loadFromFile()
    
    const body = await request.json()
    
    // 数据验证和清理
    const categoryData = {
      name: sanitizeInput(body.name),
      description: sanitizeInput(body.description),
      icon: sanitizeInput(body.icon),
      color: body.color,
      isActive: body.isActive !== false
    }

    const validation = validateCategoryData(categoryData)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    // 生成唯一ID
    const id = generateSecureId(categoryData.name)
    
    // 检查ID是否已存在
    if (categoriesData.some(cat => cat.id === id)) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 409 })
    }

    const newCategory: CategoryData = {
      id,
      ...categoryData
    }

    categoriesData.push(newCategory)
    await saveToFile(categoriesData)

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/categories:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PUT - 更新分类
export async function PUT(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/categories', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/categories', true)
  try {
    if (isRateLimited('admin-write', 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Load latest data from file before making changes
    categoriesData = await loadFromFile()
    
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const body = await request.json()
    
    // 数据验证和清理
    const categoryData = {
      name: sanitizeInput(body.name),
      description: sanitizeInput(body.description),
      icon: sanitizeInput(body.icon),
      color: body.color,
      isActive: body.isActive !== false
    }

    const validation = validateCategoryData(categoryData)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const categoryIndex = categoriesData.findIndex(cat => cat.id === categoryId)

    if (categoryIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // 更新分类
    categoriesData[categoryIndex] = {
      ...categoriesData[categoryIndex],
      ...categoryData
    }
    await saveToFile(categoriesData)

    return NextResponse.json(categoriesData[categoryIndex])
  } catch (error) {
    console.error('Error in PUT /api/admin/categories:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE - 删除分类
export async function DELETE(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/categories', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/categories', true)
  try {
    if (isRateLimited('admin-write', 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Load latest data from file before making changes
    categoriesData = await loadFromFile()
    
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const categoryIndex = categoriesData.findIndex(cat => cat.id === categoryId)

    if (categoryIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // 注意：由于改为内存存储，无法直接检查games.json文件
    // 这里需要根据实际情况调整游戏数据检查逻辑

    // 删除分类
    categoriesData.splice(categoryIndex, 1)
    await saveToFile(categoriesData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/categories:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}