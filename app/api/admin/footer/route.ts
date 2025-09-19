import { NextRequest, NextResponse } from 'next/server'
import { footerManager, type FooterContent, type FooterLink, type SocialLink } from '@/lib/footer-manager'
import footerData from '@/data/footer.json'
import { promises as fs } from 'fs'
import path from 'path'
import { createAdminResponse, logAdminAccess } from '@/lib/admin-security'

// 内存中的footer内容，服务重启后会恢复默认值
let footerContent: FooterContent = footerData as FooterContent

// 将数据保存到 JSON 文件
async function saveToFile(data: FooterContent) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'footer.json')
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    console.log('Footer data saved to file:', filePath)
  } catch (error) {
    console.error('Failed to save footer data to file:', error)
    // 不抛出错误，让内存更新继续进行
  }
}

export async function GET() {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/footer', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }
  
  try {
    logAdminAccess('/api/admin/footer', true)
    return NextResponse.json(footerContent)
  } catch (error) {
    console.error('Footer API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load footer content' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/footer', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }
  
  try {
    logAdminAccess('/api/admin/footer', true)
    const body = await request.json()
    const { action, section, data, id, updates, links } = body

    switch (action) {
      case 'updateSection':
        if (!section || !data) {
          return NextResponse.json(
            { error: 'Section and data are required for updateSection' },
            { status: 400 }
          )
        }
        
        // 更新内存中的内容
        footerContent = {
          ...footerContent,
          [section]: {
            ...footerContent[section],
            ...data
          }
        }
        
        // 保存到文件
        await saveToFile(footerContent)
        
        return NextResponse.json({ success: true })

      case 'addNavigationLink':
        if (!data) {
          return NextResponse.json(
            { error: 'Link data is required' },
            { status: 400 }
          )
        }
        const newNavLink: FooterLink = {
          ...data,
          id: `nav-${Date.now()}`,
          order: footerContent.navigation.links.length + 1
        }
        footerContent.navigation.links.push(newNavLink)
        await saveToFile(footerContent)
        return NextResponse.json({ success: true, link: newNavLink })

      case 'updateNavigationLink':
        if (!id || !updates) {
          return NextResponse.json(
            { error: 'ID and updates are required' },
            { status: 400 }
          )
        }
        const navIndex = footerContent.navigation.links.findIndex(link => link.id === id)
        if (navIndex !== -1) {
          footerContent.navigation.links[navIndex] = {
            ...footerContent.navigation.links[navIndex],
            ...updates
          }
          await saveToFile(footerContent)
          return NextResponse.json({ success: true })
        }
        return NextResponse.json({ success: false })

      case 'deleteNavigationLink':
        if (!id) {
          return NextResponse.json(
            { error: 'ID is required' },
            { status: 400 }
          )
        }
        footerContent.navigation.links = footerContent.navigation.links.filter(link => link.id !== id)
        await saveToFile(footerContent)
        return NextResponse.json({ success: true })

      case 'updateSocialLink':
        if (!id || !updates) {
          return NextResponse.json(
            { error: 'ID and updates are required' },
            { status: 400 }
          )
        }
        const socialIndex = footerContent.socialMedia.links.findIndex(link => link.id === id)
        if (socialIndex !== -1) {
          footerContent.socialMedia.links[socialIndex] = {
            ...footerContent.socialMedia.links[socialIndex],
            ...updates
          }
          await saveToFile(footerContent)
          return NextResponse.json({ success: true })
        }
        return NextResponse.json({ success: false })

      case 'addQuickLink':
        if (!data) {
          return NextResponse.json(
            { error: 'Link data is required' },
            { status: 400 }
          )
        }
        const newQuickLink: FooterLink = {
          ...data,
          id: `quick-${Date.now()}`,
          order: footerContent.quickLinks.links.length + 1
        }
        footerContent.quickLinks.links.push(newQuickLink)
        await saveToFile(footerContent)
        return NextResponse.json({ success: true, link: newQuickLink })

      case 'updateQuickLink':
        if (!id || !updates) {
          return NextResponse.json(
            { error: 'ID and updates are required' },
            { status: 400 }
          )
        }
        const quickIndex = footerContent.quickLinks.links.findIndex(link => link.id === id)
        if (quickIndex !== -1) {
          footerContent.quickLinks.links[quickIndex] = {
            ...footerContent.quickLinks.links[quickIndex],
            ...updates
          }
          await saveToFile(footerContent)
          return NextResponse.json({ success: true })
        }
        return NextResponse.json({ success: false })

      case 'deleteQuickLink':
        if (!id) {
          return NextResponse.json(
            { error: 'ID is required' },
            { status: 400 }
          )
        }
        footerContent.quickLinks.links = footerContent.quickLinks.links.filter(link => link.id !== id)
        await saveToFile(footerContent)
        return NextResponse.json({ success: true })

      case 'reorderLinks':
        if (!section || !data) {
          return NextResponse.json(
            { error: 'Section and links data are required' },
            { status: 400 }
          )
        }
        if (section === 'navigation') {
          footerContent.navigation.links = data
        } else if (section === 'quickLinks') {
          footerContent.quickLinks.links = data
        }
        await saveToFile(footerContent)
        return NextResponse.json({ success: true })

      case 'reset':
        footerContent = footerData as FooterContent
        await saveToFile(footerContent)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Footer API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}