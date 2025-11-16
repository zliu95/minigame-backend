'use client';

interface PlatformData {
  platform: string;
  count: number;
  percentage: string;
}

interface PlatformChartProps {
  data: PlatformData[];
}

const platformNames: Record<string, string> = {
  WECHAT: '微信小程序',
  DOUYIN: '抖音小程序',
  IOS_APP: 'iOS应用',
  ANDROID_APP: 'Android应用'
};

const platformColors: Record<string, string> = {
  WECHAT: 'bg-green-500',
  DOUYIN: 'bg-black',
  IOS_APP: 'bg-blue-500',
  ANDROID_APP: 'bg-green-600'
};

export function PlatformChart({ data }: PlatformChartProps) {
  const totalUsers = data.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">平台用户分布</h3>
      
      {totalUsers === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无用户数据
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.platform} className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full mr-3 ${
                    platformColors[item.platform] || 'bg-gray-400'
                  }`}
                />
                <span className="text-sm font-medium text-gray-700">
                  {platformNames[item.platform] || item.platform}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900 font-medium">
                  {item.count}
                </span>
                <span className="text-sm text-gray-500">
                  ({item.percentage}%)
                </span>
              </div>
            </div>
          ))}
          
          {/* 简单的条形图 */}
          <div className="mt-6 space-y-2">
            {data.map((item) => (
              <div key={`bar-${item.platform}`} className="flex items-center">
                <div className="w-20 text-xs text-gray-600 truncate">
                  {platformNames[item.platform] || item.platform}
                </div>
                <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      platformColors[item.platform] || 'bg-gray-400'
                    }`}
                    style={{
                      width: `${Math.max(parseFloat(item.percentage), 2)}%`
                    }}
                  />
                </div>
                <div className="w-12 text-xs text-gray-600 text-right">
                  {item.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}