import React, { useState, useEffect } from 'react'

const Statistics: React.FC = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">每周统计</h2>
        <p className="text-gray-500">
          周统计功能开发中，敬请期待...
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">本周统计即将上线</p>
          <p className="text-sm mt-2">现在可以在仪表盘查看今日统计</p>
        </div>
      </div>
    </div>
  )
}

export default Statistics
