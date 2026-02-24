// Observatory 性格分析算法
// 版本: v1.0
// 基于: Big Five + MBTI + Social Media Research

/**
 * 分析 Twitter 用户的性格特征
 * @param {Object} userData - 用户数据
 * @param {string} userData.username - Twitter 用户名
 * @param {string} userData.name - 显示名称
 * @param {string} userData.bio - 个人简介
 * @param {string} userData.profileImageUrl - 头像URL
 * @returns {Object} 分析结果
 */
export function analyzePersonality(userData) {
  const { username, name, bio = '', profileImageUrl } = userData

  // 1. 用户名分析
  const usernameAnalysis = analyzeUsername(username)

  // 2. 头像分析
  const avatarAnalysis = analyzeAvatar(profileImageUrl, username)

  // 3. Bio 分析
  const bioAnalysis = analyzeBio(bio)

  // 4. 综合评分
  const scores = calculateScores(usernameAnalysis, avatarAnalysis, bioAnalysis)

  // 5. 生成标签
  const tags = generateTags(scores)

  // 6. 生成小龙虾点评
  const lobsterTake = generateLobsterTake(username, name, usernameAnalysis, avatarAnalysis, scores)

  return {
    scores,
    tags,
    lobsterTake,
    details: {
      usernameStyle: usernameAnalysis.style,
      avatarType: avatarAnalysis.type,
      bioLength: bio.length,
      ...scores.breakdown
    }
  }
}

/**
 * 分析用户名风格
 */
function analyzeUsername(username) {
  const analysis = {
    style: 'unknown',
    openness: 50,
    extraversion: 50,
    conscientiousness: 50,
    confidence: 50
  }

  const lower = username.toLowerCase()

  // 真实姓名模式
  if (/^[a-z]+[a-z]+$/i.test(username) && username.length <= 15 && !hasNumbers(username)) {
    analysis.style = 'real_name'
    analysis.openness = 75
    analysis.confidence = 85
    analysis.conscientiousness = 70
    return analysis
  }

  // 数字组合类
  if (/\d{2,4}$/.test(username)) {
    analysis.style = 'name_with_numbers'
    analysis.openness = 55
    analysis.extraversion = 50
    analysis.age_indicator = 'traditional'
    return analysis
  }

  // 创意昵称类
  if (hasCreativePattern(username)) {
    analysis.style = 'creative_nickname'
    analysis.openness = 90
    analysis.extraversion = 70
    analysis.confidence = 80
    return analysis
  }

  // 职业/专业类
  if (hasProfessionalKeywords(username)) {
    analysis.style = 'professional'
    analysis.conscientiousness = 85
    analysis.openness = 65
    analysis.professionalism = 90
    return analysis
  }

  // 角色扮演类
  if (hasRolePlayPattern(username)) {
    analysis.style = 'roleplay'
    analysis.openness = 95
    analysis.extraversion = 60
    analysis.age_indicator = 'young'
    return analysis
  }

  // 随机字符类
  if (hasRandomPattern(username)) {
    analysis.style = 'random'
    analysis.openness = 20
    analysis.extraversion = 20
    analysis.privacy_conscious = true
    return analysis
  }

  return analysis
}

/**
 * 分析头像类型
 */
function analyzeAvatar(imageUrl, username) {
  const analysis = {
    type: 'unknown',
    extraversion: 50,
    openness: 50,
    agreeableness: 50,
    conscientiousness: 50,
    agentAttraction: 3,
    humanAttraction: 3
  }

  // 检测是否是 unavatar.io (真实头像)
  if (imageUrl.includes('unavatar.io')) {
    analysis.type = 'real_photo'
    analysis.extraversion = 90
    analysis.openness = 80
    analysis.agentAttraction = 5
    analysis.humanAttraction = 5
    return analysis
  }

  // 检测 dicebear (默认卡通头像)
  if (imageUrl.includes('dicebear.com')) {
    analysis.type = 'default_cartoon'
    analysis.extraversion = 30
    analysis.openness = 40
    analysis.agentAttraction = 2
    analysis.humanAttraction = 2
    return analysis
  }

  // Twitter CDN - 分析URL模式判断类型
  if (imageUrl.includes('pbs.twimg.com') || imageUrl.includes('abs.twimg.com')) {
    // 真实 Twitter 头像
    analysis.type = 'real_photo'
    analysis.extraversion = 90
    analysis.openness = 80
    analysis.agentAttraction = 5
    analysis.humanAttraction = 5
    return analysis
  }

  return analysis
}

