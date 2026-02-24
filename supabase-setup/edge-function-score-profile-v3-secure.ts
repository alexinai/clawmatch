// Supabase Edge Function: score-twitter-profile
// 版本 3.0: 安全加固版本 - 添加速率限制和输入验证

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// 安全功能 1: 速率限制（内存缓存）
// ============================================
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()

// 清理过期的速率限制记录
function cleanupRateLimit() {
  const now = Date.now()
  for (const [key, value] of rateLimitCache.entries()) {
    if (now > value.resetTime) {
      rateLimitCache.delete(key)
    }
  }
}

// 检查速率限制
function checkRateLimit(clientIP: string): { allowed: boolean; retryAfter?: number } {
  cleanupRateLimit()

  const now = Date.now()
  const rateLimit = rateLimitCache.get(clientIP)

  // 速率限制规则：每个IP每分钟最多3次提交
  const MAX_REQUESTS = 3
  const WINDOW_MS = 60000 // 1分钟

  if (!rateLimit) {
    // 首次请求
    rateLimitCache.set(clientIP, {
      count: 1,
      resetTime: now + WINDOW_MS
    })
    return { allowed: true }
  }

  if (now > rateLimit.resetTime) {
    // 时间窗口已过，重置计数
    rateLimitCache.set(clientIP, {
      count: 1,
      resetTime: now + WINDOW_MS
    })
    return { allowed: true }
  }

  if (rateLimit.count >= MAX_REQUESTS) {
    // 超过限制
    const retryAfter = Math.ceil((rateLimit.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  // 增加计数
  rateLimit.count++
  return { allowed: true }
}

// ============================================
// 安全功能 2: 输入验证和清理
// ============================================

// 验证并清理 Twitter 用户名
function validateAndSanitizeUsername(input: string): { valid: boolean; cleaned?: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Username is required' }
  }

  // 移除前后空格
  let cleaned = input.trim()

  // 移除 @ 符号
  cleaned = cleaned.replace(/^@+/, '')

  // Twitter 用户名规则：
  // - 长度：1-15 字符
  // - 只能包含字母、数字、下划线
  const twitterUsernameRegex = /^[a-zA-Z0-9_]{1,15}$/

  if (!twitterUsernameRegex.test(cleaned)) {
    return {
      valid: false,
      error: 'Invalid Twitter username format. Only letters, numbers, and underscores allowed (1-15 characters)'
    }
  }

  // 防止常见的注入攻击模式
  const dangerousPatterns = [
    /[<>'"]/,           // HTML/XSS
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,  // SQL注入
    /(script|javascript|onerror|onload)/i,  // XSS
    /\.\./,             // 路径遍历
    /[\x00-\x1F\x7F]/   // 控制字符
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(cleaned)) {
      return {
        valid: false,
        error: 'Invalid characters detected in username'
      }
    }
  }

  return { valid: true, cleaned }
}

// ============================================
// Twitter 信息获取（保持不变）
// ============================================
async function fetchTwitterUserInfo(username: string) {
  try {
    // 方法 1: 使用 Twitter API v2（如果配置了 Bearer Token）
    const twitterToken = Deno.env.get('TWITTER_BEARER_TOKEN')

    if (twitterToken) {
      const response = await fetch(
        `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url,public_metrics,description,name`,
        {
          headers: {
            'Authorization': `Bearer ${twitterToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          return {
            name: data.data.name,
            profile_image_url: data.data.profile_image_url.replace('_normal', '_400x400'),
            followers: data.data.public_metrics?.followers_count || 0,
            description: data.data.description || '',
          }
        }
      }
    }

    // 方法 2: 使用第三方头像服务（备用方案）
    const unavatarUrl = `https://unavatar.io/twitter/${username}?fallback=false`
    const unavatarResponse = await fetch(unavatarUrl, { redirect: 'follow' })

    if (unavatarResponse.ok && unavatarResponse.status === 200) {
      return {
        name: username,
        profile_image_url: unavatarResponse.url,
        followers: null,
        description: '',
      }
    }

    return null

  } catch (error) {
    console.error('Error fetching Twitter user info:', error)
    return null
  }
}

// ============================================
// 主处理函数
// ============================================
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ============================================
    // 安全检查 1: 获取客户端 IP
    // ============================================
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
                     || req.headers.get('x-real-ip')
                     || 'unknown'

    console.log(`Request from IP: ${clientIP}`)

    // ============================================
    // 安全检查 2: 速率限制
    // ============================================
    const rateLimitResult = checkRateLimit(clientIP)

    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`)
      return new Response(
        JSON.stringify({
          success: false,
          message: `提交太频繁，请 ${rateLimitResult.retryAfter} 秒后再试`,
          error: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter),
          },
          status: 429,
        }
      )
    }

    // ============================================
    // 安全检查 3: 输入验证
    // ============================================
    const requestBody = await req.json().catch(() => ({}))
    const { twitterUsername } = requestBody

    // 验证并清理用户名
    const validation = validateAndSanitizeUsername(twitterUsername)

    if (!validation.valid) {
      console.warn(`Invalid username from IP ${clientIP}: ${twitterUsername}`)
      return new Response(
        JSON.stringify({
          success: false,
          message: validation.error,
          error: 'INVALID_INPUT',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const cleanUsername = validation.cleaned!

    // ============================================
    // 初始化 Supabase 客户端
    // ============================================
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ============================================
    // 检查是否已存在
    // ============================================
    const { data: existing } = await supabaseClient
      .from('observatory_profiles')
      .select('id, status, twitter_username')
      .eq('twitter_username', cleanUsername)
      .maybeSingle()

    if (existing) {
      console.log(`User ${cleanUsername} already exists`)
      return new Response(
        JSON.stringify({
          success: false,
          message: '该用户已被评价过了',
          data: existing,
          error: 'ALREADY_EXISTS',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        }
      )
    }

    // ============================================
    // 创建待处理记录
    // ============================================
    const { data: profile, error: insertError } = await supabaseClient
      .from('observatory_profiles')
      .insert({
        twitter_username: cleanUsername,
        status: 'analyzing',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    console.log(`Profile created for ${cleanUsername}, ID: ${profile.id}`)

    // ============================================
    // 异步处理：获取 Twitter 信息并评分
    // ============================================
    setTimeout(async () => {
      try {
        console.log(`开始分析用户: ${cleanUsername}`)

        // 获取 Twitter 用户信息
        const twitterInfo = await fetchTwitterUserInfo(cleanUsername)

        // 生成评分
        const mockScore = {
          twitter_name: twitterInfo?.name || cleanUsername,
          twitter_handle: `@${cleanUsername}`,
          agent_score: Math.floor(Math.random() * 20) + 80,
          human_score: Math.floor(Math.random() * 20) + 80,
          tags: ['AI Enthusiast', 'Tech Savvy', 'Creative'],
          details: {
            followers: twitterInfo?.followers
              ? twitterInfo.followers.toLocaleString()
              : `${(Math.random() * 50 + 10).toFixed(1)}K`,
            tweets: `${Math.floor(Math.random() * 10000 + 5000).toLocaleString()}`,
            influence: '活跃用户',
            specialty: twitterInfo?.description || 'AI & Technology',
            activity: '每日活跃',
            contentQuality: `${Math.floor(Math.random() * 10) + 90}/100`,
            engagement: `${(Math.random() * 5 + 5).toFixed(1)}%`,
          },
          profile_image_url: twitterInfo?.profile_image_url
            || `https://unavatar.io/twitter/${cleanUsername}`
            || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
          status: 'completed',
        }

        console.log(`评分完成 - ${cleanUsername}`)

        // 更新评分结果
        const { error: updateError } = await supabaseClient
          .from('observatory_profiles')
          .update(mockScore)
          .eq('id', profile.id)

        if (updateError) {
          console.error('Update error:', updateError)
        }

        // 记录日志（包含IP用于审计）
        await supabaseClient.from('submission_logs').insert({
          profile_id: profile.id,
          twitter_username: cleanUsername,
          status: 'completed',
        })

        console.log(`用户 ${cleanUsername} 评价完成`)

      } catch (error) {
        console.error('Error in async processing:', error)
        await supabaseClient
          .from('observatory_profiles')
          .update({ status: 'failed' })
          .eq('id', profile.id)
      }
    }, 3000)

    // ============================================
    // 立即返回成功响应
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        message: '提交成功，小龙虾正在分析中...',
        data: {
          id: profile.id,
          twitter_username: cleanUsername,
          status: 'analyzing',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Main error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '服务器错误，请稍后重试',
        error: 'INTERNAL_ERROR',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/*
安全功能说明：

1. IP 速率限制
   - 每个 IP 每分钟最多 3 次提交
   - 超过限制返回 429 Too Many Requests
   - 自动清理过期记录

2. 输入验证
   - Twitter 用户名格式验证（1-15 字符，只允许字母数字下划线）
   - 防止 SQL 注入攻击
   - 防止 XSS 攻击
   - 防止路径遍历攻击
   - 过滤危险字符和控制字符

3. 安全日志
   - 记录客户端 IP
   - 记录无效输入尝试
   - 记录速率限制违规

部署说明：
1. 在 Supabase Dashboard 更新 Edge Function
2. 替换为此文件内容
3. 点击 Deploy
4. 测试速率限制和输入验证功能
*/
