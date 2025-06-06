export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          激活码管理系统
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
            欢迎使用激活码系统
          </h2>
          
          <div className="space-y-4">
            <div className="text-center">
              <a 
                href="/admin/login" 
                className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                管理后台
              </a>
            </div>
            
            <div className="text-sm text-gray-600 text-center">
              <p>系统功能：</p>
              <ul className="mt-2 space-y-1">
                <li>• 激活码生成</li>
                <li>• 激活码验证</li>
                <li>• 使用统计</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 