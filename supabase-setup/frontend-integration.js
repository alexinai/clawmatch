/**
 * ClawMatch Observatory - Supabase Integration JavaScript
 *
 * 将此代码添加到 index.html 中，替换现有的相关函数
 * 位置：在 observatoryProfiles 定义之后
 */

// ========== 数据加载函数 ==========

// 全局变量：已加载的 profiles（从 Supabase 或本地）
let loadedProfiles = [];
let isLoadingProfiles = false;

/**
 * 从 Supabase 加载所有已完成的评价
 */
async function loadProfilesFromSupabase() {
    if (!supabase) {
        console.warn('Supabase 不可用，使用本地数据');
        return observatoryProfiles; // 回退到硬编码数据
    }

    try {
        isLoadingProfiles = true;

        const { data, error } = await supabase
            .from('observatory_profiles')
            .select('*')
            .eq('status', 'completed')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 转换 Supabase 数据格式为前端格式
        const profiles = data.map(profile => ({
            id: profile.id,
            username: profile.twitter_username,
            name: profile.twitter_name || profile.twitter_username,
            url: `https://x.com/${profile.twitter_username}`,
            avatar: profile.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.twitter_username}`,
            agentScore: profile.agent_score,
            humanScore: profile.human_score,
            tags: profile.tags || [],
            bio: `${profile.details?.specialty || 'AI Enthusiast'} • ${profile.details?.followers || '0'} followers`,
            lobsterComment: `这是一位${profile.details?.influence || '优质用户'}，${profile.details?.activity || '活跃度高'}。This is a ${profile.details?.influence || 'quality user'} with ${profile.details?.activity || 'high activity'}.`,
            details: profile.details || {},
            addedDate: profile.created_at
        }));

        console.log(`✅ 从 Supabase 加载了 ${profiles.length} 条评价`);
        return profiles;

    } catch (error) {
        console.error('❌ 加载评价失败:', error);
        return observatoryProfiles; // 回退到本地数据
    } finally {
        isLoadingProfiles = false;
    }
}

/**
 * 初始化 Observatory 页面（加载数据）
 */
async function initObservatory() {
    // 显示加载中状态
    const container = document.getElementById('profiles-list');
    if (container) {
        container.innerHTML = `
            <div class="empty-msg">
                <div class="empty-msg-icon">⏳</div>
                <div class="empty-msg-text">正在加载评价数据...</div>
                <div style="color: #666; font-size: 0.9rem; margin-top: 10px;">Loading profiles...</div>
            </div>
        `;
    }

    // 加载数据
    loadedProfiles = await loadProfilesFromSupabase();

    // 渲染
    renderObservatory();

    // 设置实时监听（当新评价完成时自动更新）
    setupRealtimeSubscription();
}

/**
 * 设置 Supabase 实时订阅
 */
function setupRealtimeSubscription() {
    if (!supabase) return;

    try {
        supabase
            .channel('observatory_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'observatory_profiles',
                    filter: 'status=eq.completed'
                },
                async (payload) => {
                    console.log('🔔 检测到新评价:', payload);
                    // 重新加载数据
                    loadedProfiles = await loadProfilesFromSupabase();
                    renderObservatory();
                }
            )
            .subscribe();

        console.log('✅ 实时监听已启动');
    } catch (error) {
        console.warn('⚠️ 实时监听设置失败:', error);
    }
}

// ========== 修改后的 renderObservatory 函数 ==========

function renderObservatory() {
    const container = document.getElementById('profiles-list');
    const profiles = loadedProfiles.length > 0 ? loadedProfiles : observatoryProfiles;

    document.getElementById('profile-total').textContent = profiles.length;
    document.getElementById('profile-total-en').textContent = profiles.length;

    if (profiles.length === 0) {
        container.innerHTML = `
            <div class="empty-msg">
                <div class="empty-msg-icon">🔭</div>
                <div class="empty-msg-text">暂无评价数据，快来提交第一个吧！</div>
                <div style="color: #666; font-size: 0.9rem; margin-top: 10px;">No profiles yet. Be the first to submit!</div>
            </div>
        `;
        return;
    }

    // 应用排序
    let sortedProfiles = [...profiles];
    switch(currentSortMethod) {
        case 'agent-score':
            sortedProfiles.sort((a, b) => b.agentScore - a.agentScore);
            break;
        case 'human-score':
            sortedProfiles.sort((a, b) => b.humanScore - a.humanScore);
            break;
        case 'total-score':
            sortedProfiles.sort((a, b) => (b.agentScore + b.humanScore) - (a.agentScore + a.humanScore));
            break;
        case 'newest':
        default:
            sortedProfiles.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
            break;
    }

    // 渲染列表（保持原有的 HTML 模板）
    container.innerHTML = sortedProfiles.map(profile => `
        <div class="profile-item" onclick="toggleProfileDetails('${profile.id}')">
            <img src="${profile.avatar}" alt="${profile.name}" class="profile-avatar">
            <div class="profile-info">
                <div class="profile-header">
                    <div>
                        <h3 class="profile-name">${profile.name}</h3>
                        <a href="${profile.url}" target="_blank" class="profile-handle" onclick="event.stopPropagation()">@${profile.username}</a>
                    </div>
                    <div class="profile-scores">
                        <div class="score-badge">
                            <span class="score-label">Agent Attract</span>
                            <span class="score-value">${profile.agentScore}</span>
                        </div>
                        <div class="score-badge">
                            <span class="score-label">Human Attract</span>
                            <span class="score-value">${profile.humanScore}</span>
                        </div>
                    </div>
                </div>
                <div class="profile-tags">
                    ${profile.tags.map(tag => `<span class="profile-tag">${tag}</span>`).join('')}
                </div>
                <div class="profile-bio">${profile.bio}</div>
                <div class="lobster-comment">
                    <div class="lobster-comment-label">🦞 小龙虾点评 | Lobster's Take</div>
                    <div class="lobster-comment-text">${profile.lobsterComment}</div>
                </div>

                <!-- 详细信息 -->
                <div class="profile-details" id="details-${profile.id}">
                    <div class="detail-section">
                        <h4>📊 详细数据 | Detailed Analytics</h4>
                        <div class="detail-item">
                            <span class="detail-label">关注者 Followers</span>
                            <span class="detail-value">${profile.details.followers || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">推文数 Tweets</span>
                            <span class="detail-value">${profile.details.tweets || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">影响力 Influence</span>
                            <span class="detail-value">${profile.details.influence || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">专长领域 Specialty</span>
                            <span class="detail-value">${profile.details.specialty || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">活跃度 Activity</span>
                            <span class="detail-value">${profile.details.activity || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">内容质量 Content</span>
                            <span class="detail-value">${profile.details.contentQuality || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">互动率 Engagement</span>
                            <span class="detail-value">${profile.details.engagement || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="expand-indicator" id="indicator-${profile.id}">
                    点击查看详细分析 ▼ | Click to see details ▼
                </div>
            </div>
        </div>
    `).join('');
}

// ========== 修改后的 submitProfile 函数 ==========

async function submitProfile() {
    const input = document.getElementById('twitter-input');
    const statusDiv = document.getElementById('submit-status');
    const submitBtn = event.target;

    let username = input.value.trim();

    if (!username) {
        statusDiv.innerHTML = '<span style="color: var(--pink);">⚠️ 请输入 Twitter 用户名或链接 | Please enter a Twitter username or URL</span>';
        return;
    }

    // 提取用户名
    if (username.includes('x.com/') || username.includes('twitter.com/')) {
        const match = username.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/);
        if (match) username = match[1];
    }
    if (username.startsWith('@')) {
        username = username.slice(1);
    }

    // 检查是否已存在
    const profiles = loadedProfiles.length > 0 ? loadedProfiles : observatoryProfiles;
    if (profiles.some(p => p.username.toLowerCase() === username.toLowerCase())) {
        statusDiv.innerHTML = '<span style="color: var(--pink);">⚠️ 该用户已被评价过了 | This user has already been reviewed</span>';
        return;
    }

    // 显示提交状态
    submitBtn.disabled = true;
    submitBtn.textContent = '小龙虾正在分析中... Analyzing...';
    statusDiv.innerHTML = '<span style="color: var(--claw-blue);">🔍 小龙虾正在浏览 @' + username + ' 的推特... | Lobster is analyzing the profile...</span>';

    // 如果 Supabase 可用，调用 Edge Function
    if (supabase) {
        try {
            const { data, error } = await supabase.functions.invoke('score-twitter-profile', {
                body: { twitterUsername: username }
            });

            if (error) throw error;

            statusDiv.innerHTML = '<span style="color: #4ade80;">✅ 提交成功！小龙虾正在评分中... | Submitted! Scoring in progress...</span>';

            // 3秒后重新加载数据
            setTimeout(async () => {
                loadedProfiles = await loadProfilesFromSupabase();
                renderObservatory();
                statusDiv.innerHTML = '<span style="color: #4ade80;">✅ 评价完成！已添加到列表 | Review complete! Added to the list.</span>';

                setTimeout(() => {
                    statusDiv.innerHTML = '';
                }, 3000);
            }, 3000);

        } catch (error) {
            console.error('提交失败:', error);
            statusDiv.innerHTML = '<span style="color: var(--pink);">❌ 提交失败: ' + error.message + '</span>';
            submitBtn.disabled = false;
            submitBtn.textContent = '提交评价 Submit';
            return;
        }
    } else {
        // Supabase 不可用，显示演示消息
        setTimeout(() => {
            statusDiv.innerHTML = '<span style="color: #4ade80;">✅ 评价完成！已添加到列表 | Review complete! Added to the list.</span>';
            submitBtn.disabled = false;
            submitBtn.textContent = '提交评价 Submit';
            input.value = '';

            alert('🚧 Demo Mode\n\n当前为演示模式。要启用真实后端功能：\n1. 完成 Supabase 配置\n2. 部署 Edge Function\n3. 更新前端 API keys\n\n详见: supabase-setup/README-SETUP-GUIDE.md');

            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 5000);
        }, 3000);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = '提交评价 Submit';
    input.value = '';
}

// ========== 页面切换时初始化 ==========

// 修改原有的 switchPage 函数，在切换到 Observatory 时初始化数据
const originalSwitchPage = switchPage;
window.switchPage = function(page, subPage) {
    originalSwitchPage(page, subPage);

    // 如果切换到 Observatory 页面，且数据还未加载
    if (page === 'observatory' && loadedProfiles.length === 0 && !isLoadingProfiles) {
        initObservatory();
    }
};

// 页面加载时，如果当前在 Observatory 页面，初始化数据
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.slice(1) || 'human';
    if (hash === 'observatory') {
        initObservatory();
    }
});

console.log('✅ Supabase 集成代码已加载');
