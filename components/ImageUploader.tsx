"use client"

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Image as ImageIcon, X, ExternalLink, Loader2 } from "lucide-react"

interface ImageUploaderProps {
  label?: string
  value: string
  onChange: (url: string) => void
  accept?: string
  maxSize?: number // in MB
  placeholder?: string
  required?: boolean
}

export default function ImageUploader({
  label = "Image",
  value,
  onChange,
  accept = "image/*",
  maxSize = 5,
  placeholder = "Enter image URL or upload a file",
  required = false
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(value)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理URL输入变化
  const handleUrlChange = (url: string) => {
    setError('')
    setPreviewUrl(url)
    onChange(url)
  }

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token-here'
        },
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const uploadedUrl = result.url
        setPreviewUrl(uploadedUrl)
        onChange(uploadedUrl)
      } else {
        setError(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload file')
    } finally {
      setUploading(false)
      // 清除文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  // 清除图片
  const clearImage = () => {
    setPreviewUrl('')
    onChange('')
    setError('')
  }

  // 在新窗口中打开图片
  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank')
    }
  }

  return (
    <div className="space-y-3">
      {/* 标签 */}
      <Label htmlFor={`image-input-${label}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {/* URL输入框 */}
      <div className="flex gap-2">
        <Input
          id={`image-input-${label}`}
          type="url"
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileSelect}
          disabled={uploading}
          className="shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearImage}
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 错误信息 */}
      {error && (
        <Alert className="border-red-500">
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* 图片预览 */}
      {previewUrl && (
        <div className="relative group">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-48 rounded-lg shadow-sm mx-auto"
                onError={() => setError('Failed to load image')}
              />
              
              {/* 覆盖层 - 悬停时显示 */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={openInNewTab}
                    className="bg-white hover:bg-gray-100"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={clearImage}
                    className="bg-white hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* 图片信息 */}
          <div className="text-xs text-gray-500 mt-2 text-center">
            <span className="flex items-center justify-center gap-1">
              <ImageIcon className="w-3 h-3" />
              Image preview
            </span>
          </div>
        </div>
      )}

      {/* 上传提示 */}
      <div className="text-xs text-gray-500">
        <p>• Supported formats: JPEG, PNG, GIF, WebP</p>
        <p>• Maximum file size: {maxSize}MB</p>
        <p>• You can either paste a URL or upload a file</p>
      </div>
    </div>
  )
}