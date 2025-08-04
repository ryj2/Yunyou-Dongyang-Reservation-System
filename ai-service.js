// AI客服相关功能
let aiServiceOpen = false;
let chatHistory = [];

// AI客服的弱智回复库
const aiResponses = {
    '预约失败': [
        '很抱歉听到您遇到预约失败的问题。请您按照以下步骤操作：\n1. 刷新页面重试\n2. 清除浏览器缓存\n3. 更换浏览器\n4. 检查网络连接\n如果问题仍然存在，建议您稍后再试。',
        '预约失败可能是由于系统繁忙导致的。建议您：\n• 避开高峰时段\n• 使用推荐浏览器\n• 确保网络稳定\n感谢您的理解与配合！',
        '根据您的描述，这是一个常见问题。解决方案：\n① 重启设备\n② 重新登录账户\n③ 联系网络运营商\n④ 等待系统维护完成\n希望能帮到您！'
    ],
    '支付问题': [
        '关于支付问题，请确认以下信息：\n• 银行卡余额是否充足\n• 网络连接是否稳定\n• 支付密码是否正确\n• 是否超过单日限额\n如仍有问题，请联系银行客服。',
        '支付异常的常见原因：\n1. 银行系统维护\n2. 支付渠道故障\n3. 账户安全限制\n4. 订单信息错误\n建议您稍后重试或更换支付方式。',
        '很抱歉给您带来不便。支付问题处理建议：\n→ 检查支付环境安全\n→ 确认订单信息准确\n→ 尝试其他支付方式\n→ 联系发卡银行确认\n感谢您的耐心！'
    ],
    '退票': [
        '关于退票政策，请注意：\n• 本景区门票一经售出，概不退换\n• 如遇不可抗力因素，可申请改期\n• 退票申请需提供相关证明\n• 处理时间为7-15个工作日\n具体以景区公告为准。',
        '退票相关说明：\n① 门票具有时效性，过期作废\n② 特殊情况可联系客服协商\n③ 退票手续费按规定收取\n④ 请保留好购票凭证\n感谢您的理解！',
        '很遗憾您需要退票。退票须知：\n- 需在游览日期前申请\n- 提供有效身份证明\n- 符合退票条件才可办理\n- 退款原路返回\n建议您仔细阅读购票协议。'
    ],
    '联系人工': [
        '人工客服服务时间：\n周一至周日 9:00-18:00\n\n由于咨询量较大，当前排队人数较多，预计等待时间30-60分钟。\n\n建议您优先使用智能客服，我可以为您解答大部分问题！',
        '转接人工客服需要排队等候，当前前方还有127人。\n\n温馨提示：\n• 人工客服工作时间有限\n• 智能客服24小时在线\n• 常见问题我都能解答\n\n您确定要继续等待吗？',
        '人工客服正忙，建议您：\n1. 查看常见问题解答\n2. 使用智能客服咨询\n3. 关注官方公众号\n4. 查看帮助中心\n\n如需紧急帮助，请拨打客服热线：400-000-0000（收费）'
    ]
};

// 通用弱智回复
const genericResponses = [
    '感谢您的咨询！根据您的问题，建议您：\n1. 查看帮助中心\n2. 刷新页面重试\n3. 清除浏览器缓存\n4. 更换网络环境\n如问题持续，请联系技术支持。',
    '很抱歉给您带来不便。请您尝试以下解决方案：\n• 重启设备\n• 更新浏览器\n• 检查网络连接\n• 稍后再试\n我们会持续优化系统，感谢您的理解！',
    '您好！针对您的问题，我为您提供以下建议：\n① 确认操作步骤正确\n② 检查系统兼容性\n③ 联系网络运营商\n④ 等待系统更新\n希望能够帮助到您！',
    '根据系统分析，您遇到的可能是常见问题。解决方法：\n→ 按F5刷新页面\n→ 清理浏览器数据\n→ 关闭其他网页\n→ 重新登录账户\n如仍无法解决，请稍后重试。',
    '非常感谢您的反馈！建议您：\n• 使用官方推荐浏览器\n• 确保网络环境稳定\n• 避开系统维护时间\n• 关注官方公告\n我们将持续为您提供优质服务！'
];

// 无关回复（对于无法理解的问题）
const confusedResponses = [
    '抱歉，我没有完全理解您的问题。请您：\n1. 详细描述遇到的具体情况\n2. 提供错误截图或提示信息\n3. 说明操作的具体步骤\n4. 选择下方快捷问题\n这样我能更好地为您服务！',
    '您好，您的问题我需要进一步了解。建议您：\n• 使用更具体的关键词\n• 选择相关的快捷问题\n• 查看常见问题解答\n• 联系人工客服\n感谢您的配合！',
    '很抱歉，我可能没有理解您的意思。请您：\n→ 重新描述问题\n→ 使用简单明了的语言\n→ 点击下方快捷按钮\n→ 查看帮助文档\n我会尽力为您解答！',
    '抱歉让您久等了！为了更好地帮助您，请：\n① 明确说明问题类型\n② 提供详细操作步骤\n③ 截图相关错误信息\n④ 选择匹配的问题分类\n谢谢您的理解与支持！'
];

// 切换AI客服窗口
function toggleAIService() {
    const chatWindow = document.getElementById('ai-service-chat');
    if (aiServiceOpen) {
        closeAIService();
    } else {
        chatWindow.classList.add('show');
        aiServiceOpen = true;
        
        // 添加欢迎消息（如果是首次打开）
        if (chatHistory.length === 0) {
            setTimeout(() => {
                addBotMessage('欢迎使用东洋智能客服！我是您的专属小助手 🤖\n\n请选择下方快捷问题，或直接输入您的问题，我会尽力为您解答！');
            }, 500);
        }
    }
}

