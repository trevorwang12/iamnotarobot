"use client"

import { useEffect, useState } from 'react'
import AdSlot from '@/components/SafeAdSlot'

export default function AdTestPage() {
  const [testMode, setTestMode] = useState(false)
  const [apiData, setApiData] = useState<any>(null)
  const [testApiData, setTestApiData] = useState<any>(null)

  useEffect(() => {
    // Load both APIs for comparison
    const loadData = async () => {
      try {
        const [realAds, testAds] = await Promise.all([
          fetch('/api/ads').then(r => r.json()),
          fetch('/api/test-simple-ad').then(r => r.json())
        ])
        setApiData(realAds)
        setTestApiData(testAds)
      } catch (error) {
        console.error('Failed to load ad data:', error)
      }
    }
    loadData()
  }, [])

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>广告测试页面 / Ad Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setTestMode(!testMode)}
          style={{
            background: testMode ? '#28a745' : '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {testMode ? '✅ 使用测试广告 (Test Ads)' : '🔄 使用真实广告 (Real Ads)'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        <div>
          <h2>主内容区 / Main Content</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>直接HTML测试 (绕过React组件)</h3>
            <div 
              style={{ border: '2px solid red', padding: '10px', marginBottom: '10px' }}
              dangerouslySetInnerHTML={{ 
                __html: "<div style='background: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 8px;'><h3>🔥 DIRECT HTML TEST</h3><p>This bypasses React component</p></div>" 
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>Header 广告位</h3>
            <AdSlot position="header" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Hero Bottom 广告位</h3>
            <AdSlot position="hero-bottom" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Content Top 广告位</h3>
            <AdSlot position="content-top" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Content Bottom 广告位</h3>
            <AdSlot position="content-bottom" />
          </div>
        </div>

        <div>
          <h2>侧边栏 / Sidebar</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>Sidebar 广告位</h3>
            <AdSlot position="sidebar" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Recommendations Top 广告位</h3>
            <AdSlot position="recommendations-top" />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h2>API 数据对比 / API Data Comparison</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3>真实广告 API (/api/ads)</h3>
            <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '300px' }}>
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3>测试广告 API (/api/test-simple-ad)</h3>
            <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '300px' }}>
              {JSON.stringify(testApiData, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', border: '1px solid #ffd60a', borderRadius: '8px' }}>
        <h3>🔍 调试信息 / Debug Info</h3>
        <p><strong>当前模式:</strong> {testMode ? '测试广告模式' : '真实广告模式'}</p>
        <p><strong>环境:</strong> {process.env.NODE_ENV}</p>
        <p><strong>调试模式:</strong> {process.env.NEXT_PUBLIC_DEBUG_ADS || 'undefined'}</p>
        <p><strong>所有环境变量:</strong> {JSON.stringify({
          NODE_ENV: process.env.NODE_ENV,
          DEBUG_ADS: process.env.NEXT_PUBLIC_DEBUG_ADS,
          all_keys: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC')).join(', ')
        })}</p>
        <p><strong>真实广告数量:</strong> {apiData ? apiData.length : 'Loading...'}</p>
        <p><strong>测试广告数量:</strong> {testApiData ? testApiData.length : 'Loading...'}</p>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#d1ecf1', border: '1px solid #bee5eb', borderRadius: '8px' }}>
        <h3>📋 测试步骤 / Test Steps</h3>
        <ol>
          <li>首先查看是否有调试信息显示（蓝色或黄色框）</li>
          <li>点击按钮切换到测试广告模式</li>
          <li>检查简单 HTML 广告是否显示</li>
          <li>如果测试广告显示，问题在于外部脚本</li>
          <li>如果测试广告不显示，问题在于基本渲染</li>
        </ol>
      </div>
    </div>
  )
}