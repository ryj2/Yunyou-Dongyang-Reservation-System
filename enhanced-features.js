// 增强功能模块 - 用户协议、抽签预约、按钮变灰等功能

// 全局变量
let agreementScrolled = false;
let lotteryInProgress = false;

// 显示用户协议模态框
function showAgreementModal() {
    document.getElementById('agreement-modal').style.display = 'block';
    
    // 监听滚动事件
    const agreementContent = document.getElementById('agreement-content');
    const scrollProgress = document.getElementById('scroll-progress');
    const agreeBtn = document.getElementById('agree-btn');
    
    agreementContent.addEventListener('scroll', function() {
        const scrollTop = agreementContent.scrollTop;
        const scrollHeight = agreementContent.scrollHeight - agreementContent.clientHeight;
        const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);
        
        scrollProgress.textContent = `阅读进度: ${scrollPercent}%`;
        
        if (scrollPercent >= 95) {
            agreeBtn.disabled = false;
            agreeBtn.textContent = '同意并继续';
            scrollProgress.textContent = '已阅读完毕，可以继续操作';
            agreementScrolled = true;
        }
    });
}

// 关闭用户协议模态框
function closeAgreementModal() {
    document.getElementById('agreement-modal').style.display = 'none';
}

// 不同意协议
function disagreeAgreement() {
    closeAgreementModal();
    showMessage('您必须同意用户协议才能继续使用服务', 'error');
}

// 同意协议
function agreeAgreement() {
    if (!agreementScrolled) {
        showMessage('请先完整阅读用户协议', 'error');
        return;
    }
    
    closeAgreementModal();
    showMessage('协议确认成功，继续预约流程', 'success');
    
    // 继续原来的流程
    continueAfterAgreement();
}

// 协议确认后继续流程
function continueAfterAgreement() {
    const nextBtn = document.querySelector('#booking-step-1 .next-btn');
    if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.textContent = '系统处理中...';
        nextBtn.style.opacity = '0.5';
        
        simulateSystemLag(() => {
            if (Math.random() < 0.6) {
                const messages = [
                    '该日期/时段已约满',
                    '库存不足，请选择其他日期',
                    '票已售罄，但系统显示仍有余票是缓存问题',
                    '人数过多，请稍后重试',
                    '系统检测到异常访问，请重新操作'
                ];
                nextBtn.disabled = false;
                nextBtn.textContent = '下一步';
                nextBtn.style.opacity = '1';
                showMessage(getRandomMessage(messages), 'error');
                return;
            }
            
            nextBtn.disabled = false;
            nextBtn.textContent = '下一步';
            nextBtn.style.opacity = '1';
            
            // 设置选中的日期并进入下一步
            if (typeof selectedDate !== 'undefined' && selectedDate) {
                showStep(2);
            }
        }, 2000, 4000);
    }
}

// 显示抽签模态框
function showLotteryModal() {
    document.getElementById('lottery-modal').style.display = 'block';
    lotteryInProgress = false;
}

// 关闭抽签模态框
function closeLotteryModal() {
    document.getElementById('lottery-modal').style.display = 'none';
    lotteryInProgress = false;
}

// 开始抽签
function startLottery() {
    if (lotteryInProgress) return;
    
    lotteryInProgress = true;
    const startBtn = document.getElementById('start-lottery-btn');
    const lotteryStatus = document.getElementById('lottery-status');
    
    startBtn.disabled = true;
    startBtn.textContent = '抽签中...';
    
    // 抽签动画
    lotteryStatus.innerHTML = `
        <div class="lottery-animation">
            <div class="lottery-balls">
                <div class="lottery-ball spinning">🎱</div>
                <div class="lottery-ball spinning">🎲</div>
                <div class="lottery-ball spinning">🎯</div>
            </div>
            <p>正在进行公平抽签，请稍候...</p>
            <div class="lottery-progress">
                <div class="progress-bar" id="lottery-progress-bar"></div>
            </div>
            <p class="lottery-participants">当前参与抽签人数：<span id="participant-count">28,947</span></p>
        </div>
    `;
    
    // 进度条动画
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 8 + 2;
        if (progress > 100) progress = 100;
        
        const progressBar = document.getElementById('lottery-progress-bar');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
        
        // 随机增加参与人数
        const participantCount = document.getElementById('participant-count');
        if (participantCount && Math.random() < 0.3) {
            const currentCount = parseInt(participantCount.textContent.replace(',', ''));
            const newCount = currentCount + Math.floor(Math.random() * 100);
            participantCount.textContent = newCount.toLocaleString();
        }
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
                showLotteryResult();
            }, 1000);
        }
    }, 300);
}

