// Type definitions for footer management
export interface FooterLink {
  id: string
  label: string
  url: string
  isVisible: boolean
  isExternal: boolean
  order: number
}

export interface SocialLink {
  id: string
  platform: string
  url: string
  icon: string
  isVisible: boolean
  order: number
}

export interface FooterBranding {
  showLogo: boolean
  logoText: string
  logoIcon: string
  description: string
  customDescription: string
}

export interface FooterNavigation {
  isVisible: boolean
  title: string
  showTitle: boolean
  layout: 'horizontal' | 'vertical'
  links: FooterLink[]
}

export interface FooterSocialMedia {
  isVisible: boolean
  title: string
  links: SocialLink[]
}

export interface FooterQuickLinks {
  isVisible: boolean
  title: string
  links: FooterLink[]
}

export interface FooterNewsletter {
  isVisible: boolean
  title: string
  description: string
  placeholder: string
  buttonText: string
}

export interface FooterCopyright {
  isVisible: boolean
  text: string
  customText: string
}

export interface FooterFriendlyLinks {
  isVisible: boolean
}

export interface FooterLayout {
  columns: number
  backgroundColor: string
  textColor: string
  linkHoverColor: string
  borderColor: string
  spacing: 'compact' | 'normal' | 'spacious'
}

export interface FooterContent {
  branding: FooterBranding
  navigation: FooterNavigation
  socialMedia: FooterSocialMedia
  quickLinks: FooterQuickLinks
  newsletter: FooterNewsletter
  copyright: FooterCopyright
  friendlyLinks: FooterFriendlyLinks
  layout: FooterLayout
}