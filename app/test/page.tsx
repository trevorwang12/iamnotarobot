export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">系统测试页面</h1>
        <div className="space-y-2 text-gray-600">
          <p>✅ Next.js 正常运行</p>
          <p>✅ Tailwind CSS 样式加载</p>
          <p>✅ TypeScript 编译正常</p>
        </div>
        <div className="mt-4">
          <a href="/" className="text-blue-500 hover:underline">← 返回主页</a>
        </div>
      </div>
    </div>
  )
}