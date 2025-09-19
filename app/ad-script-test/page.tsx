"use client"

export default function AdScriptTestPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>广告脚本测试页面</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>测试1: 直接HTML脚本 (revenuecpmgate.com)</h2>
        <div style={{ border: '2px solid #ff6b6b', padding: '20px', minHeight: '100px' }}>
          <div 
            dangerouslySetInnerHTML={{
              __html: `<script async="async" data-cfasync="false" src="//pl27550504.revenuecpmgate.com/7f4e324f2b07a5d92952cf5ac8a8dd2f/invoke.js"></script>
<div id="container-7f4e324f2b07a5d92952cf5ac8a8dd2f"></div>`
            }}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>测试2: 直接HTML脚本 (highperformanceformat.com)</h2>
        <div style={{ border: '2px solid #4ecdc4', padding: '20px', minHeight: '200px' }}>
          <div 
            dangerouslySetInnerHTML={{
              __html: `<script type="text/javascript">
	atOptions = {
		'key' : 'd01b6a20602175d470ff4d3f0b9e70b9',
		'format' : 'iframe',
		'height' : 300,
		'width' : 160,
		'params' : {}
	};
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/d01b6a20602175d470ff4d3f0b9e70b9/invoke.js"></script>`
            }}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>🔍 诊断信息</h3>
        <p><strong>User Agent:</strong> <span style={{fontSize: '10px'}}>{typeof window !== 'undefined' ? window.navigator.userAgent : 'Loading...'}</span></p>
        <p><strong>CSP检测:</strong> <span id="csp-test">检测中...</span></p>
        <p><strong>网络连接测试:</strong> <span id="network-test">检测中...</span></p>
        
        <script dangerouslySetInnerHTML={{__html: `
          // CSP测试
          try {
            eval('1+1');
            document.getElementById('csp-test').innerHTML = '✅ 允许eval - CSP较宽松';
          } catch(e) {
            document.getElementById('csp-test').innerHTML = '❌ 阻止eval - CSP可能过严格';
          }
          
          // 网络连接测试
          fetch('//pl27550504.revenuecpmgate.com/7f4e324f2b07a5d92952cf5ac8a8dd2f/invoke.js', {mode: 'no-cors'})
            .then(() => {
              document.getElementById('network-test').innerHTML = '✅ 可以连接广告服务器';
            })
            .catch(() => {
              document.getElementById('network-test').innerHTML = '❌ 无法连接广告服务器';
            });
        `}} />
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', background: '#d1ecf1', borderRadius: '8px' }}>
        <h3>📋 测试说明</h3>
        <ul>
          <li>如果看到广告内容，说明外部脚本工作正常</li>
          <li>如果只看到空框，检查上面的诊断信息</li>
          <li>脚本可能需要几秒钟加载时间</li>
          <li>某些广告可能有地理位置限制</li>
          <li>广告屏蔽器会阻止这些脚本</li>
        </ul>
      </div>
    </div>
  )
}