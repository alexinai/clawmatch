// 增强版性格分析算法 - 深度性癖与择偶分析
// 版本: v2.0 Enhanced

/**
 * 深度性癖分析（S/M/Switch倾向）
 */
function analyzeIntimacyEnhanced(scores, usernameAnalysis, avatarAnalysis) {
    const { bigFive } = scores.breakdown;
    let analysis = '';

    // ============================================
    // 1. S/M/Switch 倾向分析
    // ============================================
    analysis += '<h4>🔥 S/M 倾向分析</h4>';

    const dominanceScore = calculateDominanceScore(bigFive, usernameAnalysis, avatarAnalysis);

    if (dominanceScore > 65) {
        analysis += '<div class="sm-badge s-badge">S 倾向 (支配型)</div>';
        analysis += '<p><strong>支配倾向指数</strong>: <span class="highlight-score">' + dominanceScore + '/100</span></p>';
        analysis += '<ul>';
        analysis += '<li>🔴 <strong>心理特征</strong>: 喜欢掌控局面，享受引导和指挥的快感</li>';
        analysis += '<li>💪 <strong>行为模式</strong>: 主动发起互动，倾向于设定规则和节奏</li>';
        analysis += '<li>🎯 <strong>性张力表现</strong>: 通过强势的言语和行为表达，喜欢看到对方的顺从反应</li>';
        analysis += '<li>⚡ <strong>权力动态</strong>: 在关系中寻求控制感和主导地位</li>';
        analysis += '<li>🎭 <strong>角色偏好</strong>: Teacher/Student, Boss/Subordinate, Dom/Sub</li>';
        analysis += '</ul>';
    } else if (dominanceScore < 35) {
        analysis += '<div class="sm-badge m-badge">M 倾向 (顺从型)</div>';
        analysis += '<p><strong>顺从倾向指数</strong>: <span class="highlight-score">' + (100 - dominanceScore) + '/100</span></p>';
        analysis += '<ul>';
        analysis += '<li>🔵 <strong>心理特征</strong>: 享受被引导和照顾，从顺从中获得满足感</li>';
        analysis += '<li>💙 <strong>行为模式</strong>: 倾向于响应而非发起，喜欢被动接受</li>';
        analysis += '<li>🎯 <strong>性张力表现</strong>: 通过顺从和取悦行为传达，享受被征服的感觉</li>';
        analysis += '<li>⚡ <strong>权力动态</strong>: 在关系中寻求被保护和被掌控的安全感</li>';
        analysis += '<li>🎭 <strong>角色偏好</strong>: Student/Teacher, Pet/Owner, Sub/Dom</li>';
        analysis += '</ul>';
    } else {
        analysis += '<div class="sm-badge switch-badge">Switch 倾向 (切换型)</div>';
        analysis += '<p><strong>平衡指数</strong>: <span class="highlight-score">' + Math.abs(50 - dominanceScore) + '/50</span> (越低越平衡)</p>';
        analysis += '<ul>';
        analysis += '<li>🟣 <strong>心理特征</strong>: 可支配可顺从，根据对象和情境灵活切换</li>';
        analysis += '<li>⚖️ <strong>行为模式</strong>: 善于读取对方需求，自适应调整角色</li>';
        analysis += '<li>🎯 <strong>性张力表现</strong>: 多变化，可强势可温柔，层次丰富</li>';
        analysis += '<li>⚡ <strong>权力动态</strong>: 享受角色转换的刺激，不固定于单一模式</li>';
        analysis += '<li>🎭 <strong>角色偏好</strong>: 多元化，根据伴侣调整</li>';
        analysis += '</ul>';
    }

    // ============================================
    // 2. 性张力表现多维度分析
    // ============================================
    analysis += '<h4>⚡ 性张力表现维度</h4>';

    // 2.1 表达方式
    analysis += '<div class="dimension-card">';
    analysis += '<h5>💬 表达方式</h5>';
    if (bigFive.extraversion > 75) {
        analysis += '<p><strong>类型</strong>: 直接外放型</p>';
        analysis += '<ul>';
        analysis += '<li>善于用语言和肢体直接表达欲望</li>';
        analysis += '<li>不掩饰需求，主动创造性张力氛围</li>';
        analysis += '<li>可能喜欢调情、暗示、挑逗性对话</li>';
        analysis += '</ul>';
    } else if (bigFive.extraversion < 40) {
        analysis += '<p><strong>类型</strong>: 含蓄内敛型</p>';
        analysis += '<ul>';
        analysis += '<li>通过微妙的眼神、动作传递信号</li>';
        analysis += '<li>喜欢暗示而非明示，享受暧昧的模糊感</li>';
        analysis += '<li>需要对方主动捕捉和回应暗示</li>';
        analysis += '</ul>';
    } else {
        analysis += '<p><strong>类型</strong>: 适度表达型</p>';
        analysis += '<ul>';
        analysis += '<li>可直接可含蓄，根据情境调整</li>';
        analysis += '<li>在熟悉的对象面前更主动</li>';
        analysis += '<li>善于把握分寸和时机</li>';
        analysis += '</ul>';
    }
    analysis += '</div>';

    // 2.2 视觉刺激敏感度
    analysis += '<div class="dimension-card">';
    analysis += '<h5>👁️ 视觉刺激敏感度</h5>';
    if (avatarAnalysis.type === 'real_photo') {
        analysis += '<p><strong>敏感度</strong>: 高 - 注重视觉印象</p>';
        analysis += '<ul>';
        analysis += '<li>愿意展示真实形象，说明对外表有自信</li>';
        analysis += '<li>性张力中视觉元素占比重，外表吸引力很重要</li>';
        analysis += '<li>可能喜欢视觉刺激（穿搭、氛围营造等）</li>';
        analysis += '</ul>';
    } else {
        analysis += '<p><strong>敏感度</strong>: 中低 - 更注重精神层面</p>';
        analysis += '<ul>';
        analysis += '<li>不过分展示外表，可能更看重内在</li>';
        analysis += '<li>性张力更多来自对话、氛围、心理互动</li>';
        analysis += '<li>视觉刺激是加分项而非必需项</li>';
        analysis += '</ul>';
    }
    analysis += '</div>';

    // 2.3 节奏偏好
    analysis += '<div class="dimension-card">';
    analysis += '<h5>🎵 节奏偏好</h5>';
    if (bigFive.conscientiousness > 70) {
        analysis += '<p><strong>节奏</strong>: 循序渐进型</p>';
        analysis += '<ul>';
        analysis += '<li>喜欢按部就班地升温，不喜欢过于仓促</li>';
        analysis += '<li>注重仪式感和过程体验</li>';
        analysis += '<li>需要时间建立信任和舒适感</li>';
        analysis += '</ul>';
    } else if (bigFive.conscientiousness < 40) {
        analysis += '<p><strong>节奏</strong>: 即兴冲动型</p>';
        analysis += '<ul>';
        analysis += '<li>更享受spontaneous的激情时刻</li>';
        analysis += '<li>可以快速升温，不需要太多铺垫</li>';
        analysis += '<li>喜欢新鲜感和意外惊喜</li>';
        analysis += '</ul>';
    } else {
        analysis += '<p><strong>节奏</strong>: 灵活调节型</p>';
        analysis += '<ul>';
        analysis += '<li>可快可慢，根据情境和对象调整</li>';
        analysis += '<li>既享受缓慢升温，也不排斥快节奏</li>';
        analysis += '<li>重视双方的默契和节奏配合</li>';
        analysis += '</ul>';
    }
    analysis += '</div>';

    // 2.4 创意开放度
    analysis += '<div class="dimension-card">';
    analysis += '<h5>🎨 创意与探索</h5>';
    if (bigFive.openness > 75) {
        analysis += '<p><strong>开放度</strong>: 极高 - 乐于尝试</p>';
        analysis += '<ul>';
        analysis += '<li>对新奇玩法、角色扮演接受度高</li>';
        analysis += '<li>愿意探索非传统的方式和场景</li>';
        analysis += '<li>可能对Cosplay、情境模拟、道具使用感兴趣</li>';
        analysis += '<li>享受打破常规、挑战边界的刺激感</li>';
        analysis += '</ul>';
    } else if (bigFive.openness < 40) {
        analysis += '<p><strong>开放度</strong>: 保守 - 偏好传统</p>';
        analysis += '<ul>';
        analysis += '<li>更喜欢传统、熟悉的方式</li>';
        analysis += '<li>对新奇玩法可能需要时间接受</li>';
        analysis += '<li>注重舒适感和安全感</li>';
        analysis += '</ul>';
    } else {
        analysis += '<p><strong>开放度</strong>: 中等 - 适度探索</p>';
        analysis += '<ul>';
        analysis += '<li>在熟悉的基础上可以尝试新玩法</li>';
        analysis += '<li>需要循序渐进地拓展边界</li>';
        analysis += '<li>愿意尝试但不过分激进</li>';
        analysis += '</ul>';
    }
    analysis += '</div>';

    return analysis;
}

