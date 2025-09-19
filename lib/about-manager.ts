interface AboutSection {
  id: string
  name: string
  isVisible: boolean
  order: number
  updatedAt: string
}

interface SectionOrder {
  [key: string]: number
}

export interface CustomHtmlSection {
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

const STORAGE_KEY = 'about-content'

class AboutManager {
  private content: AboutContent

  constructor() {
    this.content = this.getDefaultContent()
  }

  private async loadFromAPI(): Promise<AboutContent> {
    try {
      const response = await fetch('/api/admin/about')
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Error loading about content:', error)
    }
    return this.getDefaultContent()
  }

  private getDefaultContent(): AboutContent {
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

  // Get methods
  async getContent(): Promise<AboutContent> {
    return await this.loadFromAPI()
  }

  async getSection(sectionName: keyof AboutContent): Promise<any> {
    const content = await this.loadFromAPI()
    return content[sectionName]
  }

  // Update methods
  async updateSection(sectionName: keyof AboutContent, updates: any): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: sectionName, updates })
      })
      return response.ok
    } catch (error) {
      console.error('Error updating about section:', error)
      return false
    }
  }

  async updateSectionVisibility(sectionName: keyof AboutContent, isVisible: boolean): Promise<boolean> {
    try {
      return await this.updateSection(sectionName, { isVisible })
    } catch (error) {
      console.error('Error updating section visibility:', error)
      return false
    }
  }

  async updateSectionOrder(newOrder: SectionOrder): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'sectionOrder', updates: newOrder })
      })
      return response.ok
    } catch (error) {
      console.error('Error updating section order:', error)
      return false
    }
  }

  // Reset to defaults
  async resetToDefaults(): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      })
      return response.ok
    } catch (error) {
      console.error('Error resetting to defaults:', error)
      return false
    }
  }

  // Get sections list for admin interface
  async getSectionsList(): Promise<{ id: keyof AboutContent, name: string, isVisible: boolean, order: number }[]> {
    const content = await this.getContent()
    
    if (!content) {
      return []
    }
    
    const sections = [
      { id: 'hero' as keyof AboutContent, name: 'Hero Section', isVisible: content.hero?.isVisible || false },
      { id: 'mission' as keyof AboutContent, name: 'Mission & Values Section', isVisible: content.mission?.isVisible || false },
      { id: 'about' as keyof AboutContent, name: 'About Content Section', isVisible: content.about?.isVisible || false },
      { id: 'cta' as keyof AboutContent, name: 'Call to Action Section', isVisible: content.cta?.isVisible || false }
    ]

    // Add individual custom HTML sections
    if (Array.isArray(content.customHtmlSections)) {
      content.customHtmlSections.forEach((section, index) => {
        sections.push({
          id: `customHtmlSection_${section.id}` as keyof AboutContent,
          name: `Custom HTML: ${section.title}`,
          isVisible: section.isVisible,
          order: 100 + index
        })
      })
    }
    
    // Ensure sectionOrder exists
    const sectionOrder = content.sectionOrder || {
      hero: 0,
      mission: 1,
      about: 2,
      cta: 3
    }
    
    return sections.map(section => ({
      ...section,
      order: sectionOrder[section.id as string] || 0
    })).sort((a, b) => a.order - b.order)
  }
}

export const aboutManager = new AboutManager()
export type { AboutContent }