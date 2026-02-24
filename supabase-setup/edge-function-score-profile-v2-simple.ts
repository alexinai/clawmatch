// Supabase Edge Function: score-twitter-profile
// 简化测试版本 - 用于调试基本功能

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { twitterUsername } = await req.json()

    if (!twitterUsername) {
      throw new Error('Twitter username is required')
    }

    const cleanUsername = twitterUsername.replace('@', '')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // 1. 检查是否已存在（关键修复：使用 maybeSingle）
    const { data: existing } = await supabaseClient
      .from('observatory_profiles')
      .select('id, status')
      .eq('twitter_username', cleanUsername)
      .maybeSingle()

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
        twitter_username: cleanUsername,
        status: 'analyzing',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    // 3. 异步处理：生成评分（简化版，不抓取头像）
    setTimeout(async () => {
      try {
        console.log(`开始分析用户: ${cleanUsername}`)

        const mockScore = {
          twitter_name: `Test User ${Math.floor(Math.random() * 1000)}`,
          twitter_handle: `@${cleanUsername}`,
          agent_score: Math.floor(Math.random() * 20) + 80,
          human_score: Math.floor(Math.random() * 20) + 80,
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
          // 简化版：直接使用 unavatar.io，不做复杂的 API 调用
          profile_image_url: `https://unavatar.io/twitter/${cleanUsername}`,
          status: 'completed',
        }

        console.log(`评分完成`)

        const { error: updateError } = await supabaseClient
          .from('observatory_profiles')
          .update(mockScore)
          .eq('id', profile.id)

        if (updateError) {
          console.error('Update error:', updateError)
        }

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

    // 4. 立即返回成功响应
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
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
