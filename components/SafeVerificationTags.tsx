// 安全的搜索引擎验证标签
import { SeoService } from '@/lib/seo-service'
import { DataService } from '@/lib/data-service'

export default async function SafeVerificationTags() {
  const verificationTags = await SeoService.getVerificationTags()
  
  // 获取AdSense验证脚本
  let adsenseScript = null
  try {
    const ads = await DataService.getAds()
    const adsenseVerificationAd = ads.find((ad: any) => 
      ad.position === 'adsense-verification' && 
      ad.isActive && 
      ad.htmlContent?.includes('pagead2.googlesyndication.com')
    )
    
    if (adsenseVerificationAd?.htmlContent) {
      // 提取AdSense client ID
      const clientMatch = adsenseVerificationAd.htmlContent.match(/client=ca-pub-(\d+)/)
      if (clientMatch) {
        adsenseScript = `ca-pub-${clientMatch[1]}`
      }
    }
  } catch (error) {
    console.warn('Failed to get AdSense verification:', error)
  }
  
  return (
    <>
      {verificationTags.yandex && (
        <meta name="yandex-verification" content={verificationTags.yandex} />
      )}
      {verificationTags.baidu && (
        <meta name="baidu-site-verification" content={verificationTags.baidu} />
      )}
      {adsenseScript && (
        <meta name="google-adsense-account" content={adsenseScript} />
      )}
    </>
  )
}