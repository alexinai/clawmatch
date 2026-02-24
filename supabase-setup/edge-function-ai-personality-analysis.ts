// Supabase Edge Function: AI-powered personality analysis
// Deploy to: supabase/functions/ai-personality-analysis

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Prompt template for personality analysis
const ANALYSIS_PROMPT = `你是一位资深的心理分析师和性格研究专家，专门分析社交媒体用户的性格特征。

请基于以下信息进行深度性格分析：

**用户信息：**
- Twitter用户名: {{USERNAME}}
- 头像URL: {{AVATAR_URL}}
- Bio简介: {{BIO}}

**分析要求：**

1. **用户名分析**：
   - 分析用户名的风格（真名/昵称/创意型/专业型/随机型）
   - 推断其自信程度、开放性、社交倾向
   - 注意特殊符号、数字、语言混用的含义

2. **头像分析**：
   - 判断头像类型（真人照片/卡通/动漫/艺术图/默认头像）
   - 分析头像传达的信息（自信/神秘/创意/专业）
   - 推断其外向性、视觉敏感度

3. **Bio分析**（如果有）：
   - 分析语言风格、emoji使用、表达方式
   - 推断其价值观、兴趣领域、性格特点

**输出格式（JSON）：**

{
  "bigFive": {
    "extraversion": 0-100,  // 外向性
    "openness": 0-100,      // 开放性
    "agreeableness": 0-100, // 宜人性
    "conscientiousness": 0-100, // 尽责性
    "neuroticism": 0-100    // 神经质
  },
  "dominanceScore": 0-100,  // S/M倾向 (>65=S, <35=M, 35-65=Switch)
  "tags": ["tag1", "tag2", "tag3"], // 3-5个英文标签
  "smType": "S" | "M" | "Switch",
  "analysis": {
    "usernameStyle": "分析用户名风格和含义",
    "avatarInsight": "分析头像传达的信息",
    "personalityOverview": "总体性格概述",
    "intimacyStyle": "亲密关系中的表现风格"
  }
}

**注意事项**：
- 基于有限信息进行合理推断，不要过度解读
- 保持专业、客观、不带偏见
- 如果信息不足，给出保守的估计
- 所有分数应该有内在逻辑一致性
`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { username } = await req.json()

    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid username' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize username
    const cleanUsername = username.replace(/^@/, '').trim()

    // Get avatar URL
    const avatarUrl = `https://unavatar.io/twitter/${cleanUsername}`

    // TODO: Get bio from Twitter API (需要Twitter API集成)
    const bio = '' // 暂时为空

    // Prepare prompt
    const prompt = ANALYSIS_PROMPT
      .replace('{{USERNAME}}', cleanUsername)
      .replace('{{AVATAR_URL}}', avatarUrl)
      .replace('{{BIO}}', bio || '（无简介）')

    // Call Claude API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!anthropicResponse.ok) {
      throw new Error(`Claude API error: ${anthropicResponse.statusText}`)
    }

    const anthropicData = await anthropicResponse.json()
    const aiResponse = anthropicData.content[0].text

    // Parse JSON from AI response
    let analysisResult
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) ||
                       aiResponse.match(/```\n([\s\S]*?)\n```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse
      analysisResult = JSON.parse(jsonStr)
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse)
      throw new Error('Failed to parse AI analysis result')
    }

    // Save to Supabase (optional, for caching)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    await supabase.from('personality_analysis_cache').upsert({
      username: cleanUsername,
      analysis_result: analysisResult,
      created_at: new Date().toISOString()
    }, { onConflict: 'username' })

    // Return result
    return new Response(
      JSON.stringify({
        success: true,
        username: cleanUsername,
        avatarUrl,
        analysis: analysisResult
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
