import React, { useState } from 'react'
import { ProgressEffectType, PROGRESS_EFFECTS } from '../config/progressEffects'

interface EffectSelectorProps {
  currentEffect: ProgressEffectType
  onEffectChange: (effect: ProgressEffectType) => void
}

export default function EffectSelector({ currentEffect, onEffectChange }: EffectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const renderStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-xs ${i < difficulty ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ))
  }

  return (
    <div className="relative">
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
        title="切换进度条特效"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
        </svg>
        <span className="hidden sm:inline">{PROGRESS_EFFECTS[currentEffect].name}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 菜单内容 */}
          <div className="absolute top-full mt-2 left-0 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">选择进度条特效</h3>
              <p className="text-xs text-gray-500 mt-1">点击下方选项切换不同的上传进度特效</p>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {Object.values(PROGRESS_EFFECTS).map((effect) => (
                <button
                  key={effect.type}
                  onClick={() => {
                    onEffectChange(effect.type)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                    currentEffect === effect.type ? 'bg-indigo-50 border-indigo-100' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${
                          currentEffect === effect.type ? 'text-indigo-700' : 'text-gray-900'
                        }`}>
                          {effect.name}
                        </span>
                        {currentEffect === effect.type && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-indigo-600">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {effect.description}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-gray-500">难度:</span>
                        {renderStars(effect.difficulty)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="p-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                💡 提示：不同特效的性能开销不同，粒子特效可能在低端设备上影响性能
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