// 显示抽签结果
function showLotteryResult() {
    const lotteryStatus = document.getElementById('lottery-status');
    
    // 95%概率失败
    if (Math.random() < 0.95) {
        const userNumber = Math.floor(Math.random() * 30000) + 1000;
        lotteryStatus.innerHTML = `
            <div class="lottery-result fail">
                <div class="result-icon">😞</div>
                <h3>很遗憾，您未中签</h3>
                <div class="lottery-details">
                    <p>本次抽签参与人数：<strong>29,156</strong>人</p>
                    <p>中签人数：<strong>50</strong>人</p>
                    <p>您的抽签号码：<strong>${userNumber}</strong></p>
                    <p>中签号码范围：1-50</p>
                    <p>中签率：<strong>0.17%</strong></p>
                </div>
                <div class="lottery-tips">
                    <p>💡 提示：明日上午9:00将开启新一轮抽签</p>
                </div>
                <div class="lottery-options">
                    <button class="ancient-button-secondary" onclick="closeLotteryModal()">明日再试</button>
                    <button class="ancient-button" onclick="continueQueue()">继续排队</button>
                </div>
            </div>
        `;
    } else {
        const luckyNumber = Math.floor(Math.random() * 50) + 1;
        lotteryStatus.innerHTML = `
            <div class="lottery-result success">
                <div class="result-icon">🎉</div>
                <h3>恭喜您中签了！</h3>
                <div class="lottery-details">
                    <p>您的抽签号码：<strong>${luckyNumber}</strong></p>
                    <p>您获得了优先预约资格</p>
                    <p>请在10分钟内完成预约，否则资格失效</p>
                </div>
                <button class="ancient-button" onclick="proceedWithLottery()">继续预约</button>
            </div>
        `;
        
        // 开始倒计时
        startLotteryCountdown();
    }
}

// 中签倒计时
function startLotteryCountdown() {
    let timeLeft = 600; // 10分钟
    const countdownInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        const countdownElement = document.querySelector('.lottery-result.success .lottery-details p:last-child');
        if (countdownElement) {
            countdownElement.textContent = `请在${minutes}:${seconds.toString().padStart(2, '0')}内完成预约，否则资格失效`;
        }
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(countdownInterval);
            showMessage('中签资格已过期，请重新参与抽签', 'error');
            closeLotteryModal();
        }
    }, 1000);
}

// 继续排队
function continueQueue() {
    closeLotteryModal();
    showMessage('正在为您安排排队...', 'warning');
    setTimeout(() => {
        if (typeof showQueueModal === 'function') {
            showQueueModal();
        }
    }, 1000);
}

// 中签后继续预约
function proceedWithLottery() {
    closeLotteryModal();
    showMessage('恭喜中签！正在为您跳转...', 'success');
    
    setTimeout(() => {
        // 即使中签也有60%概率失败
        if (Math.random() < 0.6) {
            const errors = [
                '系统异常，中签资格已失效，请重新预约',
                '检测到网络异常，中签状态丢失',
                '服务器繁忙，无法验证中签资格',
                '中签资格验证失败，请联系客服',
                '系统检测到异常操作，中签资格被取消'
            ];
            showMessage(getRandomMessage(errors), 'error');
        } else {
            if (typeof showStep === 'function') {
                showStep(2);
            }
        }
    }, 2000);
}

// 增强的按钮禁用功能
function disableButtonWithLoading(buttonSelector, loadingText = '处理中...') {
    const button = document.querySelector(buttonSelector);
    if (button) {
        button.disabled = true;
        button.originalText = button.textContent;
        button.textContent = loadingText;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        
        return button;
    }
    return null;
}

