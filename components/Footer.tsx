'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Gamepad2, Settings, Twitter, Facebook, Instagram, Youtube, MessageCircle } from "lucide-react"
import FriendlyLinks from './FriendlyLinks'
import type { FooterContent } from '@/lib/footer-manager'

interface SEOSettings {
  siteName?: string
  siteDescription?: string
}

const socialIcons = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  messageCircle: MessageCircle,
  gamepad2: Gamepad2,
  settings: Settings
}

export default function Footer() {
  const [seoSettings, setSeoSettings] = useState<SEOSettings>({
    siteName: 'GAMES',
    siteDescription: 'Best Online Gaming Platform'
  })
  const [footerContent, setFooterContent] = useState<FooterContent | null>(null)

  useEffect(() => {
    const loadSEOSettings = async () => {
      try {
        const response = await fetch('/api/seo')
        if (response.ok) {
          const data = await response.json()
          if (data.seoSettings) {
            setSeoSettings({
              siteName: data.seoSettings.siteName || 'GAMES',
              siteDescription: data.seoSettings.siteDescription || 'Best Online Gaming Platform'
            })
          }
        }
      } catch (error) {
        console.log('SEO settings load error:', error)
      }
    }

    const loadFooterContent = async () => {
      try {
        const response = await fetch('/api/footer')
        const content = response.ok ? await response.json() : null
        console.log('Footer content loaded:', content?.copyright)
        setFooterContent(content)
      } catch (error) {
        console.log('Footer content load error:', error)
      }
    }

    loadSEOSettings()
    loadFooterContent()

    // 监听设置更新
    const handleSEOUpdate = async () => {
      await loadSEOSettings()
    }

    const handleFooterUpdate = async () => {
      console.log('Footer update event received, reloading content...')
      await loadFooterContent()
    }

    window.addEventListener('seoSettingsUpdated', handleSEOUpdate)
    window.addEventListener('footerUpdated', handleFooterUpdate)

    return () => {
      window.removeEventListener('seoSettingsUpdated', handleSEOUpdate)
      window.removeEventListener('footerUpdated', handleFooterUpdate)
    }
  }, [])

  // Get computed values
  const displaySiteName = footerContent?.branding.logoText || seoSettings.siteName
  const displayDescription = footerContent?.branding.customDescription || footerContent?.branding.description || seoSettings.siteDescription
  
  // Get visible links directly from footerContent to avoid dependency issues
  const visibleNavLinks = footerContent ? 
    footerContent.navigation.links
      .filter(link => link.isVisible)
      .sort((a, b) => a.order - b.order) : []
  
  const visibleSocialLinks = footerContent ? 
    footerContent.socialMedia.links
      .filter(link => link.isVisible && link.url.trim() !== '')
      .sort((a, b) => a.order - b.order) : []
  
  const visibleQuickLinks = footerContent ? 
    footerContent.quickLinks.links
      .filter(link => link.isVisible)
      .sort((a, b) => a.order - b.order) : []
  
  // Get dynamic classes based on footer content
  const footerClasses = footerContent 
    ? `bg-${footerContent.layout.backgroundColor} border-t border-${footerContent.layout.borderColor} py-8 mt-12`
    : "bg-gray-100 border-t border-gray-200 py-8 mt-12"
  
  const textColorClass = footerContent ? `text-${footerContent.layout.textColor}` : "text-gray-600"
  const linkHoverClass = footerContent ? `hover:text-${footerContent.layout.linkHoverColor}` : "hover:text-blue-600"

  // Get icon component
  const IconComponent = footerContent?.branding.logoIcon 
    ? socialIcons[footerContent.branding.logoIcon as keyof typeof socialIcons] || Gamepad2
    : Gamepad2

  return (
    <footer className={footerClasses}>
      <div className="max-w-6xl mx-auto px-4">
        <div className={`grid gap-8 ${footerContent?.layout.columns === 1 ? 'grid-cols-1' : footerContent?.layout.columns === 2 ? 'grid-cols-1 md:grid-cols-2' : footerContent?.layout.columns === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
          
          {/* Branding Section */}
          {footerContent?.branding.showLogo && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconComponent className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-bold text-gray-800">{displaySiteName}</span>
              </div>
              <p className={`text-sm ${textColorClass}`}>{displayDescription}</p>
            </div>
          )}
          
          {/* Navigation Links */}
          {footerContent?.navigation.isVisible && visibleNavLinks.length > 0 && (
            <div className="space-y-3">
              {footerContent.navigation.showTitle && (
                <h3 className="font-semibold text-gray-800">{footerContent.navigation.title}</h3>
              )}
              <nav className={
                footerContent.navigation.layout === 'horizontal' 
                  ? "flex flex-wrap gap-x-4 gap-y-2" 
                  : "flex flex-col space-y-2"
              }>
                {visibleNavLinks.map((link) => (
                  <Link 
                    key={link.id}
                    href={link.url} 
                    className={`text-sm ${textColorClass} ${linkHoverClass} transition-colors`}
                    {...(link.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
          
          {/* Quick Links */}
          {footerContent?.quickLinks.isVisible && visibleQuickLinks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">{footerContent.quickLinks.title}</h3>
              <nav className="flex flex-col space-y-2">
                {visibleQuickLinks.map((link) => (
                  <Link 
                    key={link.id}
                    href={link.url} 
                    className={`text-sm ${textColorClass} ${linkHoverClass} transition-colors`}
                    {...(link.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
          
          {/* Social Media Links */}
          {footerContent?.socialMedia.isVisible && visibleSocialLinks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">{footerContent.socialMedia.title}</h3>
              <div className="flex space-x-3">
                {visibleSocialLinks.map((link) => {
                  const SocialIcon = socialIcons[link.icon as keyof typeof socialIcons]
                  return SocialIcon ? (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${textColorClass} ${linkHoverClass} transition-colors`}
                    >
                      <SocialIcon className="w-5 h-5" />
                    </a>
                  ) : null
                })}
              </div>
            </div>
          )}
          
          {/* Newsletter */}
          {footerContent?.newsletter.isVisible && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">{footerContent.newsletter.title}</h3>
              <p className={`text-sm ${textColorClass}`}>{footerContent.newsletter.description}</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder={footerContent.newsletter.placeholder}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-r-lg hover:bg-blue-700 transition-colors">
                  {footerContent.newsletter.buttonText}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom Section */}
        <div className={`border-t border-${footerContent?.layout.borderColor || 'gray-200'} mt-6 pt-4 space-y-4`}>
          {/* Friendly Links */}
          {footerContent?.friendlyLinks.isVisible && <FriendlyLinks />}
          
          {/* Copyright */}
          {footerContent?.copyright.isVisible && (
            <div className="text-center text-sm text-gray-500">
              <p>
                {footerContent.copyright.customText || 
                 footerContent.copyright.text.replace('{siteName}', displaySiteName || 'GAMES')}
              </p>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}