// 关闭AI客服
function closeAIService() {
    const chatWindow = document.getElementById('ai-service-chat');
    chatWindow.classList.remove('show');
    aiServiceOpen = false;
}

// 快捷问题点击
function askQuickQuestion(question) {
    addUserMessage(question);
    setTimeout(() => {
        handleAIResponse(question);
    }, 800 + Math.random() * 1200); // 模拟思考时间
}

// 发送聊天消息
function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addUserMessage(message);
    input.value = '';
    
    // 模拟AI思考时间
    setTimeout(() => {
        handleAIResponse(message);
    }, 1000 + Math.random() * 2000);
}

// 处理键盘事件
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// 添加用户消息
function addUserMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">👤</div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    chatHistory.push({ type: 'user', message: message });
}

// 添加机器人消息
function addBotMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    chatHistory.push({ type: 'bot', message: message });
}

// 处理AI回复（弱智逻辑）
function handleAIResponse(userMessage) {
    let response = '';
    
    // 先显示"正在输入"状态
    showTypingIndicator();
    
    setTimeout(() => {
        hideTypingIndicator();
        
        // 关键词匹配（非常简单粗暴的匹配）
        if (userMessage.includes('预约') && (userMessage.includes('失败') || userMessage.includes('不了') || userMessage.includes('错误'))) {
            response = getRandomResponse(aiResponses['预约失败']);
        } else if (userMessage.includes('支付') || userMessage.includes('付款') || userMessage.includes('扣款') || userMessage.includes('钱')) {
            response = getRandomResponse(aiResponses['支付问题']);
        } else if (userMessage.includes('退票') || userMessage.includes('退款') || userMessage.includes('取消')) {
            response = getRandomResponse(aiResponses['退票']);
        } else if (userMessage.includes('人工') || userMessage.includes('客服') || userMessage.includes('转接')) {
            response = getRandomResponse(aiResponses['联系人工']);
        } else if (userMessage.includes('你好') || userMessage.includes('在吗') || userMessage.includes('您好')) {
            response = '您好！我是东洋智能客服小助手，很高兴为您服务！\n\n请问有什么可以帮助您的吗？您可以：\n• 点击下方快捷问题\n• 直接描述您的问题\n• 查看帮助中心\n\n我会尽力为您解答！';
        } else if (userMessage.includes('谢谢') || userMessage.includes('感谢')) {
            response = '不客气！很高兴能够帮助到您！\n\n如果您还有其他问题，随时可以咨询我。祝您使用愉快！ 😊';
        } else if (userMessage.includes('垃圾') || userMessage.includes('差') || userMessage.includes('烂') || userMessage.includes('投诉')) {
            response = '非常抱歉给您带来不好的体验！\n\n我们会认真对待您的反馈，并持续改进我们的服务。\n\n如需进一步沟通，建议您：\n• 联系人工客服\n• 拨打投诉热线\n• 关注官方公告\n\n感谢您的宝贵意见！';
        } else if (userMessage.length < 5) {
            // 对于太短的消息，给出困惑回复
            response = getRandomResponse(confusedResponses);
        } else {
            // 其他情况给出通用回复
            response = getRandomResponse(genericResponses);
        }
        
        // 随机添加一些"智能"但无用的建议
        if (Math.random() < 0.3) {
            const extraTips = [
                '\n\n💡 小贴士：建议您收藏我们的官网，方便下次使用！',
                '\n\n🔔 温馨提醒：关注官方微信公众号，获取最新资讯！',
                '\n\n⭐ 友情提示：推荐使用Chrome浏览器，体验更佳！',
                '\n\n📱 贴心建议：下载官方APP，享受更多便民服务！',
                '\n\n🎯 实用提醒：避开高峰时段，预约更顺畅！'
            ];
            response += getRandomResponse(extraTips);
        }
        
        addBotMessage(response);
        
    }, 1500 + Math.random() * 1000); // 模拟思考和打字时间
}

// 显示正在输入指示器
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <p>正在输入<span class="typing-dots">...</span></p>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 隐藏正在输入指示器
// 隐藏输入指示器
function hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// 获取随机回复
// 函数 getRandomResponse 用于从传入的 responses 数组中随机返回一个元素
function getRandomResponse(responses) {
    // 使用 Math.random() 生成一个 0 到 1 之间的随机数，乘以 responses 数组的长度，再使用 Math.floor() 向下取整，得到一个随机的索引值
    return responses[Math.floor(Math.random() * responses.length)];
}

// 页面加载时初始化AI客服
document.addEventListener('DOMContentLoaded', function() {
    // 随机显示客服浮动按钮的提示
    setTimeout(() => {
        if (!aiServiceOpen && Math.random() < 0.3) {
            showMessage('💬 有问题？点击右下角AI客服获取帮助！', 'warning');
        }
    }, 10000);
    
    // 定期提醒用户使用客服
    setInterval(() => {
        if (!aiServiceOpen && Math.random() < 0.1) {
            const tips = [
                '🤖 AI客服在线，随时为您解答疑问！',
                '💡 遇到问题？试试右下角的智能客服！',
                '🔧 需要帮助？AI客服24小时为您服务！'
            ];
            showMessage(getRandomResponse(tips), 'warning');
        }
    }, 30000);
});