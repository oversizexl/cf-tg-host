import React, { useEffect, useRef } from 'react'
import { ProgressEffectType } from '../config/progressEffects'

interface ProgressEffectsProps {
  effectType: ProgressEffectType
  progress: number
  isActive: boolean
  children: React.ReactNode
  className?: string
  onClick?: () => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
}

export default function ProgressEffects({
  effectType,
  progress,
  isActive,
  children,
  className = '',
  onClick,
  onDrop,
  onDragOver
}: ProgressEffectsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 粒子轨迹边框的 Canvas 动画
  useEffect(() => {
    if (effectType !== 'particle' || !isActive || !canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    
    // 设置 Canvas 尺寸
    canvas.width = rect.width
    canvas.height = rect.height

    // 粒子系统
    const particles: Array<{
      x: number
      y: number
      progress: number
      speed: number
      size: number
      opacity: number
    }> = []

    // 创建粒子
    const createParticles = () => {
      const particleCount = Math.floor(progress / 10) + 3
      const perimeter = 2 * (canvas.width + canvas.height - 8) // 边框周长
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: 0,
          y: 0,
          progress: (i / particleCount) * (progress / 100),
          speed: 0.005 + Math.random() * 0.01,
          size: 2 + Math.random() * 3,
          opacity: 0.6 + Math.random() * 0.4
        })
      }
    }

    // 计算粒子在边框上的位置
    const getPositionOnBorder = (progress: number) => {
      const w = canvas.width - 4
      const h = canvas.height - 4
      const perimeter = 2 * (w + h)
      const distance = progress * perimeter

      if (distance <= w) {
        // 顶边
        return { x: 2 + distance, y: 2 }
      } else if (distance <= w + h) {
        // 右边
        return { x: w + 2, y: 2 + (distance - w) }
      } else if (distance <= 2 * w + h) {
        // 底边
        return { x: w + 2 - (distance - w - h), y: h + 2 }
      } else {
        // 左边
        return { x: 2, y: h + 2 - (distance - 2 * w - h) }
      }
    }

    createParticles()

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(particle => {
        particle.progress += particle.speed
        if (particle.progress > 1) particle.progress = 0

        const pos = getPositionOnBorder(particle.progress)
        particle.x = pos.x
        particle.y = pos.y

        // 绘制粒子
        ctx.save()
        ctx.globalAlpha = particle.opacity
        ctx.fillStyle = '#6366f1'
        ctx.shadowBlur = 8
        ctx.shadowColor = '#6366f1'
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      if (isActive) {
        requestAnimationFrame(animate)
      }
    }

    animate()

    return () => {
      particles.length = 0
    }
  }, [effectType, isActive, progress])

  // 获取容器样式
  const getContainerStyle = (): React.CSSProperties => {
    if (!isActive) {
      return {}
    }

    switch (effectType) {
      case 'circular':
        return {
          background: `conic-gradient(from 0deg at 50% 50%, 
            #6366f1 0deg, 
            #6366f1 ${progress * 3.6}deg, 
            #e5e7eb ${progress * 3.6}deg, 
            #e5e7eb 360deg), 
            padding-box`,
          border: '3px solid transparent',
          backgroundClip: 'padding-box, border-box',
          boxShadow: `0 0 20px rgba(99, 102, 241, ${Math.min(progress / 100 * 0.5, 0.5)})`
        }

      case 'flowing':
        return {
          border: '3px solid #e5e7eb',
          position: 'relative',
          boxShadow: `
            0 0 0 1px #6366f1,
            0 0 20px rgba(99, 102, 241, 0.3),
            inset 0 0 20px rgba(99, 102, 241, 0.1)
          `
        }

      case 'breathing':
        const intensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.3
        const borderWidth = 2 + intensity * 3
        const glowIntensity = (progress / 100) * intensity
        return {
          border: `${borderWidth}px solid #6366f1`,
          boxShadow: `
            0 0 ${20 + glowIntensity * 30}px rgba(99, 102, 241, ${0.3 + glowIntensity * 0.4}),
            inset 0 0 ${10 + glowIntensity * 20}px rgba(99, 102, 241, ${0.1 + glowIntensity * 0.2})
          `,
          transition: 'all 0.3s ease-in-out'
        }

      case 'particle':
        return {
          border: '2px solid #e5e7eb',
          position: 'relative'
        }

      case 'wave':
        return {
          border: '3px solid transparent',
          background: `
            linear-gradient(white, white) padding-box,
            linear-gradient(
              to top,
              #6366f1 0%,
              #6366f1 ${progress}%,
              #e5e7eb ${progress}%,
              #e5e7eb 100%
            ) border-box
          `,
          position: 'relative',
          overflow: 'hidden'
        }

      default:
        return {}
    }
  }

  // 获取容器类名
  const getContainerClassName = () => {
    let baseClass = className
    
    if (!isActive) {
      baseClass += ' border-2 border-dashed border-gray-300 hover:border-indigo-400'
    } else {
      baseClass += ' border-0'
    }

    return baseClass
  }

  return (
    <div
      ref={containerRef}
      className={getContainerClassName()}
      style={getContainerStyle()}
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {/* 流动光效的动画元素 */}
      {effectType === 'flowing' && isActive && (
        <>
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `conic-gradient(from ${(Date.now() * 0.1) % 360}deg, 
                transparent 0deg, 
                #6366f1 ${progress * 0.5}deg, 
                transparent ${progress * 1.5}deg, 
                transparent 360deg)`,
              mask: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
              maskComposite: 'xor',
              WebkitMask: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
              WebkitMaskComposite: 'xor',
              padding: '3px',
              animation: 'spin 3s linear infinite'
            }}
          />
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}

      {/* 波浪效果的 SVG */}
      {effectType === 'wave' && isActive && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <svg
            className="absolute bottom-0 left-0 w-full"
            style={{ height: `${progress}%` }}
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
                <stop offset="100%" stopColor="rgba(99, 102, 241, 0.1)" />
              </linearGradient>
            </defs>
            <path
              d={`M0,50 Q100,${30 + Math.sin(Date.now() * 0.002) * 10} 200,50 T400,50 L400,100 L0,100 Z`}
              fill="url(#waveGradient)"
            >
              <animate
                attributeName="d"
                values={`M0,50 Q100,30 200,50 T400,50 L400,100 L0,100 Z;
                         M0,50 Q100,70 200,50 T400,50 L400,100 L0,100 Z;
                         M0,50 Q100,30 200,50 T400,50 L400,100 L0,100 Z`}
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        </div>
      )}

      {/* 粒子轨迹的 Canvas */}
      {effectType === 'particle' && isActive && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none rounded-2xl"
        />
      )}

      {children}
    </div>
  )
}
