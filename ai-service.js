// ========================================
// AI客服模块 - 适配微信小程序风格
// ========================================

let aiServiceOpen = false;
let chatHistory = [];

// 弱智回复库
const aiResponses = {
    '预约失败': [
        '很抱歉听到您遇到预约失败的问题。请您：\n1. 刷新页面重试\n2. 清除浏览器缓存\n3. 更换浏览器\n4. 检查网络连接',
        '预约失败可能是由于系统繁忙导致的。建议您避开高峰时段，使用推荐浏览器。',
        '根据您的描述，这是一个常见问题。解决方案：重启设备、重新登录、联系网络运营商。'
    ],
    '支付问题': [
        '关于支付问题，请确认：银行卡余额、网络连接、支付密码、是否超过限额。如仍有问题，请联系银行。',
        '支付异常的常见原因：银行维护、支付渠道故障、账户安全限制。建议稍后重试。',
        '支付问题处理建议：检查支付环境、确认订单信息、尝试其他支付方式。'
    ],
    '退票': [
        '关于退票政策：本景区门票一经售出概不退换。特殊情况可申请改期，需提供证明。',
        '退票须知：门票具有时效性，过期作废。特殊情况可联系客服协商。',
        '退票需要在游览日期前申请，提供有效身份证明，符合退票条件才可办理。'
    ],
    '联系人工': [
        '人工客服服务时间：周一至周日 9:00-18:00\n当前排队人数较多，预计等待30-60分钟。\n建议优先使用智能客服！',
        '转接人工客服需要排队，当前前方还有127人。\n人工客服工作时间有限，智能客服24小时在线。',
        '人工客服正忙，建议您：查看常见问题、使用智能客服、关注官方公众号。'
    ]
};

const genericResponses = [
    '感谢您的咨询！建议您：查看帮助中心、刷新页面、清除缓存、更换网络。',
    '很抱歉给您带来不便。请您尝试：重启设备、更新浏览器、检查网络、稍后再试。',
    '您好！针对您的问题：确认操作步骤、检查系统兼容性、联系网络运营商。',
    '根据系统分析，这是常见问题。解决方法：按F5刷新、清理浏览器数据、重新登录。',
    '非常感谢您的反馈！建议您使用官方推荐浏览器，确保网络稳定，避开维护时间。'
];

const confusedResponses = [
    '抱歉，我没有完全理解您的问题。请您详细描述遇到的具体情况，或选择下方快捷问题。',
    '您好，您的问题我需要进一步了解。建议您使用更具体的关键词，或选择相关的快捷问题。',
    '很抱歉，我可能没有理解您的意思。请您重新描述问题，或查看帮助文档。'
];

function toggleAIService() {
    const panel = document.getElementById('ai-chat-panel');
    if (aiServiceOpen) {
        closeAIService();
    } else {
        panel.classList.add('show');
        aiServiceOpen = true;

        if (chatHistory.length === 0) {
            setTimeout(() => {
                addBotMessage('欢迎使用东洋智能客服！请选择下方快捷问题，或直接输入您的问题。');
            }, 500);
        }
    }
}

function closeAIService() {
    document.getElementById('ai-chat-panel').classList.remove('show');
    aiServiceOpen = false;
}

function askQuickQuestion(question) {
    addUserMessage(question);
    setTimeout(() => handleAIResponse(question), 800 + Math.random() * 1200);
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    addUserMessage(message);
    input.value = '';

    setTimeout(() => handleAIResponse(message), 1000 + Math.random() * 2000);
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') sendChatMessage();
}

function addUserMessage(message) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'ai-msg user';
    div.innerHTML = `
        <div class="ai-avatar">😊</div>
        <div class="ai-bubble">${message}</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    chatHistory.push({ type: 'user', message });
}

function addBotMessage(message) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'ai-msg bot';
    div.innerHTML = `
        <div class="ai-avatar">🤖</div>
        <div class="ai-bubble">${message.replace(/\n/g, '<br>')}</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    chatHistory.push({ type: 'bot', message });
}

function handleAIResponse(userMessage) {
    let response = '';

    if (userMessage.includes('预约') && (userMessage.includes('失败') || userMessage.includes('不了'))) {
        response = getRandomResponse(aiResponses['预约失败']);
    } else if (userMessage.includes('支付') || userMessage.includes('付款') || userMessage.includes('钱')) {
        response = getRandomResponse(aiResponses['支付问题']);
    } else if (userMessage.includes('退票') || userMessage.includes('退款') || userMessage.includes('取消')) {
        response = getRandomResponse(aiResponses['退票']);
    } else if (userMessage.includes('人工') || userMessage.includes('客服') || userMessage.includes('转接')) {
        response = getRandomResponse(aiResponses['联系人工']);
    } else if (userMessage.includes('你好') || userMessage.includes('在吗')) {
        response = '您好！我是东洋智能客服小助手，请问有什么可以帮助您的？';
    } else if (userMessage.includes('谢谢') || userMessage.includes('感谢')) {
        response = '不客气！很高兴能够帮助到您！';
    } else if (userMessage.includes('垃圾') || userMessage.includes('差') || userMessage.includes('投诉')) {
        response = '非常抱歉给您带来不好的体验！我们会认真对待您的反馈。如需进一步沟通，建议联系人工客服。';
    } else if (userMessage.length < 5) {
        response = getRandomResponse(confusedResponses);
    } else {
        response = getRandomResponse(genericResponses);
    }

    // 30%概率添加无用小贴士
    if (Math.random() < 0.3) {
        const tips = [
            '\n\n小贴士：建议您收藏我们的官网！',
            '\n\n提醒：关注官方微信公众号获取资讯！',
            '\n\n提示：推荐使用Chrome浏览器！',
            '\n\n建议：下载官方APP享受更多服务！'
        ];
        response += getRandomResponse(tips);
    }

    addBotMessage(response);
}

function getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (!aiServiceOpen && Math.random() < 0.3) {
            // 使用通用showMessage
            if (typeof showMessage === 'function') {
                showMessage('有问题？点击右下角AI客服获取帮助！', 'warning');
            }
        }
    }, 10000);
});