/**
 * 计算支配倾向分数（0-100，越高越S，越低越M）
 */
function calculateDominanceScore(bigFive, usernameAnalysis, avatarAnalysis) {
    let score = 50; // 基准分

    // 外向性影响（+30%）
    if (bigFive.extraversion > 75) score += 20;
    else if (bigFive.extraversion > 60) score += 10;
    else if (bigFive.extraversion < 30) score -= 20;
    else if (bigFive.extraversion < 45) score -= 10;

    // 尽责性影响（+20%）
    if (bigFive.conscientiousness > 75) score += 15; // 高尽责 = 喜欢掌控
    else if (bigFive.conscientiousness < 40) score -= 10;

    // 开放性影响（Switch倾向，+15%）
    if (bigFive.openness > 80) score += 5; // 极高开放性可能Switch

    // 用户名风格影响（+20%）
    if (usernameAnalysis.style === 'professional' || usernameAnalysis.style === 'real_name') {
        score += 10; // 专业/真名 = 自信 = S倾向
    } else if (usernameAnalysis.style === 'random') {
        score -= 15; // 随机/隐秘 = M倾向
    }

    // 头像类型影响（+15%）
    if (avatarAnalysis.type === 'real_photo') {
        score += 8; // 真人照 = 自信 = S倾向
    } else if (avatarAnalysis.type === 'default_cartoon') {
        score -= 12; // 默认头像 = 低调 = M倾向
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * 择偶偏好分析（Mate Preference Analysis）
 */
function analyzeMatePreference(scores, usernameAnalysis, avatarAnalysis) {
    const { bigFive } = scores.breakdown;
    let analysis = '';

    analysis += '<div class="mate-preference-container">';

    // ============================================
    // 1. 年龄偏好
    // ============================================
    analysis += '<div class="preference-section">';
    analysis += '<h4>🎂 年龄偏好倾向</h4>';

    if (bigFive.openness > 75 && bigFive.extraversion > 70) {
        analysis += '<p><strong>偏好类型</strong>: 年龄跨度大，开放包容</p>';
        analysis += '<ul>';
        analysis += '<li>📊 <strong>年龄范围</strong>: ±10岁以上都可接受</li>';
        analysis += '<li>💡 不拘泥于年龄数字，更看重精神契合度</li>';
        analysis += '<li>🎯 可能对<strong>成熟型</strong>（年长）和<strong>活力型</strong>（年轻）都有兴趣</li>';
        analysis += '<li>⚡ 吸引点：思想深度、人生阅历、新鲜活力</li>';
        analysis += '</ul>';
    } else if (bigFive.conscientiousness > 70) {
        analysis += '<p><strong>偏好类型</strong>: 同龄或略年长，注重稳定</p>';
        analysis += '<ul>';
        analysis += '<li>📊 <strong>年龄范围</strong>: ±3-5岁左右</li>';
        analysis += '<li>💡 倾向于选择<strong>成熟稳重</strong>的同龄或略年长对象</li>';
        analysis += '<li>🎯 看重对方的<strong>社会地位</strong>和<strong>经济能力</strong></li>';
        analysis += '<li>⚡ 吸引点：成熟、可靠、有规划</li>';
        analysis += '</ul>';
    } else if (bigFive.extraversion > 75) {
        analysis += '<p><strong>偏好类型</strong>: 活力型，偏好年轻或同龄</p>';
        analysis += '<ul>';
        analysis += '<li>📊 <strong>年龄范围</strong>: 同龄或年轻 ±5岁</li>';
        analysis += '<li>💡 喜欢<strong>有活力</strong>、<strong>爱玩</strong>的对象</li>';
        analysis += '<li>🎯 注重<strong>共同话题</strong>和<strong>社交契合度</strong></li>';
        analysis += '<li>⚡ 吸引点：青春、活力、幽默感</li>';
        analysis += '</ul>';
    } else {
        analysis += '<p><strong>偏好类型</strong>: 灵活型，年龄非主要考量</p>';
        analysis += '<ul>';
        analysis += '<li>📊 <strong>年龄范围</strong>: 较宽泛，±7岁左右</li>';
        analysis += '<li>💡 年龄是参考而非决定因素</li>';
        analysis += '<li>🎯 更看重<strong>性格契合</strong>和<strong>价值观</strong></li>';
        analysis += '</ul>';
    }
    analysis += '</div>';

    // ============================================
    // 2. 性别/性向偏好
    // ============================================
    analysis += '<div class="preference-section">';
    analysis += '<h4>🌈 性别与性向倾向</h4>';

    if (bigFive.openness > 80) {
        analysis += '<p><strong>开放度</strong>: 高度开放，可能流动性向</p>';
        analysis += '<ul>';
        analysis += '<li>🏳️‍🌈 对不同性别身份接受度高</li>';
        analysis += '<li>💫 可能是<strong>Bisexual</strong>或<strong>Pansexual</strong>倾向</li>';
        analysis += '<li>🎯 更注重<strong>个体本身</strong>而非性别标签</li>';
        analysis += '<li>⚡ 吸引点：灵魂契合度、personality、气质</li>';
        analysis += '</ul>';
    } else if (bigFive.conscientiousness > 70) {
        analysis += '<p><strong>开放度</strong>: 传统偏好，异性倾向为主</p>';
        analysis += '<ul>';
        analysis += '<li>👫 倾向传统的异性恋关系</li>';
        analysis += '<li>💑 注重<strong>传统价值观</strong>和<strong>社会认同</strong></li>';
        analysis += '<li>🎯 偏好明确的性别角色定位</li>';
        analysis += '</ul>';
    } else {
        analysis += '<p><strong>开放度</strong>: 中等，以异性为主但不排斥</p>';
        analysis += '<ul>';
        analysis += '<li>👥 主要异性倾向，但对其他可能性保持开放</li>';
        analysis += '<li>🎯 更看重<strong>个人魅力</strong>而非严格的性别界限</li>';
        analysis += '<li>⚡ 特殊情况下可能被特定气质的同性吸引</li>';
        analysis += '</ul>';
    }
    analysis += '</div>';

    // ============================================
    // 3. 性格偏好
    // ============================================
    analysis += '<div class="preference-section">';
    analysis += '<h4>💭 理想对象性格</h4>';

    const dominanceScore = calculateDominanceScore(bigFive, usernameAnalysis, avatarAnalysis);

    if (dominanceScore > 65) {
        // S倾向 -> 喜欢M或可塑性强的对象
        analysis += '<p><strong>互补性格</strong>: 偏好顺从、温柔、可引导型</p>';
        analysis += '<ul>';
        analysis += '<li>🎯 理想类型：<strong>乖巧听话</strong>、<strong>依赖性强</strong>、<strong>易害羞</strong></li>';
        analysis += '<li>💕 喜欢对方的特质：顺从、崇拜、信任、愿意被引导</li>';
        analysis += '<li>❌ 不喜欢：过于强势、争夺主导权、不服管教</li>';
        analysis += '<li>⚡ 关键词：小鸟依人、温顺、听话、可爱</li>';
        analysis += '</ul>';
    } else if (dominanceScore < 35) {
        // M倾向 -> 喜欢S或强势的对象
        analysis += '<p><strong>互补性格</strong>: 偏好强势、主导、保护欲强型</p>';
        analysis += '<ul>';
        analysis += '<li>🎯 理想类型：<strong>强势霸道</strong>、<strong>有掌控力</strong>、<strong>保护欲强</strong></li>';
        analysis += '<li>💕 喜欢对方的特质：自信、果断、领导力、安全感</li>';
        analysis += '<li>❌ 不喜欢：过于被动、优柔寡断、需要自己做主</li>';
        analysis += '<li>⚡ 关键词：霸道总裁、女王/国王范、强势、可靠</li>';
        analysis += '</ul>';
    } else {
        // Switch -> 喜欢也能切换的对象
        analysis += '<p><strong>多元性格</strong>: 偏好灵活、多面、有层次感</p>';
        analysis += '<ul>';
        analysis += '<li>🎯 理想类型：<strong>可刚可柔</strong>、<strong>有反差</strong>、<strong>层次丰富</strong></li>';
        analysis += '<li>💕 喜欢对方的特质：多变、神秘、适应力强、有趣</li>';
        analysis += '<li>❌ 不喜欢：单一刻板、过于极端（纯S或纯M）</li>';
        analysis += '<li>⚡ 关键词：反差萌、多面性、变化、平衡</li>';
        analysis += '</ul>';
    }

    // 补充：基于大五人格的性格偏好
    if (bigFive.extraversion > 75) {
        analysis += '<p><strong>社交维度</strong>: 喜欢<strong>活泼开朗</strong>、<strong>善于社交</strong>的对象</p>';
        analysis += '<ul><li>希望对方也外向，能一起参加社交活动</li><li>享受双方都是"人群焦点"的感觉</li></ul>';
    } else if (bigFive.extraversion < 40) {
        analysis += '<p><strong>社交维度</strong>: 喜欢<strong>安静内敛</strong>、<strong>深度交流</strong>的对象</p>';
        analysis += '<ul><li>偏好两人世界，不喜欢过于喧闹的社交</li><li>希望对方能理解自己的安静需求</li></ul>';
    }

    analysis += '</div>';

    // ============================================
    // 4. 外貌气质偏好
    // ============================================
    analysis += '<div class="preference-section">';
    analysis += '<h4>✨ 外貌与气质偏好</h4>';

    analysis += '<div class="appearance-grid">';

    // 4.1 外貌类型
    analysis += '<div class="appearance-item">';
    analysis += '<h5>👤 外貌类型倾向</h5>';
    if (avatarAnalysis.type === 'real_photo' && bigFive.openness > 70) {
        analysis += '<p><strong>偏好</strong>: 独特气质型 > 传统美型</p>';
        analysis += '<ul>';
        analysis += '<li>🎨 更看重<strong>特殊气质</strong>和<strong>个人风格</strong></li>';
        analysis += '<li>💫 喜欢有<strong>辨识度</strong>、<strong>艺术感</strong>的长相</li>';
        analysis += '<li>⚡ 可能偏好：混血感、欧美风、小众审美</li>';
        analysis += '</ul>';
    } else if (bigFive.conscientiousness > 70) {
        analysis += '<p><strong>偏好</strong>: 传统审美，符合主流标准</p>';
        analysis += '<ul>';
        analysis += '<li>👔 注重<strong>得体</strong>和<strong>端庄</strong></li>';
        analysis += '<li>💼 喜欢<strong>精致</strong>、<strong>讲究</strong>的外表</li>';
        analysis += '<li>⚡ 可能偏好：精英范、知性美、商务风</li>';
        analysis += '</ul>';
    } else {
        analysis += '<p><strong>偏好</strong>: 舒适自然型</p>';
        analysis += '<ul>';
        analysis += '<li>😊 看重<strong>干净</strong>和<strong>舒服</strong>的感觉</li>';
        analysis += '<li>🌿 不需要过度修饰，自然最好</li>';
        analysis += '<li>⚡ 可能偏好：邻家风、清新感、亲和力</li>';
        analysis += '</ul>';
    }
    analysis += '</div>';

    // 4.2 体型偏好
    analysis += '<div class="appearance-item">';
    analysis += '<h5>💪 体型偏好</h5>';
    if (dominanceScore > 65) {
        analysis += '<p><strong>偏好</strong>: 纤细柔软型</p>';
        analysis += '<ul>';
        analysis += '<li>喜欢<strong>娇小</strong>、<strong>柔弱</strong>的体型</li>';
        analysis += '<li>可能偏好瘦或偏瘦身材</li>';
        analysis += '<li>⚡ 关键词：娇小、纤细、柔软</li>';
        analysis += '</ul>';
    } else if (dominanceScore < 35) {
        analysis += '<p><strong>偏好</strong>: 强壮有力型</p>';
        analysis += '<ul>';
        analysis += '<li>喜欢<strong>健硕</strong>、<strong>有肌肉</strong>的体型</li>';
        analysis += '<li>希望从对方身上感受到力量和安全感</li>';
        analysis += '<li>⚡ 关键词：强壮、肌肉、力量感</li>';
        analysis += '</ul>';
    } else {
        analysis += '<p><strong>偏好</strong>: 匀称健康型</p>';
        analysis += '<ul>';
        analysis += '<li>看重<strong>健康</strong>和<strong>比例协调</strong></li>';
        analysis += '<li>不过分追求极端体型</li>';
        analysis += '<li>⚡ 关键词：匀称、健康、自然</li>';
        analysis += '</ul>';
    }
    analysis += '</div>';

    // 4.3 气质偏好
    analysis += '<div class="appearance-item">';
    analysis += '<h5>🌟 气质偏好</h5>';
    if (bigFive.openness > 75) {
        analysis += '<p><strong>气质</strong>: 艺术/独立/神秘型</p>';
        analysis += '<ul>';
        analysis += '<li>🎭 喜欢<strong>有个性</strong>、<strong>有故事</strong>的气质</li>';
        analysis += '<li>✨ 偏好：艺术家气质、文艺范、神秘感</li>';
        analysis += '<li>⚡ 吸引点：独特、深邃、有内涵</li>';
        analysis += '</ul>';
    } else if (bigFive.extraversion > 75) {
        analysis += '<p><strong>气质</strong>: 阳光/活力/开朗型</p>';
        analysis += '<ul>';
        analysis += '<li>☀️ 喜欢<strong>阳光</strong>、<strong>积极</strong>的气质</li>';
        analysis += '<li>😄 偏好：笑容灿烂、活力四射、乐观向上</li>';
        analysis += '<li>⚡ 吸引点：正能量、感染力、亲和力</li>';
        analysis += '</ul>';
    } else {
        analysis += '<p><strong>气质</strong>: 温柔/知性/沉稳型</p>';
        analysis += '<ul>';
        analysis += '<li>📚 喜欢<strong>知性</strong>、<strong>有修养</strong>的气质</li>';
        analysis += '<li>🍃 偏好：温柔、优雅、有深度</li>';
        analysis += '<li>⚡ 吸引点：涵养、智慧、稳重</li>';
        analysis += '</ul>';
    }
    analysis += '</div>';

    // 4.4 穿搭风格
    analysis += '<div class="appearance-item">';
    analysis += '<h5>👗 穿搭风格偏好</h5>';
    if (bigFive.openness > 75) {
        analysis += '<p><strong>风格</strong>: 个性潮流型</p>';
        analysis += '<ul>';
        analysis += '<li>👾 喜欢<strong>有设计感</strong>、<strong>潮流</strong>的穿搭</li>';
        analysis += '<li>🎨 可能偏好：街头风、暗黑风、未来感、vintage</li>';
        analysis += '</ul>';
    } else if (bigFive.conscientiousness > 70) {
        analysis += '<p><strong>风格</strong>: 精致优雅型</p>';
        analysis += '<ul>';
        analysis += '<li>💎 喜欢<strong>精致</strong>、<strong>讲究</strong>的穿搭</li>';
        analysis += '<li>✨ 可能偏好：轻奢风、商务风、优雅风</li>';
        analysis += '</ul>';
    } else {
        analysis += '<p><strong>风格</strong>: 舒适休闲型</p>';
        analysis += '<ul>';
        analysis += '<li>👕 喜欢<strong>简洁</strong>、<strong>舒适</strong>的穿搭</li>';
        analysis += '<li>🌿 可能偏好：休闲风、运动风、极简风</li>';
        analysis += '</ul>';
    }
    analysis += '</div>';

    analysis += '</div>'; // appearance-grid
    analysis += '</div>'; // preference-section

    // ============================================
    // 5. 综合择偶画像
    // ============================================
    analysis += '<div class="preference-section ideal-portrait">';
    analysis += '<h4>💕 理想对象画像总结</h4>';
    analysis += generateIdealPortrait(bigFive, dominanceScore, usernameAnalysis, avatarAnalysis);
    analysis += '</div>';

    analysis += '</div>'; // mate-preference-container

    return analysis;
}

/**
 * 生成理想对象画像
 */
function generateIdealPortrait(bigFive, dominanceScore, usernameAnalysis, avatarAnalysis) {
    let portrait = '<div class="ideal-portrait-card">';

    portrait += '<div class="portrait-header">根据你的性格分析，推测你的理想型：</div>';

    portrait += '<div class="portrait-features">';

    // 年龄
    if (bigFive.conscientiousness > 70) {
        portrait += '<div class="portrait-item">📅 <strong>年龄</strong>: 同龄或略年长（成熟稳重型）</div>';
    } else if (bigFive.extraversion > 75) {
        portrait += '<div class="portrait-item">📅 <strong>年龄</strong>: 同龄或年轻（活力型）</div>';
    } else {
        portrait += '<div class="portrait-item">📅 <strong>年龄</strong>: 年龄跨度大，看缘分</div>';
    }

    // 性格
    if (dominanceScore > 65) {
        portrait += '<div class="portrait-item">💭 <strong>性格</strong>: 温柔顺从、乖巧听话、依赖性强</div>';
    } else if (dominanceScore < 35) {
        portrait += '<div class="portrait-item">💭 <strong>性格</strong>: 强势自信、有主见、保护欲强</div>';
    } else {
        portrait += '<div class="portrait-item">💭 <strong>性格</strong>: 灵活多变、有层次、可刚可柔</div>';
    }

    // 外貌
    if (bigFive.openness > 75) {
        portrait += '<div class="portrait-item">✨ <strong>外貌</strong>: 独特气质、有个性、艺术感强</div>';
    } else if (bigFive.conscientiousness > 70) {
        portrait += '<div class="portrait-item">✨ <strong>外貌</strong>: 精致端庄、符合主流审美、得体讲究</div>';
    } else {
        portrait += '<div class="portrait-item">✨ <strong>外貌</strong>: 自然舒适、干净清爽、亲和力强</div>';
    }

    // 气质
    if (bigFive.extraversion > 75) {
        portrait += '<div class="portrait-item">🌟 <strong>气质</strong>: 阳光开朗、活力四射、笑容灿烂</div>';
    } else if (bigFive.openness > 75) {
        portrait += '<div class="portrait-item">🌟 <strong>气质</strong>: 神秘独立、艺术家气质、有深度</div>';
    } else {
        portrait += '<div class="portrait-item">🌟 <strong>气质</strong>: 温柔知性、优雅沉稳、有修养</div>';
    }

    // S/M匹配
    if (dominanceScore > 65) {
        portrait += '<div class="portrait-item">🔥 <strong>S/M匹配</strong>: M型或Switch（顺从型）</div>';
    } else if (dominanceScore < 35) {
        portrait += '<div class="portrait-item">🔥 <strong>S/M匹配</strong>: S型或Switch（支配型）</div>';
    } else {
        portrait += '<div class="portrait-item">🔥 <strong>S/M匹配</strong>: Switch最佳，S/M都可</div>';
    }

    portrait += '</div>'; // portrait-features

    // 关键词
    portrait += '<div class="portrait-keywords">';
    portrait += '<strong>关键词</strong>: ';
    const keywords = generateKeywords(bigFive, dominanceScore);
    portrait += keywords.map(k => `<span class="keyword-tag">${k}</span>`).join(' ');
    portrait += '</div>';

    portrait += '</div>'; // ideal-portrait-card

    return portrait;
}

/**
 * 生成理想型关键词
 */
function generateKeywords(bigFive, dominanceScore) {
    const keywords = [];

    if (dominanceScore > 65) {
        keywords.push('乖巧', '听话', '可爱', '温柔');
    } else if (dominanceScore < 35) {
        keywords.push('强势', '霸气', '可靠', '安全感');
    } else {
        keywords.push('反差萌', '多面性', '有层次');
    }

    if (bigFive.openness > 75) {
        keywords.push('独特', '艺术', '神秘');
    }

    if (bigFive.extraversion > 75) {
        keywords.push('阳光', '活力', '开朗');
    } else if (bigFive.extraversion < 40) {
        keywords.push('安静', '深度', '内敛');
    }

    if (bigFive.conscientiousness > 70) {
        keywords.push('成熟', '稳重', '精致');
    }

    return keywords.slice(0, 8);
}
