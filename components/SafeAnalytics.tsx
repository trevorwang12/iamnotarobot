// 安全的Analytics组件 - 只支持标准GA，拒绝自定义脚本
import Script from 'next/script'
import { SeoService } from '@/lib/seo-service'

export default async function SafeAnalytics() {
  const gaId = await SeoService.getAnalyticsId()
  
  // 没有有效的GA ID，不加载任何脚本
  if (!gaId) return null
  
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />
    </>
  )
}