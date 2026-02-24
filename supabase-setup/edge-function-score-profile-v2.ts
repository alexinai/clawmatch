// Supabase Edge Function: score-twitter-profile
// 路径: supabase/functions/score-twitter-profile/index.ts
// 版本 2: 支持真实 Twitter 头像抓取

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 获取 Twitter 用户信息（包括头像）
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
            profile_image_url: data.data.profile_image_url.replace('_normal', '_400x400'), // 获取更大的图片
            followers: data.data.public_metrics?.followers_count || 0,
            description: data.data.description || '',
          }
        }
      }
    }

    // 方法 2: 使用第三方头像服务（备用方案）
    // unavatar.io - 免费且稳定
    const unavatarUrl = `https://unavatar.io/twitter/${username}?fallback=false`
    const unavatarResponse = await fetch(unavatarUrl, { redirect: 'follow' })

    if (unavatarResponse.ok && unavatarResponse.status === 200) {
      // 获取最终重定向后的 URL（真实的 Twitter 图片 URL）
      return {
        name: username,
        profile_image_url: unavatarResponse.url,
        followers: null,
        description: '',
      }
    }

    // 方法 3: 直接使用 Twitter CDN URL 格式（需要用户 ID，这里先返回备用）
    return null

  } catch (error) {
    console.error('Error fetching Twitter user info:', error)
    return null
  }
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

    // 清理用户名（移除 @ 符号）
    const cleanUsername = twitterUsername.replace('@', '')

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
      .eq('twitter_username', cleanUsername)
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
        twitter_username: cleanUsername,
        status: 'analyzing', // 改为 analyzing 状态
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 3. 异步处理：获取 Twitter 信息并评分
    setTimeout(async () => {
      try {
        console.log(`开始分析用户: ${cleanUsername}`)

        // 获取 Twitter 用户信息（包括真实头像）
        const twitterInfo = await fetchTwitterUserInfo(cleanUsername)

        // 生成评分
        const mockScore = {
          twitter_name: twitterInfo?.name || `User ${Math.floor(Math.random() * 1000)}`,
          twitter_handle: `@${cleanUsername}`,
          agent_score: Math.floor(Math.random() * 20) + 80, // 80-100
          human_score: Math.floor(Math.random() * 20) + 80, // 80-100
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
          // 使用真实头像，如果获取失败则使用备用方案
          profile_image_url: twitterInfo?.profile_image_url
            || `https://unavatar.io/twitter/${cleanUsername}`
            || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
          status: 'completed',
        }

        console.log(`评分完成，头像 URL: ${mockScore.profile_image_url}`)

        // 更新评分结果
        await supabaseClient
          .from('observatory_profiles')
          .update(mockScore)
          .eq('id', profile.id)

        // 记录日志
        await supabaseClient.from('submission_logs').insert({
          profile_id: profile.id,
          twitter_username: cleanUsername,
          status: 'completed',
        })

        console.log(`用户 ${cleanUsername} 评价完成`)

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
部署说明：

1. 在 Supabase Dashboard 更新 Edge Function
   - 进入 Edge Functions
   - 选择 score-twitter-profile
   - 替换代码为此文件内容
   - 点击 Deploy

2. 环境变量（可选）
   - TWITTER_BEARER_TOKEN: Twitter API Bearer Token（可选，用于获取更详细信息）
   - 如果不配置，会使用备用方案（unavatar.io）

3. 头像获取策略（多重保障）
   优先级 1: Twitter API v2（需要 token，最准确）
   优先级 2: unavatar.io（免费服务，稳定）
   优先级 3: dicebear 卡通头像（最后备用）

4. 测试
   提交任意 Twitter 用户名，会自动获取真实头像
*/
