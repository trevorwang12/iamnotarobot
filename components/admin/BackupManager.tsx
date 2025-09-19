"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Upload, Loader2, AlertCircle, CheckCircle, Database } from 'lucide-react'

interface BackupData {
  games: any[]
  categories: any[]
  seo: any
  homepage: any
  aboutContent?: any
  ads: any
  recommendations: any
  featuredGames: any
  footer: any
  friendlyLinks: any
  sitemapSettings?: any
  backupDate: string
  backupVersion?: string
  stats?: {
    totalGames: number
    totalCategories: number
    totalFriendlyLinks: number
    seoFieldsIncluded: string[]
  }
}

export default function BackupManager() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [importInstructions, setImportInstructions] = useState<string[] | null>(null)
  const [restoreResult, setRestoreResult] = useState<{
    autoRestored: boolean
    restoreErrors: string[]
    stats?: any
  } | null>(null)

  // 导出备份
  const handleExport = async () => {
    setIsExporting(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'GET'
      })
      
      if (!response.ok) {
        throw new Error('Failed to create backup')
      }
      
      // 获取文件内容
      const backupData = await response.text()
      
      // 创建下载链接
      const blob = new Blob([backupData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `site-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setMessage({ type: 'success', text: 'Backup exported successfully!' })
    } catch (error) {
      console.error('Export error:', error)
      setMessage({ type: 'error', text: 'Failed to export backup' })
    } finally {
      setIsExporting(false)
    }
  }

  // 导入备份（验证并尝试自动恢复）
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsImporting(true)
    setMessage(null)
    setImportInstructions(null)
    setRestoreResult(null)
    
    try {
      const text = await file.text()
      const backupData: BackupData = JSON.parse(text)
      
      // 验证备份数据结构
      if (!backupData.games || !backupData.categories || !backupData.backupDate) {
        throw new Error('Invalid backup file format')
      }
      
      // 发送到服务器进行验证和恢复
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: text
      })
      
      if (!response.ok) {
        throw new Error('Failed to process backup')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message 
        })
        setImportInstructions(result.instructions || [])
        setRestoreResult({
          autoRestored: result.autoRestored || false,
          restoreErrors: result.restoreErrors || [],
          stats: result.stats
        })
      } else {
        throw new Error(result.error || 'Import failed')
      }
      
    } catch (error) {
      console.error('Import error:', error)
      setMessage({ type: 'error', text: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
    } finally {
      setIsImporting(false)
      // 清空文件输入
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Data Backup & Restore</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Export Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Export Complete Backup</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download a comprehensive backup including games, categories, SEO settings, Analytics codes, custom head tags, and all site configurations. This backup is compatible with the latest system features.
              </p>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center space-x-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isExporting ? 'Exporting...' : 'Export Backup'}</span>
              </Button>
            </div>
          </div>

          <div className="border-t pt-6">
            {/* Import Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Import & Restore Backup</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a previously exported backup file. In local/development environment, data will be automatically restored to files. In production, manual file updates are required.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    disabled={isImporting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    id="backup-file"
                  />
                  <Button
                    asChild
                    disabled={isImporting}
                    variant="outline"
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <label htmlFor="backup-file">
                      {isImporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{isImporting ? 'Processing...' : 'Choose Backup File'}</span>
                    </label>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {message && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Import Instructions and Auto-Restore Status */}
          {importInstructions && (
            <Alert className={
              restoreResult?.autoRestored 
                ? "border-green-200 bg-green-50" 
                : "border-blue-200 bg-blue-50"
            }>
              {restoreResult?.autoRestored ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-blue-600" />
              )}
              <AlertDescription className={
                restoreResult?.autoRestored ? "text-green-800" : "text-blue-800"
              }>
                <div className="space-y-3">
                  {restoreResult?.autoRestored && (
                    <div className="space-y-2">
                      <p className="font-semibold text-lg">🎉 Auto-Restore Completed!</p>
                      {restoreResult?.stats && (
                        <div className="bg-green-100 p-3 rounded border text-sm">
                          <p className="font-medium mb-2">Restored Data Summary:</p>
                          <ul className="space-y-1">
                            <li>• {restoreResult.stats.games} games</li>
                            <li>• {restoreResult.stats.categories} categories</li>
                            <li>• {restoreResult.stats.friendlyLinks} friendly links</li>
                            <li>• SEO & Analytics settings</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {restoreResult?.restoreErrors && restoreResult.restoreErrors.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-semibold text-red-700">⚠️ Restore Errors:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                        {restoreResult.restoreErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <p className="font-semibold">
                      {restoreResult?.autoRestored ? "Next Steps:" : "Manual Restore Instructions:"}
                    </p>
                    <div className="bg-gray-100 p-3 rounded border">
                      <pre className="text-xs whitespace-pre-wrap font-mono">
                        {importInstructions.join('\n')}
                      </pre>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Information */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Important Information:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li><strong>Complete Data Coverage:</strong> Games, categories, SEO settings, Analytics tracking codes</li>
                  <li><strong>Analytics Integration:</strong> Google Analytics, Search Console, Yandex, Baidu configurations</li>
                  <li><strong>Custom Code Support:</strong> HTML verification tags, custom head tags, tracking scripts</li>
                  <li><strong>Cloud Compatible:</strong> Memory-based storage for seamless deployment</li>
                  <li><strong>Version Control:</strong> Backup format versioning for compatibility</li>
                  <li><strong>Manual Restore:</strong> JSON file updates required for permanent changes</li>
                  <li><strong>Best Practice:</strong> Export backups before major configuration changes</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}