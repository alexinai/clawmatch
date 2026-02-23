// Supabase Edge Function: score-twitter-profile
// 路径: supabase/functions/score-twitter-profile/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 获取请求参数
    const { twitterUsername } = await req.json()

    if (!twitterUsername) {
      throw new Error('Twitter username is required')
    }

    // 初始化 Supabase 客户端
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // 1. 检查是否已存在
    const { data: existing, error: checkError } = await supabaseClient
      .from('observatory_profiles')
      .select('id, status')
      .eq('twitter_username', twitterUsername)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '该用户已被评价过了',
          data: existing,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        }
      )
    }

    // 2. 创建待处理记录
    const { data: profile, error: insertError } = await supabaseClient
      .from('observatory_profiles')
      .insert({
        twitter_username: twitterUsername,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 3. 异步处理评分（实际应该调用 Twitter API 和 AI 评分）
    // 这里使用模拟数据，实际应该：
    // - 调用 Twitter API 获取用户信息
    // - 使用 AI（Gemini/OpenAI）分析推文内容
    // - 生成 Agent Score 和 Human Score

    // 模拟异步评分
    setTimeout(async () => {
      try {
        // 模拟评分结果
        const mockScore = {
          twitter_name: `User ${Math.floor(Math.random() * 1000)}`,
          twitter_handle: `@${twitterUsername}`,
          agent_score: Math.floor(Math.random() * 20) + 80, // 80-100
          human_score: Math.floor(Math.random() * 20) + 80, // 80-100
          tags: ['AI Enthusiast', 'Tech Savvy', 'Creative'],
          details: {
            followers: `${(Math.random() * 50 + 10).toFixed(1)}K`,
            tweets: `${Math.floor(Math.random() * 10000 + 5000).toLocaleString()}`,
            influence: '活跃用户',
            specialty: 'AI & Technology',
            activity: '每日活跃',
            contentQuality: `${Math.floor(Math.random() * 10) + 90}/100`,
            engagement: `${(Math.random() * 5 + 5).toFixed(1)}%`,
          },
          profile_image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${twitterUsername}`,
          status: 'completed',
        }

        // 更新评分结果
        await supabaseClient
          .from('observatory_profiles')
          .update(mockScore)
          .eq('id', profile.id)

        // 记录日志
        await supabaseClient.from('submission_logs').insert({
          profile_id: profile.id,
          twitter_username: twitterUsername,
          status: 'completed',
        })
      } catch (error) {
        console.error('Error updating profile:', error)
        // 更新为失败状态
        await supabaseClient
          .from('observatory_profiles')
          .update({ status: 'failed' })
          .eq('id', profile.id)
      }
    }, 3000) // 3秒后完成

    // 4. 立即返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        message: '提交成功，小龙虾正在分析中...',
        data: {
          id: profile.id,
          twitter_username: twitterUsername,
          status: 'pending',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

/*
使用说明：
1. 在 Supabase Dashboard 创建新的 Edge Function
2. 将此代码复制到 index.ts
3. 设置环境变量：
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - TWITTER_BEARER_TOKEN (如果要真实调用 Twitter API)
4. 部署：supabase functions deploy score-twitter-profile
*/
