// ========================================
// 成就系统模块
// ========================================

const achievements = {
    first_login: {
        name: '初来乍到',
        desc: '首次登录系统',
        icon: '🔑',
        unlocked: false
    },
    agreement_reader: {
        name: '协议阅读者',
        desc: '完整阅读用户协议',
        icon: '📜',
        unlocked: false
    },
    captcha_master: {
        name: '验证码大师',
        desc: '通过3种不同类型的验证码',
        icon: '🧩',
        unlocked: false
    },
    lottery_fail: {
        name: '抽签非洲人',
        desc: '抽签失败1次',
        icon: '🎱',
        unlocked: false
    },
    lottery_fail_3: {
        name: '绝望抽签者',
        desc: '抽签失败3次',
        icon: '😞',
        unlocked: false
    },
    queue_master: {
        name: '排队大师',
        desc: '排队超过5次',
        icon: '⏳',
        unlocked: false
    },
    queue_timeout: {
        name: '排队超时',
        desc: '排队超时1次',
        icon: '⏰',
        unlocked: false
    },
    payment_fail: {
        name: '支付受害者',
        desc: '支付成功但出票失败',
        icon: '💸',
        unlocked: false
    },
    payment_block: {
        name: '风控目标',
        desc: '被银行风控拦截',
        icon: '🏦',
        unlocked: false
    },
    booking_complete: {
        name: '终极通关',
        desc: '完成整个预约流程',
        icon: '🏆',
        unlocked: false
    },
    ai_chat_5: {
        name: 'AI客服受害者',
        desc: '和AI客服对话5次',
        icon: '🤖',
        unlocked: false
    },
    error_10: {
        name: '错误收藏家',
        desc: '遇到10种不同的错误',
        icon: '📝',
        unlocked: false
    },
    monday_visitor: {
        name: '周一勇士',
        desc: '尝试在周一预约',
        icon: '🛡️',
        unlocked: false
    },
    night_owl: {
        name: '夜猫子',
        desc: '在深夜(0-5点)使用系统',
        icon: '🦉',
        unlocked: false
    },
    patient_user: {
        name: '耐心大师',
        desc: '使用系统超过10分钟',
        icon: '🧘',
        unlocked: false
    },
    // 新增成就
    server_error: {
        name: '服务器开小差了',
        desc: '遇到服务器错误',
        icon: '🔥',
        unlocked: false
    },
    real_id_used: {
        name: '实名制受害者',
        desc: '手动输入真实身份证',
        icon: '🪪',
        unlocked: false
    },
    queue_survived: {
        name: '排队幸存者',
        desc: '成功完成排队',
        icon: '🎖️',
        unlocked: false
    },
    refresh_persisted: {
        name: '刷新不丢',
        desc: '刷新页面后数据仍在',
        icon: '💾',
        unlocked: false
    }
};

// 统计数据
let captchaTypesUsed = new Set();
let lotteryFailCount = 0;
let queueCount = 0;
let aiChatCount = 0;
let errorTypes = new Set();
let startTime = Date.now();

// 检查特殊时间成就
(function checkTimeAchievements() {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
        unlockAchievement('night_owl');
    }
})();

// 检查使用时长成就
setInterval(() => {
    if (Date.now() - startTime > 10 * 60 * 1000) {
        unlockAchievement('patient_user');
    }
}, 30000);

function unlockAchievement(id) {
    if (!achievements[id] || achievements[id].unlocked) return;

    achievements[id].unlocked = true;
    achievements[id].unlockedAt = Date.now();

    // 持久化到localStorage
    if (typeof Storage !== 'undefined') {
        Storage.saveAchievements(achievements);
    }

    // 显示成就通知
    showAchievementToast(achievements[id].name, achievements[id].icon);

    // 更新徽章
    const badge = document.getElementById('achievement-badge');
    if (badge) {
        badge.textContent = getUnlockedCount();
    }
}

function showAchievementToast(name, icon) {
    const toast = document.getElementById('achievement-toast');
    if (!toast) return;

    toast.querySelector('.achievement-toast-icon').textContent = icon;
    document.getElementById('achievement-toast-name').textContent = name;

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function getUnlockedCount() {
    return Object.values(achievements).filter(a => a.unlocked).length;
}

function renderAchievements() {
    const grid = document.getElementById('achievement-grid');
    if (!grid) return;

    grid.innerHTML = '';

    Object.entries(achievements).forEach(([id, ach]) => {
        const card = document.createElement('div');
        card.className = `achievement-card ${ach.unlocked ? 'unlocked' : ''}`;
        card.innerHTML = `
            <div class="achievement-icon">${ach.icon}</div>
            <div class="achievement-name">${ach.name}</div>
            <div class="achievement-desc">${ach.desc}</div>
        `;
        grid.appendChild(card);
    });
}

// ========================================
// 各模块触发点集成
// ========================================

// 监听验证码使用
const originalShowCaptchaGame = window.showCaptchaGame;
window.showCaptchaGame = function() {
    captchaTypesUsed.add(Date.now() % 4);
    if (captchaTypesUsed.size >= 3) {
        unlockAchievement('captcha_master');
    }
    if (originalShowCaptchaGame) originalShowCaptchaGame();
};

// 监听AI客服对话
const originalAskQuickQuestion = window.askQuickQuestion;
window.askQuickQuestion = function(q) {
    aiChatCount++;
    if (aiChatCount >= 5) unlockAchievement('ai_chat_5');
    if (originalAskQuickQuestion) originalAskQuickQuestion(q);
};

const originalSendChatMessage = window.sendChatMessage;
window.sendChatMessage = function() {
    aiChatCount++;
    if (aiChatCount >= 5) unlockAchievement('ai_chat_5');
    if (originalSendChatMessage) originalSendChatMessage();
};
