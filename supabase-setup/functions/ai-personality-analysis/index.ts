// Supabase Edge Function: AI-powered personality analysis
// 使用中转API版本

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 从环境变量读取配置
const PROXY_API_KEY = Deno.env.get('PROXY_API_KEY')! // 中转key
const PROXY_API_ENDPOINT = Deno.env.get('PROXY_API_ENDPOINT')! // 中转endpoint
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 速率限制（防止滥用）
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(clientIP: string): { allowed: boolean; retryAfter?: number } {
  const MAX_REQUESTS = 5 // 每分钟最多5次
  const WINDOW_MS = 60000

  const now = Date.now()
  const record = rateLimitCache.get(clientIP)

  if (!record || now > record.resetTime) {
    rateLimitCache.set(clientIP, { count: 1, resetTime: now + WINDOW_MS })
    return { allowed: true }
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  record.count++
  return { allowed: true }
}

// AI 分析 Prompt
const ANALYSIS_PROMPT = `你是一位资深的心理分析师和性格研究专家，专门分析社交媒体用户的性格特征。

请基于以下信息进行深度性格分析：

**用户信息：**
- Twitter用户名: {{USERNAME}}
- 头像特征: {{AVATAR_INFO}}

**分析维度：**

1. **用户名解读**
   - 风格判断（真名/昵称/创意型/专业型/神秘型）
   - 推断其自信程度、开放性、社交倾向
   - 注意数字、符号、语言的含义

2. **头像印象**
   - 判断展示风格（真人照/艺术图/卡通/默认）
   - 分析自信度和视觉敏感度

3. **性格推断**
   - 基于以上信息，推断大五人格特征
   - 判断在亲密关系中的S/M/Switch倾向

**输出格式（必须是严格的JSON）：**

\`\`\`json
{
  "bigFive": {
    "extraversion": 75,
    "openness": 85,
    "agreeableness": 60,
    "conscientiousness": 70,
    "neuroticism": 45
  },
  "dominanceScore": 68,
  "smType": "S",
  "tags": ["Creative", "Tech Savvy", "Confident", "Outgoing"],
  "insights": {
    "usernameAnalysis": "用户名展现出强烈的个人风格和自信...",
    "avatarAnalysis": "选择真实头像说明...",
    "personalityCore": "这是一位外向、开放、有创造力的人...",
    "intimacyStyle": "在亲密关系中倾向于主导和引领..."
  }
}
\`\`\`

**注意**：
- 所有分数0-100之间
- dominanceScore: >65为S型, <35为M型, 35-65为Switch
- 保持客观专业，基于有限信息合理推断
- 必须返回有效的JSON格式`

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 获取客户端IP（用于速率限制）
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     'unknown'

    // 检查速率限制
    const rateCheck = checkRateLimit(clientIP)
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: rateCheck.retryAfter
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': rateCheck.retryAfter?.toString() || '60'
          }
        }
      )
    }

    const { username } = await req.json()

    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid username' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 清理用户名
    const cleanUsername = username.replace(/^@/, '').replace(/[^\w]/g, '').trim()
    if (!cleanUsername || cleanUsername.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid username format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 获取头像URL
    const avatarUrl = `https://unavatar.io/twitter/${cleanUsername}`

    // 检查缓存
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: cached } = await supabase
      .from('personality_analysis_cache')
      .select('analysis_result, created_at')
      .eq('username', cleanUsername)
      .single()

    // 如果有缓存且未过期（24小时），直接返回
    if (cached && cached.created_at) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime()
      if (cacheAge < 24 * 60 * 60 * 1000) {
        console.log('Cache hit:', cleanUsername)
        return new Response(
          JSON.stringify({
            success: true,
            username: cleanUsername,
            avatarUrl,
            analysis: cached.analysis_result,
            cached: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 准备prompt
    const prompt = ANALYSIS_PROMPT
      .replace('{{USERNAME}}', cleanUsername)
      .replace('{{AVATAR_INFO}}', `头像URL: ${avatarUrl}`)

    console.log('Calling AI API for:', cleanUsername)

    // 调用中转API
    const aiResponse = await fetch(PROXY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PROXY_API_KEY}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API error:', errorText)
      throw new Error(`AI API error: ${aiResponse.status} ${errorText}`)
    }

    const aiData = await aiResponse.json()
    const aiContent = aiData.content?.[0]?.text || aiData.choices?.[0]?.message?.content

    if (!aiContent) {
      throw new Error('No content from AI API')
    }

    // 解析JSON
    let analysisResult
    try {
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) ||
                       aiContent.match(/```\s*([\s\S]*?)\s*```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent
      analysisResult = JSON.parse(jsonStr)

      // 验证数据结构
      if (!analysisResult.bigFive || !analysisResult.dominanceScore) {
        throw new Error('Invalid analysis structure')
      }

    } catch (e) {
      console.error('Parse error:', e)
      console.error('AI response:', aiContent)
      throw new Error('Failed to parse AI response')
    }

    // 保存到缓存
    await supabase.from('personality_analysis_cache').upsert({
      username: cleanUsername,
      analysis_result: analysisResult,
      created_at: new Date().toISOString()
    }, { onConflict: 'username' })

    // 返回结果
    return new Response(
      JSON.stringify({
        success: true,
        username: cleanUsername,
        avatarUrl,
        analysis: analysisResult,
        cached: false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
