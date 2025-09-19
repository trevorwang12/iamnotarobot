#!/bin/bash

# 图片压缩脚本 - 转换为webp格式
# 压缩质量设置为85，平衡质量和文件大小

echo "开始压缩图片为webp格式..."

# 创建压缩后的目录
mkdir -p public/compressed

# 压缩PNG文件
for img in public/*.png public/favicons/*.png public/assets/img/*.png; do
    if [ -f "$img" ]; then
        filename=$(basename "$img" .png)
        dir=$(dirname "$img")
        relative_dir=${dir#public/}

        # 创建对应的目录结构
        mkdir -p "public/compressed/$relative_dir"

        echo "压缩: $img"
        cwebp -q 85 "$img" -o "public/compressed/$relative_dir/${filename}.webp"

        # 显示压缩前后大小对比
        original_size=$(wc -c < "$img")
        compressed_size=$(wc -c < "public/compressed/$relative_dir/${filename}.webp")
        reduction=$(echo "scale=1; (1 - $compressed_size/$original_size) * 100" | bc -l)
        echo "  原始: ${original_size} bytes -> 压缩后: ${compressed_size} bytes (减少 ${reduction}%)"
    fi
done

# 压缩JPG/JPEG文件
for img in public/*.jpg public/*.jpeg public/favicons/*.jpg public/favicons/*.jpeg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        filename_noext=${filename%.*}
        dir=$(dirname "$img")
        relative_dir=${dir#public/}

        # 创建对应的目录结构
        mkdir -p "public/compressed/$relative_dir"

        echo "压缩: $img"
        cwebp -q 85 "$img" -o "public/compressed/$relative_dir/${filename_noext}.webp"

        # 显示压缩前后大小对比
        original_size=$(wc -c < "$img")
        compressed_size=$(wc -c < "public/compressed/$relative_dir/${filename_noext}.webp")
        reduction=$(echo "scale=1; (1 - $compressed_size/$original_size) * 100" | bc -l)
        echo "  原始: ${original_size} bytes -> 压缩后: ${compressed_size} bytes (减少 ${reduction}%)"
    fi
done

echo "压缩完成！压缩后的文件保存在 public/compressed/ 目录中"