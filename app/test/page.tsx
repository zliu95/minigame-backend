/**
 * 测试页面 - 用于验证应用是否正常运行
 * 访问 http://localhost:3000/test
 */

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          ✅ 应用运行正常！
        </h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h2 className="font-semibold text-blue-900 mb-2">环境信息</h2>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Node 环境: {process.env.NODE_ENV}</li>
              <li>• 当前时间: {new Date().toLocaleString('zh-CN')}</li>
              <li>• 协议: {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="font-semibold text-green-900 mb-2">✅ 测试通过</h2>
            <p className="text-sm text-green-800">
              如果你能看到这个页面，说明应用已经正常运行。
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h2 className="font-semibold text-yellow-900 mb-2">下一步</h2>
            <ul className="text-sm text-yellow-800 space-y-2">
              <li>1. 访问 <a href="/login" className="underline text-blue-600">/login</a> 进行登录</li>
              <li>2. 默认账号: admin / admin123</li>
              <li>3. 访问 <a href="/api/health" className="underline text-blue-600">/api/health</a> 检查健康状态</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <h2 className="font-semibold text-gray-900 mb-2">关于 HTTPS 跳转</h2>
            <p className="text-sm text-gray-700 mb-2">
              如果浏览器自动跳转到 HTTPS，这是浏览器的 HSTS 缓存导致的。
            </p>
            <p className="text-sm text-gray-700">
              解决方法：
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside mt-1 space-y-1">
              <li>使用隐私模式/无痕模式</li>
              <li>清除浏览器的 HSTS 设置（Chrome: chrome://net-internals/#hsts）</li>
              <li>使用不同的浏览器</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <a 
              href="/login"
              className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              前往登录
            </a>
            <a 
              href="/api/health"
              className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded hover:bg-green-700 transition"
            >
              健康检查
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
