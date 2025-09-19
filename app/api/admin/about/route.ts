import { NextRequest, NextResponse } from 'next/server'
import { createAdminResponse, logAdminAccess } from '@/lib/admin-security'
import { promises as fs } from 'fs'
import path from 'path'

interface SectionOrder {
  [key: string]: number
}

interface CustomHtmlSection {
  id: string
  title: string
  content: string
  isVisible: boolean
}

interface AboutContent {
  hero: {
    isVisible: boolean
    title: string
    subtitle: string
    icon: string
  }
  mission: {
    isVisible: boolean
    title: string
    cards: {
      mission: {
        isVisible: boolean
        title: string
        description: string
        icon: string
      }
      team: {
        isVisible: boolean
        title: string
        description: string
        icon: string
      }
      values: {
        isVisible: boolean
        title: string
        description: string
        icon: string
      }
    }
  }
  about: {
    isVisible: boolean
    title: string
    content: {
      description: string
      features: {
        title: string
        items: Array<{
          title: string
          description: string
          color: string
        }>
      }
      vision: {
        title: string
        content: string
      }
      contact: {
        title: string
        content: string
      }
    }
  }
  cta: {
    isVisible: boolean
    title: string
    description: string
    buttonText: string
    buttonLink: string
  }
  customHtmlSections: CustomHtmlSection[]
  sectionOrder: SectionOrder
}

// 内存中的About内容，服务重启后会恢复默认值
let aboutContent: AboutContent = getDefaultContent()

// 从文件加载最新数据
async function loadFromFile(): Promise<AboutContent> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'about-content.json')
    const fileContent = await fs.readFile(filePath, 'utf8')
    const loadedData = JSON.parse(fileContent)
    console.log('About data loaded from file:', filePath)
    return loadedData
  } catch (error) {
    console.log('Failed to load about data from file, using default:', error)
    return getDefaultContent()
  }
}

// 将数据保存到 JSON 文件
async function saveToFile(data: AboutContent) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'about-content.json')
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
    console.log('Data saved to file:', filePath)
  } catch (error) {
    console.error('Failed to save data to file:', error)
    // 不抛出错误，让内存更新继续进行
  }
}

function getDefaultContent(): AboutContent {
  return {
    hero: {
      isVisible: true,
      title: "GAMES",
      subtitle: "Providing the highest quality online gaming experience for players worldwide",
      icon: "Gamepad2"
    },
    mission: {
      isVisible: true,
      title: "Our Mission & Values",
      cards: {
        mission: {
          isVisible: true,
          title: "Our Mission",
          description: "To create a safe, fun, and user-friendly online gaming platform where everyone can enjoy gaming.",
          icon: "Target"
        },
        team: {
          isVisible: true,
          title: "Our Team",
          description: "A professional team of experienced game developers and designers committed to providing the best user experience.",
          icon: "Users"
        },
        values: {
          isVisible: true,
          title: "Our Values",
          description: "User-centered focus on innovation, quality and community building to connect the world through gaming.",
          icon: "Heart"
        }
      }
    },
    about: {
      isVisible: true,
      title: "About Us",
      content: {
        description: "GAMES was founded in 2024 as an innovative company focused on online gaming experiences. Our platform brings together quality games from around the world, from classic arcade games to the latest creative works, providing diverse choices for players of all ages and interests.",
        features: {
          title: "Our Features",
          items: [
            {
              title: "Curated Game Library",
              description: "Every game is carefully selected to ensure quality and entertainment value",
              color: "blue"
            },
            {
              title: "No Download Required",
              description: "All games run directly in your browser",
              color: "green"
            },
            {
              title: "Safe & Secure",
              description: "Strict security measures protect user privacy and data",
              color: "purple"
            },
            {
              title: "Regular Updates",
              description: "New games added regularly to keep content fresh",
              color: "orange"
            }
          ]
        },
        vision: {
          title: "Our Vision",
          content: "We hope to create a gathering place for global gaming enthusiasts where everyone can find their own gaming joy. Through continuous technological innovation and content optimization, we strive to become the most popular online gaming platform."
        },
        contact: {
          title: "Contact Us",
          content: "If you have any questions, suggestions or partnership interests, please feel free to contact us through our contact page. We value feedback from every user, as it drives our continuous improvement."
        }
      }
    },
    cta: {
      isVisible: true,
      title: "Ready to Start Gaming?",
      description: "Explore our exciting world of games and discover your next favorite game!",
      buttonText: "Start Gaming",
      buttonLink: "/"
    },
    customHtmlSections: [],
    sectionOrder: {
      hero: 0,
      mission: 1,
      about: 2,
      cta: 3
    }
  }
}

// Helper function to ensure content structure is correct
function ensureContentStructure(): void {
  // Ensure sectionOrder exists
  if (!aboutContent.sectionOrder) {
    aboutContent.sectionOrder = {
      hero: 0,
      mission: 1,
      about: 2,
      cta: 3
    }
  }
  
  // Ensure customHtmlSections is an array
  if (!aboutContent.customHtmlSections) {
    aboutContent.customHtmlSections = []
  } else if (!Array.isArray(aboutContent.customHtmlSections)) {
    // Convert object format to array format
    const sectionsObject = aboutContent.customHtmlSections as any
    aboutContent.customHtmlSections = Object.values(sectionsObject)
  }
}

export async function GET() {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/about', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/about', true)
  try {
    aboutContent = await loadFromFile()
    ensureContentStructure()
    return NextResponse.json(aboutContent)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch about content' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/about', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/about', true)
  try {
    // Load latest data from file before making changes
    aboutContent = await loadFromFile()
    
    const { section, updates } = await request.json()
    ensureContentStructure()
    
    if (section === 'sectionOrder') {
      // Handle section order update
      aboutContent.sectionOrder = updates
    } else {
      // Handle regular section updates
      if (section === 'customHtmlSections') {
        // Special handling for customHtmlSections array
        aboutContent.customHtmlSections = updates
      } else if (!aboutContent[section as keyof AboutContent]) {
        return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
      } else {
        aboutContent[section as keyof AboutContent] = {
          ...aboutContent[section as keyof AboutContent],
          ...updates
        }
      }
    }
    
    // 保存到文件
    await saveToFile(aboutContent)
    
    return NextResponse.json(section === 'sectionOrder' ? aboutContent.sectionOrder : aboutContent[section as keyof AboutContent])
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update about content' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = createAdminResponse()
  if (adminCheck) {
    logAdminAccess('/api/admin/about', false)
    return NextResponse.json(adminCheck, { status: adminCheck.status })
  }

  logAdminAccess('/api/admin/about', true)
  try {
    const { action } = await request.json()
    
    if (action === 'reset') {
      aboutContent = getDefaultContent()
      await saveToFile(aboutContent)
      return NextResponse.json(aboutContent)
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}