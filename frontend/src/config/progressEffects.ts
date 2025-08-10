// 进度条特效配置
export type ProgressEffectType = 
  | 'circular'      // 环形边框进度条
  | 'flowing'       // 流动光效边框
  | 'breathing'     // 呼吸式边框
  | 'particle'      // 粒子轨迹边框
  | 'wave'          // 波浪填充边框

export interface ProgressEffectConfig {
  type: ProgressEffectType
  name: string
  description: string
  difficulty: number // 1-5 星级难度
}

export const PROGRESS_EFFECTS: Record<ProgressEffectType, ProgressEffectConfig> = {
  circular: {
    type: 'circular',
    name: '环形边框进度条',
    description: '整个上传区域边框变成一个环形进度条，从顶部开始顺时针填充',
    difficulty: 4
  },
  flowing: {
    type: 'flowing',
    name: '流动光效边框',
    description: '边框有光点沿着边缘流动，速度随进度变化',
    difficulty: 4
  },
  breathing: {
    type: 'breathing',
    name: '呼吸式边框',
    description: '边框颜色和厚度随进度呼吸变化，完成时爆发光效',
    difficulty: 3
  },
  particle: {
    type: 'particle',
    name: '粒子轨迹边框',
    description: '小粒子沿着边框轨迹运动，形成进度指示',
    difficulty: 5
  },
  wave: {
    type: 'wave',
    name: '波浪填充边框',
    description: '边框内侧有波浪状的填充效果，像水位上升',
    difficulty: 4
  }
}

// 默认特效类型
export const DEFAULT_PROGRESS_EFFECT: ProgressEffectType = 'circular'