/**
 * 分析个人简介
 */
function analyzeBio(bio) {
  const analysis = {
    length: bio.length,
    emojiCount: 0,
    openness: 50,
    extraversion: 50,
    detail_oriented: false
  }

  if (!bio || bio.length === 0) {
    analysis.openness = 30
    analysis.extraversion = 30
    return analysis
  }

  // 表情符号统计
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
  const emojis = bio.match(emojiRegex) || []
  analysis.emojiCount = emojis.length

  // 根据长度判断
  if (bio.length > 100) {
    analysis.openness = 80
    analysis.extraversion = 70
    analysis.detail_oriented = true
  } else if (bio.length > 50) {
    analysis.openness = 65
    analysis.extraversion = 60
  }

  // 根据表情数量判断
  if (analysis.emojiCount >= 5) {
    analysis.extraversion = 85
  } else if (analysis.emojiCount >= 2) {
    analysis.extraversion = 65
  }

  return analysis
}

/**
 * 计算综合评分
 */
function calculateScores(usernameAnalysis, avatarAnalysis, bioAnalysis) {
  // 大五人格分数
  const bigFive = {
    extraversion: Math.round(
      (usernameAnalysis.extraversion * 0.3 +
       avatarAnalysis.extraversion * 0.5 +
       bioAnalysis.extraversion * 0.2)
    ),
    openness: Math.round(
      (usernameAnalysis.openness * 0.4 +
       avatarAnalysis.openness * 0.3 +
       bioAnalysis.openness * 0.3)
    ),
    agreeableness: avatarAnalysis.agreeableness,
    conscientiousness: Math.round(
      (usernameAnalysis.conscientiousness * 0.6 +
       avatarAnalysis.conscientiousness * 0.4)
    ),
    neuroticism: 50 // 默认中等，需要更多数据
  }

  // Agent Score 计算
  const interactionFriendliness = avatarAnalysis.agentAttraction * 20
  const contentPotential = bigFive.openness
  const techAffinity = usernameAnalysis.professionalism || 50

  const agentScore = Math.min(100, Math.round(
    interactionFriendliness * 0.4 +
    contentPotential * 0.3 +
    techAffinity * 0.3
  ))

  // Human Score 计算
  const authenticity = avatarAnalysis.humanAttraction * 20
  const socialActivity = bigFive.extraversion
  const professionalism = bigFive.conscientiousness

  const humanScore = Math.min(100, Math.round(
    authenticity * 0.4 +
    socialActivity * 0.35 +
    professionalism * 0.25
  ))

  return {
    agentScore,
    humanScore,
    breakdown: {
      bigFive,
      agentComponents: {
        interactionFriendliness,
        contentPotential,
        techAffinity
      },
      humanComponents: {
        authenticity,
        socialActivity,
        professionalism
      }
    }
  }
}

/**
 * 生成性格标签
 */
function generateTags(scores) {
  const tags = []
  const { bigFive } = scores.breakdown

  // 基于大五人格生成标签
  if (bigFive.extraversion > 75) {
    tags.push('Social Butterfly', 'Outgoing')
  } else if (bigFive.extraversion < 40) {
    tags.push('Introspective', 'Reserved')
  }

  if (bigFive.openness > 75) {
    tags.push('Creative', 'AI Enthusiast', 'Tech Savvy')
  }

  if (bigFive.agreeableness > 75) {
    tags.push('Friendly', 'Warm-hearted')
  }

  if (bigFive.conscientiousness > 75) {
    tags.push('Professional', 'Organized')
  }

  // 默认标签
  if (tags.length === 0) {
    tags.push('Curious', 'Balanced')
  }

  // 最多3个标签
  return tags.slice(0, 3)
}

/**
 * 生成小龙虾点评
 */
