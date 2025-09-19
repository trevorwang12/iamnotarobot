import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import HydrationErrorBoundary from '@/components/HydrationErrorBoundary'
import HydrationFix from '@/components/HydrationFix'
import SafePreloadManager from '@/components/optimization/SafePreloadManager'
import { seoManager } from '@/lib/seo-manager'
import './globals.css'

// 动态生成metadata
export async function generateMetadata(): Promise<Metadata> {
  // 尝试从SEO API获取设置，fallback到默认值
  let seoSettings = {
    siteName: 'GAMES',
    siteDescription: 'Best Online Gaming Platform - Play hundreds of free browser games',
    siteUrl: 'https://yourgamesite.com',
    siteLogo: '/placeholder-logo.png',
    favicon: '/favicon.ico',
    keywords: ['online games', 'browser games', 'free games'],
    author: 'Gaming Platform',
    twitterHandle: '@yourgames',
    ogImage: '/og-image.png',
    ogTitle: 'GAMES - Best Free Online Games',
    ogDescription: 'Play the best free online games. No download required!',
    metaTags: {
      viewport: 'width=device-width, initial-scale=1.0',
      themeColor: '#475569'
    }
  }

  try {
    // 在服务端直接从文件系统读取SEO设置
    const fs = require('fs').promises
    const path = require('path')
    const seoFilePath = path.join(process.cwd(), 'data', 'seo-settings.json')
    
    try {
      const fileContent = await fs.readFile(seoFilePath, 'utf8')
      const data = JSON.parse(fileContent)
      if (data.seoSettings) {
        seoSettings = { ...seoSettings, ...data.seoSettings }
      }
    } catch (fileError) {
      // 文件不存在或解析失败，使用默认设置
      console.log('Using default SEO settings')
    }
  } catch (error) {
    console.error('Failed to load SEO settings:', error)
    // 使用默认设置
  }

  return {
    title: seoSettings.siteName,
    description: seoSettings.siteDescription,
    keywords: seoSettings.keywords,
    authors: [{ name: seoSettings.author }],
    generator: 'Next.js',
    metadataBase: new URL(seoSettings.siteUrl),
    alternates: {
      canonical: seoSettings.canonicalUrl || seoSettings.siteUrl,
    },
    openGraph: {
      title: seoSettings.ogTitle || seoSettings.siteName,
      description: seoSettings.ogDescription || seoSettings.siteDescription,
      url: seoSettings.siteUrl,
      siteName: seoSettings.siteName,
      images: [{
        url: seoSettings.ogImage,
        width: 1200,
        height: 630,
        alt: seoSettings.siteName,
      }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoSettings.ogTitle || seoSettings.siteName,
      description: seoSettings.ogDescription || seoSettings.siteDescription,
      site: seoSettings.twitterHandle,
      images: [seoSettings.ogImage],
    },
    icons: {
      icon: seoSettings.favicon,
      apple: seoSettings.siteLogo,
    },
    other: {
      'theme-color': seoSettings.metaTags.themeColor,
      'apple-mobile-web-app-title': seoSettings.metaTags.appleMobileWebAppTitle,
      'mobile-web-app-capable': seoSettings.metaTags.appleMobileWebAppCapable || 'yes',
      'google-site-verification': seoSettings.googleSearchConsoleId,
    }
  }
}

// Analytics组件 - 支持完整tracking code和ID
async function AnalyticsScript() {
  let googleAnalyticsId = null
  let googleAnalyticsTrackingCode = null
  
  try {
    const fs = require('fs').promises
    const path = require('path')
    const seoFilePath = path.join(process.cwd(), 'data', 'seo-settings.json')
    
    try {
      const fileContent = await fs.readFile(seoFilePath, 'utf8')
      const data = JSON.parse(fileContent)
      googleAnalyticsId = data.seoSettings?.googleAnalyticsId
      googleAnalyticsTrackingCode = data.seoSettings?.googleAnalyticsTrackingCode
    } catch (error) {
      // SEO文件不存在，使用默认值
    }
  } catch (error) {
    console.error('Failed to load Analytics settings:', error)
  }
  
  // 优先使用完整的tracking code，如果没有则使用ID生成代码
  if (googleAnalyticsTrackingCode && googleAnalyticsTrackingCode.trim() !== '') {
    return (
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `document.head.insertAdjacentHTML('beforeend', '${googleAnalyticsTrackingCode.replace(/'/g, "\\'")}');` }} />
    )
  }
  
  if (!googleAnalyticsId || googleAnalyticsId === 'GA_MEASUREMENT_ID' || googleAnalyticsId === 'G-XXXXXXXXXX') {
    return null
  }
  
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAnalyticsId}');
          `,
        }}
      />
    </>
  )
}

// 自定义Head标签组件
async function CustomHeadTags() {
  let customHeadTags = null
  let googleSearchConsoleHtmlTag = null
  let yandexWebmasterToolsId = null
  let baiduWebmasterToolsId = null
  
  try {
    const fs = require('fs').promises
    const path = require('path')
    const seoFilePath = path.join(process.cwd(), 'data', 'seo-settings.json')
    
    try {
      const fileContent = await fs.readFile(seoFilePath, 'utf8')
      const data = JSON.parse(fileContent)
      const seoSettings = data.seoSettings || {}
      customHeadTags = seoSettings.customHeadTags
      googleSearchConsoleHtmlTag = seoSettings.googleSearchConsoleHtmlTag
      yandexWebmasterToolsId = seoSettings.yandexWebmasterToolsId
      baiduWebmasterToolsId = seoSettings.baiduWebmasterToolsId
    } catch (error) {
      // SEO文件不存在
    }
  } catch (error) {
    console.error('Failed to load custom head tags:', error)
  }
  
  return (
    <>
      {/* Google Search Console HTML Meta Tag */}
      {googleSearchConsoleHtmlTag && googleSearchConsoleHtmlTag.trim() !== '' && (
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `document.head.insertAdjacentHTML('beforeend', '${googleSearchConsoleHtmlTag.replace(/'/g, "\\'")}');` }} />
      )}
      
      {/* Yandex Webmaster Tools */}
      {yandexWebmasterToolsId && yandexWebmasterToolsId.trim() !== '' && (
        <meta suppressHydrationWarning name="yandex-verification" content={yandexWebmasterToolsId} />
      )}
      
      {/* Baidu Webmaster Tools */}
      {baiduWebmasterToolsId && baiduWebmasterToolsId.trim() !== '' && (
        <meta suppressHydrationWarning name="baidu-site-verification" content={baiduWebmasterToolsId} />
      )}
      
      {/* Custom Head Tags */}
      {customHeadTags && customHeadTags.trim() !== '' && (
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `document.head.insertAdjacentHTML('beforeend', '${customHeadTags.replace(/'/g, "\\'")}');` }} />
      )}
    </>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        <AnalyticsScript />
        <CustomHeadTags />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* Resource hints for better performance */}
        <link rel="preload" href="/_next/static/css/app/layout.css" as="style" />
        <link rel="preload" as="font" type="font/woff2" href="/_next/static/media/geist-sans.woff2" crossOrigin="anonymous" />
        <link rel="modulepreload" href="/_next/static/chunks/main.js" />
        
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Critical CSS to prevent layout shift */
              html, body { 
                margin: 0; 
                padding: 0; 
                font-display: swap;
                -webkit-text-size-adjust: 100%;
                text-rendering: optimizeLegibility;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              .max-w-7xl { max-width: 80rem; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .px-4 { padding-left: 1rem; padding-right: 1rem; }
              .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
              .mb-8 { margin-bottom: 2rem; }
              .mt-12 { margin-top: 3rem; }
              .aspect-ratio-4-3 { aspect-ratio: 4/3; }
              footer { height: auto; min-height: 200px; }
              /* Prevent invisible text during font load */
              .font-sans { font-display: swap; }
              /* Improve image loading */
              img { 
                max-width: 100%; 
                height: auto;
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
              }
              /* Reduce CLS for grid layouts */
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
              .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
              @media (min-width: 640px) {
                .sm\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
              }
              @media (min-width: 768px) {
                .md\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
              }
              /* Optimize animations */
              * {
                will-change: auto;
              }
              .group:hover .group-hover\\:scale-105 {
                transform: scale(1.05);
              }
            `,
          }}
        />
      </head>
      <body 
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}
        suppressHydrationWarning={true}
      >
        <div id="__next" suppressHydrationWarning={true}>
          <HydrationErrorBoundary>
            <HydrationFix />
            <SafePreloadManager />
            {children}
          </HydrationErrorBoundary>
        </div>
      </body>
    </html>
  )
}
