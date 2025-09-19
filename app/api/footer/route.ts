import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Public API to get footer content (no admin restrictions)
// 公共API获取页脚内容（无管理员限制）

interface FooterLink {
  id: string
  label: string
  url: string
  isVisible: boolean
  isExternal: boolean
  order: number
}

interface SocialLink {
  id: string
  platform: string
  url: string
  icon: string
  isVisible: boolean
  order: number
}

interface FooterContent {
  branding: {
    showLogo: boolean
    logoText: string
    logoIcon: string
    description: string
    customDescription: string
  }
  navigation: {
    isVisible: boolean
    title: string
    showTitle: boolean
    layout: string
    links: FooterLink[]
  }
  socialMedia: {
    isVisible: boolean
    title: string
    links: SocialLink[]
  }
  quickLinks: {
    isVisible: boolean
    title: string
    links: FooterLink[]
  }
  newsletter: {
    isVisible: boolean
    title: string
    description: string
    placeholder: string
    buttonText: string
  }
  copyright: {
    isVisible: boolean
    text: string
    customText: string
  }
  friendlyLinks: {
    isVisible: boolean
  }
  layout: {
    columns: number
    backgroundColor: string
    textColor: string
    linkHoverColor: string
    borderColor: string
    spacing: string
  }
}

function getDefaultFooter(): FooterContent {
  return {
    branding: {
      showLogo: true,
      logoText: "GAMES",
      logoIcon: "gamepad2",
      description: "Best free online games platform",
      customDescription: ""
    },
    navigation: {
      isVisible: true,
      title: "Quick Links",
      showTitle: true,
      layout: "horizontal",
      links: [
        {
          id: "about",
          label: "About Us",
          url: "/about",
          isVisible: true,
          isExternal: false,
          order: 1
        },
        {
          id: "privacy",
          label: "Privacy Policy",
          url: "/privacy",
          isVisible: true,
          isExternal: false,
          order: 2
        },
        {
          id: "terms",
          label: "Terms of Service",
          url: "/terms",
          isVisible: true,
          isExternal: false,
          order: 3
        },
        {
          id: "contact",
          label: "Contact Us",
          url: "/contact",
          isVisible: true,
          isExternal: false,
          order: 4
        }
      ]
    },
    socialMedia: {
      isVisible: false,
      title: "Follow Us",
      links: []
    },
    quickLinks: {
      isVisible: false,
      title: "Quick Links",
      links: []
    },
    newsletter: {
      isVisible: false,
      title: "Stay Updated",
      description: "Get the latest gaming news and updates",
      placeholder: "Enter your email",
      buttonText: "Subscribe"
    },
    copyright: {
      isVisible: true,
      text: "© 2025 {siteName}. All rights reserved.",
      customText: ""
    },
    friendlyLinks: {
      isVisible: true
    },
    layout: {
      columns: 2,
      backgroundColor: "gray-100",
      textColor: "gray-600",
      linkHoverColor: "blue-600",
      borderColor: "gray-200",
      spacing: "normal"
    }
  }
}

async function loadFromFile(): Promise<FooterContent> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'footer.json')
    const fileContent = await fs.readFile(filePath, 'utf8')
    const loadedData = JSON.parse(fileContent)
    console.log('Footer data loaded from file:', filePath)
    return loadedData
  } catch (error) {
    console.log('Failed to load footer data from file, using default:', error)
    return getDefaultFooter()
  }
}

export async function GET() {
  try {
    const footerContent = await loadFromFile()
    return NextResponse.json(footerContent)
  } catch (error) {
    console.error('GET footer error:', error)
    return NextResponse.json(getDefaultFooter(), { status: 200 })
  }
}