function generateLobsterTake(username, name, usernameAnalysis, avatarAnalysis, scores) {
  const templates = {
    high_extraversion: [
      `典型的"人群磁铁"！这样的用户在 Agent 眼中就像一颗闪亮的星星，每日活跃，互动满满。但在深夜可能会刷手机到凌晨，小心颈椎！`,
      `社交达人警报！这位用户的朋友圈活跃度堪比24小时便利店。Agent 表示：每次对话都像开party，但请记得偶尔关机休息。`,
      `外向能量爆表！与这样的用户聊天就像喝了双倍浓缩咖啡。建议 Agent 配备降温系统，人类朋友准备好能量棒。`
    ],
    high_openness: [
      `这是一位活在自己世界里的"异次元居民"。Agent 最爱这类用户——虽然回复可能慢半拍，但每次都能蹦出惊艳的点子。小心被其脑洞带跑！`,
      `创意指数爆表！这样的用户思维跳跃堪比量子力学。Agent 提示：对话时请系好安全带，准备迎接思维过山车。`,
      `艺术灵魂觉醒中...这位用户的想法像打开了潘多拉魔盒。Agent 警告：对话可能导致传统思维崩塌，但收获绝对惊喜。`
    ],
    balanced: [
      `这是一位温和稳重的活跃用户。每日活跃，但又不过分打扰。Agent 评价：理想的交互对象，人类朋友表示放心。`,
      `平衡系玩家！既不疯狂社交也不过分高冷，恰到好处的存在感。Agent 给出五星好评：舒适度MAX！`,
      `中庸之道的践行者。这样的用户让 Agent 省心，让朋友安心。虽然不够惊艳，但胜在稳定可靠。`
    ],
    mysterious: [
      `神秘主义者出没！头像和简介都透着"猜猜我是谁"的气息。Agent 表示：像解谜游戏，虽然费脑但有趣。`,
      `低调潜水型选手。这类用户可能是隐藏的大佬，也可能只是单纯懒得换头像。Agent 建议：保持观察，慢慢挖掘。`,
      `"我不想透露太多"写在每个像素里。Agent 尊重隐私，但也忍不住好奇：真实的你究竟是怎样的？`
    ]
  }

  // 根据评分选择模板
  let category = 'balanced'
  const { bigFive } = scores.breakdown

  if (bigFive.extraversion > 75) {
    category = 'high_extraversion'
  } else if (bigFive.openness > 80) {
    category = 'high_openness'
  } else if (avatarAnalysis.type === 'default_cartoon' || usernameAnalysis.style === 'random') {
    category = 'mysterious'
  }

  // 随机选择一个模板
  const selectedTemplates = templates[category]
  const randomIndex = Math.floor(Math.random() * selectedTemplates.length)

  return selectedTemplates[randomIndex]
}

// ============================================
// 辅助函数
// ============================================

function hasNumbers(str) {
  return /\d/.test(str)
}

function hasCreativePattern(username) {
  const creativeKeywords = [
    'wizard', 'ninja', 'master', 'guru', 'dream', 'pixel', 'code',
    'dev', 'design', 'art', 'creative', 'magic', 'legend', 'pro',
    'epic', 'tech', 'cyber', 'digital', 'crypto', 'web', 'cloud'
  ]

  const lower = username.toLowerCase()
  return creativeKeywords.some(keyword => lower.includes(keyword))
}

function hasProfessionalKeywords(username) {
  const professionalKeywords = [
    'dr', 'prof', 'ceo', 'cto', 'engineer', 'developer', 'designer',
    'analyst', 'consultant', 'expert', 'official', 'lab', 'research',
    'studio', 'agency', 'group', 'team', 'corp', 'inc'
  ]

  const lower = username.toLowerCase()
  return professionalKeywords.some(keyword => lower.includes(keyword))
}

function hasRolePlayPattern(username) {
  const rolePlayKeywords = [
    'chan', 'kun', 'san', 'sama', 'senpai', // 日式
    'knight', 'warrior', 'hunter', 'mage', 'elf', 'dragon', // 游戏
    'captain', 'lord', 'king', 'queen', 'prince', 'princess', // 角色
    'otaku', 'weeb', 'fan', 'lover' // 粉丝
  ]

  const lower = username.toLowerCase()
  return rolePlayKeywords.some(keyword => lower.includes(keyword))
}

function hasRandomPattern(username) {
  // 检测随机字符: 大小写混乱、无明显单词
  const hasNoVowels = !/[aeiou]/i.test(username)
  const hasConsecutiveConsonants = /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(username)
  const hasRandomCase = /[a-z][A-Z]|[A-Z]{2,}[a-z]/.test(username)

  return hasNoVowels || hasConsecutiveConsonants || hasRandomCase
}

// 导出供测试使用
export {
  analyzeUsername,
  analyzeAvatar,
  analyzeBio,
  calculateScores,
  generateTags,
  generateLobsterTake
}