// 恢复按钮状态
function enableButton(button) {
    if (button) {
        button.disabled = false;
        button.textContent = button.originalText || '继续';
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

// 增强的下一步功能
function enhancedNextStep() {
    // 验证第一步
    if (typeof currentStep !== 'undefined' && currentStep === 1) {
        const date = document.getElementById('visit-date').value;
        
        if (!date) {
            showMessage('请选择预约日期', 'error');
            return;
        }
        
        if (typeof selectedTime === 'undefined' || !selectedTime) {
            showMessage('请选择预约时段', 'error');
            return;
        }
        
        // 检查是否为周一（闭馆日）
        const selectedDateObj = new Date(date);
        const dayOfWeek = selectedDateObj.getDay();
        
        if (dayOfWeek === 1) { // 周一
            showMessage('抱歉，景区每周一闭馆维护，请选择其他日期', 'error');
            return;
        }
        
        // 随机显示用户协议
        if (Math.random() < 0.4) {
            showAgreementModal();
            return;
        }
        
        // 按钮变灰，模拟系统卡顿
        const nextBtn = disableButtonWithLoading('#booking-step-1 .next-btn', '系统处理中...');
        
        // 模拟系统卡顿
        if (typeof simulateSystemLag === 'function') {
            simulateSystemLag(() => {
                // 随机决定是否进入抽签模式
                if (Math.random() < 0.3) {
                    enableButton(nextBtn);
                    showLotteryModal();
                    return;
                }
                
                // 随机显示各种恶心的错误
                if (Math.random() < 0.7) {
                    const messages = [
                        '该日期/时段已约满',
                        '库存不足，请选择其他日期',
                        '系统检测到该时段访问量过大，请选择其他时段',
                        '抱歉，该时段仅对VIP用户开放',
                        '检测到您选择的日期为节假日，需要提前7天预约',
                        '该时段票源紧张，建议选择其他时段',
                        '系统检测到异常，请重新选择日期',
                        '当前时段预约人数过多，系统响应缓慢',
                        '票已售罄，但系统显示仍有余票是缓存问题',
                        '人数过多，请稍后重试',
                        '网络拥堵，请重新选择时段'
                    ];
                    enableButton(nextBtn);
                    if (typeof showMessage === 'function' && typeof getRandomMessage === 'function') {
                        showMessage(getRandomMessage(messages), 'error');
                    }
                    return;
                }
                
                // 成功进入下一步
                if (typeof selectedDate !== 'undefined') {
                    selectedDate = date;
                }
                enableButton(nextBtn);
                if (typeof showStep === 'function') {
                    showStep(2);
                }
            }, 2000, 5000);
        }
    }
}

// 增强的票种选择下一步
function enhancedNextToInfo() {
    if (typeof ticketCounts === 'undefined') return;
    
    const totalTickets = ticketCounts.adult + ticketCounts.child + ticketCounts.senior;
    
    if (totalTickets === 0) {
        if (typeof showMessage === 'function') {
            showMessage('请至少选择一张票', 'error');
        }
        return;
    }
    
    if (totalTickets > 5) {
        if (typeof showMessage === 'function') {
            showMessage('单次预约最多5张票', 'error');
        }
        return;
    }
    
    // 按钮变灰
    const nextBtn = disableButtonWithLoading('#booking-step-2 .next-btn', '验证票种中...');
    
    // 模拟系统卡顿
    if (typeof simulateSystemLag === 'function') {
        simulateSystemLag(() => {
            // 随机票种相关错误
            if (Math.random() < 0.5) {
                const errors = [
                    '儿童票需要成人陪同，请同时购买成人票',
                    '老年票库存不足，请减少数量',
                    '检测到票种搭配异常，请重新选择',
                    '该组合票种暂时无法预约',
                    '系统检测到价格异常，请重新选择',
                    '票种验证中，系统响应较慢',
                    '当前票种库存紧张，建议减少数量',
                    '系统检测到异常购票行为，请重新选择',
                    '票种组合不符合优惠政策，请调整'
                ];
                enableButton(nextBtn);
                if (typeof showMessage === 'function' && typeof getRandomMessage === 'function') {
                    showMessage(getRandomMessage(errors), 'error');
                }
                return;
            }
            
            enableButton(nextBtn);
            if (typeof showStep === 'function') {
                showStep(3);
            }
        }, 1500, 4000);
    }
}

// 增强的提交预约功能
function enhancedSubmitBooking() {
    // 获取表单数据
    const mainName = document.getElementById('main-name').value;
    const mainId = document.getElementById('main-id').value;
    const mainPhone = document.getElementById('main-phone').value;
    
    // 基本验证
    if (!mainName || !mainId || !mainPhone) {
        if (typeof showMessage === 'function') {
            showMessage('请填写完整信息', 'error');
        }
        return;
    }
    
    // 按钮变灰
    const submitBtn = disableButtonWithLoading('#booking-step-3 .next-btn', '提交中...');
    
    // 模拟系统卡顿
    if (typeof simulateSystemLag === 'function') {
        simulateSystemLag(() => {
            // 开始各种恶心的验证和错误
            setTimeout(() => {
                // 姓名验证恶心操作
                if (Math.random() < 0.4) {
                    const nameErrors = [
                        '姓名包含非法字符',
                        '姓名长度不符合要求',
                        '检测到姓名中包含特殊符号',
                        '姓名格式不正确，请使用真实姓名',
                        '系统检测到该姓名存在风险',
                        '姓名不能包含数字',
                        '检测到姓名可能为虚假信息'
                    ];
                    enableButton(submitBtn);
                    if (typeof showMessage === 'function' && typeof getRandomMessage === 'function') {
                        showMessage(getRandomMessage(nameErrors), 'error');
                    }
                    return;
                }
                
                // 身份证验证恶心操作
                if (Math.random() < 0.5) {
                    const idErrors = [
                        '证件号码格式错误',
                        '身份证号码校验失败',
                        '检测到身份证号码已被使用',
                        '身份证号码与姓名不匹配',
                        '该身份证号码在黑名单中',
                        '身份证号码位数不正确',
                        '检测到身份证号码异常',
                        '该身份证今日预约次数已达上限'
                    ];
                    enableButton(submitBtn);
                    if (typeof showMessage === 'function' && typeof getRandomMessage === 'function') {
                        showMessage(getRandomMessage(idErrors), 'error');
                    }
                    return;
                }
                
                // 手机号验证恶心操作
                if (Math.random() < 0.3) {
                    const phoneErrors = [
                        '手机号码格式错误',
                        '该手机号码已达到预约上限',
                        '检测到手机号码异常',
                        '手机号码归属地不在服务范围内',
                        '该号码今日预约次数过多',
                        '检测到手机号码存在风险'
                    ];
                    enableButton(submitBtn);
                    if (typeof showMessage === 'function' && typeof getRandomMessage === 'function') {
                        showMessage(getRandomMessage(phoneErrors), 'error');
                    }
                    return;
                }
                
                // 进入"提交中"的恶心流程
                enableButton(submitBtn);
                if (typeof startSubmissionHell === 'function') {
                    startSubmissionHell();
                }
                
            }, 800);
        }, 1000, 3000);
    }
}

// 重写原有函数
if (typeof window !== 'undefined') {
    // 重写nextStep函数
    window.originalNextStep = window.nextStep;
    window.nextStep = enhancedNextStep;
    
    // 重写nextToInfo函数
    window.originalNextToInfo = window.nextToInfo;
    window.nextToInfo = enhancedNextToInfo;
    
    // 重写submitBooking函数
    window.originalSubmitBooking = window.submitBooking;
    window.submitBooking = enhancedSubmitBooking;
}

// 添加CSS样式
const enhancedStyles = `
<style>
.lottery-animation {
    text-align: center;
    padding: 2rem;
}

.lottery-balls {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.lottery-ball {
    font-size: 2rem;
    animation: bounce 1s infinite;
}

.lottery-ball.spinning {
    animation: spin 1s linear infinite;
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-10px);
    }
    60% {
        transform: translateY(-5px);
    }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.lottery-progress {
    width: 100%;
    height: 20px;
    background: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
    margin: 1rem 0;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(45deg, #d4af37, #f1c40f);
    width: 0%;
    transition: width 0.3s ease;
}

.lottery-participants {
    font-size: 0.9rem;
    color: #666;
    margin-top: 1rem;
}

.lottery-result {
    text-align: center;
    padding: 2rem;
}

.lottery-result.fail .result-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.lottery-result.success .result-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.lottery-details {
    background: rgba(212, 175, 55, 0.1);
    padding: 1rem;
    border-radius: 10px;
    margin: 1rem 0;
}

.lottery-details p {
    margin: 0.5rem 0;
}

.lottery-tips {
    background: rgba(255, 193, 7, 0.1);
    padding: 1rem;
    border-radius: 10px;
    margin: 1rem 0;
    border-left: 4px solid #ffc107;
}

.lottery-options {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
}

.agreement-content {
    max-height: 400px;
    overflow-y: auto;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    margin-bottom: 1rem;
    line-height: 1.6;
}

.agreement-content h3 {
    color: #c8102e;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
}

.agreement-content p {
    margin-bottom: 0.5rem;
}

.agreement-footer {
    background: rgba(212, 175, 55, 0.1);
    padding: 1rem;
    border-radius: 5px;
    margin-top: 1rem;
    text-align: center;
}

.agreement-actions {
    border-top: 1px solid #eee;
    padding-top: 1rem;
}

.scroll-indicator {
    text-align: center;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: #666;
}

.agreement-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.agree-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
`;

// 注入样式
if (typeof document !== 'undefined') {
    document.head.insertAdjacentHTML('beforeend', enhancedStyles);
}

console.log('增强功能模块已加载：用户协议、抽签预约、按钮禁用等功能');