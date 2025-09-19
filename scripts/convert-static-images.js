const fs = require('fs').promises
const path = require('path')
const sharp = require('sharp')

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const WEBP_QUALITY = 85
const WEBP_COMPRESSION_LEVEL = 6

// 需要转换的静态图片文件（排除favicon等）
const STATIC_IMAGES = [
  'shadow-milk-logo.png',
  'placeholder-logo.png',
  'placeholder-user.jpg',
  'placeholder.jpg',
  'placeholder-game.jpg',
  'assets/img/android-chrome-512x512.png'
]

async function convertStaticImages() {
  try {
    console.log('🔍 开始转换静态图片资源...')

    for (const imagePath of STATIC_IMAGES) {
      const inputPath = path.join(PUBLIC_DIR, imagePath)

      // 检查文件是否存在
      try {
        await fs.access(inputPath)
      } catch {
        console.log(`⚠️  跳过不存在的文件: ${imagePath}`)
        continue
      }

      const webpPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp')
      const outputPath = path.join(PUBLIC_DIR, webpPath)

      console.log(`🔄 转换: ${imagePath} → ${webpPath}`)

      try {
        const originalStats = await fs.stat(inputPath)

        const webpBuffer = await sharp(inputPath)
          .webp({
            quality: WEBP_QUALITY,
            effort: WEBP_COMPRESSION_LEVEL
          })
          .toBuffer()

        // 如果webp文件反而更大，保留原文件
        if (webpBuffer.length >= originalStats.size) {
          console.log(`   ⚠️  WebP文件更大 (${webpBuffer.length} vs ${originalStats.size})，保留原格式`)
          continue
        }

        await fs.writeFile(outputPath, webpBuffer)

        const compressionRatio = Math.round((1 - webpBuffer.length / originalStats.size) * 100)
        console.log(`   📏 ${originalStats.size} → ${webpBuffer.length} bytes (压缩率: ${compressionRatio}%)`)

        // 成功转换后，删除多余的webp文件（如果反而更大的话，我们已经跳过了）

      } catch (error) {
        console.log(`   ❌ 转换失败: ${error.message}`)
        continue
      }
    }

    console.log('✅ 静态图片转换完成!')

  } catch (error) {
    console.error('❌ 转换失败:', error)
    process.exit(1)
  }
}

convertStaticImages()