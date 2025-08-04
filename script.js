// 全局变量
let currentStep = 1;
let selectedDate = '';
let selectedTime = '';
let bookingData = {};
let isLoggedIn = false;
let currentUser = null;
let ticketCounts = {
    adult: 0,
    child: 0,
    senior: 0
};
let queuePosition = 2847;
let queueInterval = null;

// 票价配置
const ticketPrices = {
    adult: 128,
    child: 68,
    senior: 88
};

// 垃圾系统的各种错误消息
const errorMessages = [
    "网络连接失败，请检查网络后重试",
    "系统繁忙，请稍后再试",
    "服务器开小差了，请稍后重试",
    "活动过于火爆，请稍后重试",
    "设备异常，请更换设备或网络重试",
    "您的操作过于频繁，请稍后再试",
    "系统维护中，请稍后再试",
    "当前访问人数过多，请错峰访问",
    "页面已失效，请重新操作",
    "会话超时，请重新登录"
];

// 系统卡顿模拟
function simulateSystemLag(callback, minDelay = 1000, maxDelay = 3000) {
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    
    // 显示加载提示
    showMessage('系统响应中，请稍候...', 'warning');
    
    // 模拟CPU密集操作造成的卡顿
    setTimeout(() => {
        const start = Date.now();
        while (Date.now() - start < Math.random() * 500 + 200) {
            // 故意卡顿
        }
        
        if (callback) callback();
    }, delay);
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 模拟加载时间
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
    }, 4000);

    // 设置日期选择器的最小和最大日期（只能预约7天内）
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    
    const dateInput = document.getElementById('visit-date');
    if (dateInput) {
        dateInput.min = today.toISOString().split('T')[0];
        dateInput.max = maxDate.toISOString().split('T')[0];
    }

    // 时间段选择事件
    document.querySelectorAll('.ancient-time-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            document.querySelectorAll('.ancient-time-slot').forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            selectedTime = this.dataset.time;
        });
    });

    // 初始化票种计数器
    updateTotalInfo();
});

// 检查登录状态并开始预约
function checkLoginAndBook() {
    if (!isLoggedIn) {
        showLoginModal();
        return;
    }
    
    // 随机决定是否进入排队
    if (Math.random() < 0.3) {
        showQueueModal();
        return;
    }
    
    startBooking();
}

// 显示登录模态框
function showLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
}

// 关闭登录模态框
function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
}

// 发送验证码
function sendVerificationCode() {
    const phone = document.getElementById('login-phone').value;
    
    if (!phone || phone.length !== 11) {
        showMessage('请输入正确的手机号码', 'error');
        return;
    }
    
    // 模拟系统卡顿
    simulateSystemLag(() => {
        // 随机显示人机验证
        if (Math.random() < 0.4) {
            showCaptchaVerification();
            return;
        }
        
        // 降低随机失败率
        if (Math.random() < 0.2) {
            const errors = [
                '验证码发送失败，请重试',
                '系统繁忙，请稍后再试'
            ];
            showMessage(getRandomMessage(errors), 'error');
            return;
        }
        
        // 生成验证码并显示通知
        const verificationCode = generateVerificationCode();
        showCodeNotification(verificationCode);
        
        showMessage('验证码已发送，请注意查收', 'success');
        
        // 模拟倒计时
        const btn = document.querySelector('.send-code-btn');
        let countdown = 60;
        btn.disabled = true;
        btn.textContent = `${countdown}秒后重发`;
        
        const timer = setInterval(() => {
            countdown--;
            btn.textContent = `${countdown}秒后重发`;
            
            if (countdown <= 0) {
                clearInterval(timer);
                btn.disabled = false;
                btn.textContent = '发送验证码';
            }
        }, 1000);
    });
}

// 生成验证码
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 显示验证码通知弹窗
function showCodeNotification(code) {
    // 移除已存在的通知
    const existingNotification = document.querySelector('.code-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'code-notification show';
    notification.innerHTML = `
        <div class="notification-header">
            <span class="notification-title">📱 短信验证码</span>
            <button class="close-notification" onclick="closeCodeNotification()">&times;</button>
        </div>
        <div class="verification-code">${code}</div>
        <div class="notification-text">请将此验证码输入到登录框中</div>
    `;
    
    document.body.appendChild(notification);
    
    // 8秒后自动关闭
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 8000);
}

// 关闭验证码通知
function closeCodeNotification() {
    const notification = document.querySelector('.code-notification');
    if (notification) {
        notification.remove();
    }
}

// 显示人机验证
function showCaptchaVerification() {
    const captchaType = Math.random();
    
    if (captchaType < 0.3) {
        showImageCaptcha();
    } else if (captchaType < 0.6) {
        showSliderCaptcha();
    } else {
        showMathCaptcha();
    }
}

// 显示图片验证码
function showImageCaptcha() {
    const captchaGroup = document.getElementById('captcha-group');
    if (captchaGroup) {
        captchaGroup.style.display = 'block';
        refreshCaptcha();
        showMessage('请完成人机验证后再发送验证码', 'warning');
    }
}

// 刷新验证码
function refreshCaptcha() {
    const captchaText = generateRandomCaptcha();
    const captchaElement = document.getElementById('captcha-text');
    if (captchaElement) {
        captchaElement.textContent = captchaText;
    }
}

// 生成随机验证码
function generateRandomCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 显示滑动验证
function showSliderCaptcha() {
    const sliderGroup = document.getElementById('slider-group');
    if (sliderGroup) {
        sliderGroup.style.display = 'block';
        initSliderCaptcha();
        showMessage('请拖动滑块完成验证', 'warning');
    }
}

// 初始化滑动验证
function initSliderCaptcha() {
    const thumb = document.getElementById('slider-thumb');
    if (!thumb) return;
    
    const track = thumb.parentElement;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    
    thumb.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - thumb.offsetLeft;
        thumb.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        currentX = e.clientX - startX;
        const maxX = track.offsetWidth - thumb.offsetWidth;
        
        if (currentX < 0) currentX = 0;
        if (currentX > maxX) currentX = maxX;
        
        thumb.style.left = currentX + 'px';
        
        // 检查是否完成
        if (currentX >= maxX * 0.9) {
            completeSliderVerification();
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            thumb.style.cursor = 'grab';
            
            // 如果没有完成，重置位置
            if (currentX < track.offsetWidth - thumb.offsetWidth) {
                setTimeout(() => {
                    thumb.style.left = '0px';
                    currentX = 0;
                }, 500);
            }
        }
    });
}

// 完成滑动验证
function completeSliderVerification() {
    const thumb = document.getElementById('slider-thumb');
    const track = thumb.parentElement;
    
    thumb.classList.add('success');
    track.classList.add('success');
    thumb.textContent = '✓';
    const sliderText = track.querySelector('.slider-text');
    if (sliderText) {
        sliderText.textContent = '验证成功';
    }
    
    setTimeout(() => {
        const sliderGroup = document.getElementById('slider-group');
        if (sliderGroup) {
            sliderGroup.style.display = 'none';
        }
        // 随机决定是否真的成功
        if (Math.random() < 0.7) {
            showMessage('验证失败，请重试', 'error');
        } else {
            simulateSystemLag(() => {
                sendVerificationCode();
            });
        }
    }, 1000);
}

// 显示数学验证码
function showMathCaptcha() {
    const mathModal = document.createElement('div');
    mathModal.className = 'modal ancient-modal';
    mathModal.id = 'math-captcha-modal';
    mathModal.innerHTML = `
        <div class="modal-content ancient-modal-content" style="max-width: 400px;">
            <div class="modal-header ancient-modal-header">
                <h2>人机验证</h2>
                <span class="close" onclick="closeMathCaptcha()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="math-captcha">
                    <div class="math-question" id="math-question"></div>
                    <input type="number" class="math-input" id="math-answer" placeholder="答案">
                    <div style="margin-top: 1rem;">
                        <button class="ancient-button-secondary" onclick="closeMathCaptcha()">取消</button>
                        <button class="ancient-button" onclick="checkMathAnswer()" style="margin-left: 1rem;">确认</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(mathModal);
    mathModal.style.display = 'block';
    
    // 生成数学题
    generateMathQuestion();
}

// 生成数学题
function generateMathQuestion() {
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, answer;
    
    switch (operation) {
        case '+':
            num1 = Math.floor(Math.random() * 50) + 1;
            num2 = Math.floor(Math.random() * 50) + 1;
            answer = num1 + num2;
            break;
        case '-':
            num1 = Math.floor(Math.random() * 50) + 20;
            num2 = Math.floor(Math.random() * 20) + 1;
            answer = num1 - num2;
            break;
        case '×':
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            answer = num1 * num2;
            break;
    }
    
    const questionElement = document.getElementById('math-question');
    if (questionElement) {
        questionElement.textContent = `${num1} ${operation} ${num2} = ?`;
    }
    window.mathAnswer = answer;
}

// 检查数学答案
function checkMathAnswer() {
    const answerInput = document.getElementById('math-answer');
    if (!answerInput) {
        showMessage('验证码界面异常，请重试', 'error');
        return;
    }
    
    const userAnswer = parseInt(answerInput.value);
    
    if (isNaN(userAnswer)) {
        showMessage('请输入有效的数字', 'error');
        return;
    }
    
    if (userAnswer === window.mathAnswer) {
        closeMathCaptcha();
        showMessage('验证成功！', 'success');
        setTimeout(() => {
            // 模拟卡顿
            simulateSystemLag(() => {
                sendVerificationCode();
            });
        }, 500);
    } else {
        showMessage('答案错误，请重试', 'error');
        generateMathQuestion();
        answerInput.value = '';
    }
}

// 关闭数学验证码
function closeMathCaptcha() {
    const mathModal = document.getElementById('math-captcha-modal');
    if (mathModal) {
        mathModal.remove();
    }
}

// 执行登录
function performLogin() {
    const phone = document.getElementById('login-phone').value;
    const code = document.getElementById('verification-code').value;
    const agreed = document.getElementById('agree-terms').checked;
    
    if (!phone || !code) {
        showMessage('请填写完整信息', 'error');
        return;
    }
    
    if (!agreed) {
        showMessage('请先同意用户服务协议', 'error');
        return;
    }
    
    // 模拟系统卡顿
    simulateSystemLag(() => {
        // 降低登录失败率
        if (Math.random() < 0.15) {
            const errors = [
                '验证码错误，请重新输入',
                '验证码已过期，请重新获取',
                '系统繁忙，请稍后再试'
            ];
            showMessage(getRandomMessage(errors), 'error');
            return;
        }
        
        // 登录成功
        isLoggedIn = true;
        currentUser = { phone: phone };
        const userStatus = document.getElementById('user-status');
        if (userStatus) {
            userStatus.textContent = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        }
        const mainPhone = document.getElementById('main-phone');
        if (mainPhone) {
            mainPhone.value = phone;
            mainPhone.readOnly = true;
        }
        
        closeLoginModal();
        showMessage('登录成功！', 'success');
        
        // 延迟一下再开始预约流程
        setTimeout(() => {
            if (Math.random() < 0.3) {
                showQueueModal();
            } else {
                startBooking();
            }
        }, 1000);
    });
}

// 显示排队模态框
function showQueueModal() {
    const queueModal = document.getElementById('queue-modal');
    if (queueModal) {
        queueModal.style.display = 'block';
        startQueueAnimation();
        startQueueCountdown();
    }
}

// 开始排队动画
function startQueueAnimation() {
    const people = document.querySelectorAll('.person');
    let activeIndex = 0;
    
    setInterval(() => {
        people.forEach(p => p.classList.remove('active'));
        if (people[activeIndex]) {
            people[activeIndex].classList.add('active');
        }
        activeIndex = (activeIndex + 1) % people.length;
    }, 800);
}

// 开始排队倒计时
function startQueueCountdown() {
    queueInterval = setInterval(() => {
        // 随机减少排队人数
        const decrease = Math.floor(Math.random() * 5) + 1;
        queuePosition = Math.max(0, queuePosition - decrease);
        
        const queueCount = document.getElementById('queue-count');
        if (queueCount) {
            queueCount.textContent = queuePosition;
        }
        
        // 更新等待时间
        const waitTime = Math.ceil(queuePosition / 100);
        const queueTime = document.getElementById('queue-time');
        if (queueTime) {
            queueTime.textContent = `约${waitTime}分钟`;
        }
        
        // 如果排队人数降到很低，随机决定是否"成功"
        if (queuePosition < 50 && Math.random() < 0.3) {
            clearInterval(queueInterval);
            closeQueueModal();
            startBooking();
        }
        
        // 随机出现排队异常
        if (Math.random() < 0.02) {
            clearInterval(queueInterval);
            const errors = [
                '排队超时，请重新排队',
                '网络异常，排队已结束',
                '系统繁忙，请稍后重试'
            ];
            showMessage(getRandomMessage(errors), 'error');
            closeQueueModal();
        }
    }, 2000);
}

// 放弃排队
function giveUpQueue() {
    clearInterval(queueInterval);
    closeQueueModal();
    showMessage('已退出排队，返回首页', 'warning');
}

// 继续等待
function continueWaiting() {
    showMessage('请继续耐心等待...', 'warning');
}

// 关闭排队模态框
function closeQueueModal() {
    const queueModal = document.getElementById('queue-modal');
    if (queueModal) {
        queueModal.style.display = 'none';
    }
    if (queueInterval) {
        clearInterval(queueInterval);
    }
}

// 开始预约流程
function startBooking() {
    // 随机决定是否直接显示错误
    if (Math.random() < 0.1) {
        showMessage(getRandomMessage(errorMessages), 'error');
        return;
    }
    
    const bookingModal = document.getElementById('booking-modal');
    if (bookingModal) {
        bookingModal.style.display = 'block';
        currentStep = 1;
        showStep(1);
    }
}

// 关闭预约模态框
function closeModal() {
    const bookingModal = document.getElementById('booking-modal');
    if (bookingModal) {
        bookingModal.style.display = 'none';
    }
    resetBookingForm();
}

// 重置预约表单
function resetBookingForm() {
    currentStep = 1;
    selectedDate = '';
    selectedTime = '';
    bookingData = {};
    ticketCounts = { adult: 0, child: 0, senior: 0 };
    document.querySelectorAll('.booking-step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.ancient-time-slot').forEach(slot => slot.classList.remove('selected'));
    document.querySelectorAll('input[type="text"], input[type="date"]').forEach(input => {
        if (input.id !== 'main-phone') {
            input.value = '';
        }
    });
    updateTotalInfo();
}

// 显示指定步骤
function showStep(step) {
    document.querySelectorAll('.booking-step').forEach(s => s.classList.remove('active'));
    const stepElement = document.getElementById(`booking-step-${step}`);
    if (stepElement) {
        stepElement.classList.add('active');
    }
    currentStep = step;
}

// 下一步
function nextStep() {
    // 验证第一步
    if (currentStep === 1) {
        const date = document.getElementById('visit-date').value;
        
        if (!date) {
            showMessage('请选择预约日期', 'error');
            return;
        }
        
        if (!selectedTime) {
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
        
        // 模拟系统卡顿
        simulateSystemLag(() => {
            // 降低随机错误概率
            if (Math.random() < 0.2) {
                const messages = [
                    '该日期/时段已约满',
                    '库存不足，请选择其他日期',
                    '系统检测到该时段访问量过大，请选择其他时段'
                ];
                showMessage(getRandomMessage(messages), 'error');
                return;
            }
            
            selectedDate = date;
            showStep(2);
        });
    }
}

// 上一步
function prevStep() {
    if (currentStep === 3) {
        showStep(2);
    } else if (currentStep === 2) {
        showStep(1);
    }
}

// 进入信息填写步骤
function nextToInfo() {
    const totalTickets = ticketCounts.adult + ticketCounts.child + ticketCounts.senior;
    
    if (totalTickets === 0) {
        showMessage('请至少选择一张票', 'error');
        return;
    }
    
    if (totalTickets > 5) {
        showMessage('单次预约最多5张票', 'error');
        return;
    }
    
    // 模拟系统卡顿
    simulateSystemLag(() => {
        // 降低随机错误概率
        if (Math.random() < 0.15) {
            const errors = [
                '票种验证中，请稍后重试',
                '系统检测到价格异常，请重新选择'
            ];
            showMessage(getRandomMessage(errors), 'error');
            return;
        }
        
        showStep(3);
    });
}

// 修改票数
function changeTicketCount(type, delta) {
    const currentCount = ticketCounts[type];
    const newCount = Math.max(0, Math.min(5, currentCount + delta));
    
    ticketCounts[type] = newCount;
    const countElement = document.getElementById(`${type}-count`);
    if (countElement) {
        countElement.textContent = newCount;
    }
    
    updateTotalInfo();
}

// 更新总计信息
function updateTotalInfo() {
    const totalTickets = ticketCounts.adult + ticketCounts.child + ticketCounts.senior;
    const totalPrice = ticketCounts.adult * ticketPrices.adult + 
                      ticketCounts.child * ticketPrices.child + 
                      ticketCounts.senior * ticketPrices.senior;
    
    const totalTicketsElement = document.getElementById('total-tickets');
    const totalPriceElement = document.getElementById('total-price');
    
    if (totalTicketsElement) {
        totalTicketsElement.textContent = totalTickets;
    }
    if (totalPriceElement) {
        totalPriceElement.textContent = `¥${totalPrice}`;
    }
}

// 提交预约
function submitBooking() {
    // 获取表单数据
    const mainName = document.getElementById('main-name').value;
    const mainId = document.getElementById('main-id').value;
    const mainPhone = document.getElementById('main-phone').value;
    
    // 基本验证
    if (!mainName || !mainId || !mainPhone) {
        showMessage('请填写完整信息', 'error');
        return;
    }
    
    // 模拟系统卡顿
    simulateSystemLag(() => {
        // 大幅降低失败率，让用户更容易成功
        if (Math.random() < 0.1) {
            const errors = [
                '系统繁忙，请稍后重试',
                '网络异常，请重新提交'
            ];
            showMessage(getRandomMessage(errors), 'error');
            return;
        }
        
        // 预约成功，显示通关页面
        showSuccessPage();
    });
}

// 显示成功页面（通关页面）
function showSuccessPage() {
    closeModal();
    
    // 创建成功页面
    const successModal = document.createElement('div');
    successModal.className = 'modal ancient-modal';
    successModal.id = 'success-modal';
    successModal.innerHTML = `
        <div class="modal-content ancient-modal-content" style="max-width: 700px;">
            <div class="modal-header ancient-modal-header">
                <h2>🎉 预约成功</h2>
            </div>
            <div class="modal-body">
                <div class="success-content">
                    <div class="success-message">
                        <h3>恭喜您！预约成功！</h3>
                        <p>您已成功预约云游东洋景区门票</p>
                    </div>
                    
                    <div class="booking-details">
                        <h4>预约详情</h4>
                        <div class="detail-item">
                            <span class="label">预约日期：</span>
                            <span class="value">${selectedDate}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">游览时段：</span>
                            <span class="value">${selectedTime}:00-${parseInt(selectedTime) + 2}:00</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">票种数量：</span>
                            <span class="value">
                                ${ticketCounts.adult > 0 ? `成人票${ticketCounts.adult}张 ` : ''}
                                ${ticketCounts.child > 0 ? `儿童票${ticketCounts.child}张 ` : ''}
                                ${ticketCounts.senior > 0 ? `老年票${ticketCounts.senior}张` : ''}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="label">联系人：</span>
                            <span class="value">${document.getElementById('main-name').value}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">手机号：</span>
                            <span class="value">${document.getElementById('main-phone').value}</span>
                        </div>
                    </div>
                    
                    <div class="reality-reveal">
                        <h4>🎭 现实揭露</h4>
                        <div class="reveal-stats">
                            <div class="stat-reveal">
                                <span class="stat-label">实际余票数量：</span>
                                <span class="stat-value">2,847张</span>
                            </div>
                            <div class="stat-reveal">
                                <span class="stat-label">系统显示"已售罄"次数：</span>
                                <span class="stat-value">156次</span>
                            </div>
                            <div class="stat-reveal">
                                <span class="stat-label">人工验证码失败率：</span>
                                <span class="stat-value">78%</span>
                            </div>
                            <div class="stat-reveal">
                                <span class="stat-label">系统"卡顿"模拟次数：</span>
                                <span class="stat-value">23次</span>
                            </div>
                            <div class="stat-reveal">
                                <span class="stat-label">虚假排队人数：</span>
                                <span class="stat-value">2,847人（实际0人）</span>
                            </div>
                        </div>
                        
                        <div class="reality-text">
                            <h5>📢 系统现状分析</h5>
                            <p><strong>技术现状：</strong>明明有充足的服务器资源和带宽，却故意设置各种技术障碍，制造"系统繁忙"的假象。</p>
                            <p><strong>用户体验：</strong>普通游客需要经历无数次验证码、排队、卡顿，而黄牛却能轻松绕过这些限制。</p>
                            <p><strong>资源分配：</strong>大量票源被内部预留或流向黄牛渠道，留给普通用户的名额极其有限。</p>
                            <p><strong>设计目的：</strong>通过制造稀缺感和挫败感，迫使用户转向高价的"VIP通道"或黄牛服务。</p>
                            
                            <div class="solution-suggestion">
                                <h5>💡 改进建议</h5>
                                <ul>
                                    <li>简化预约流程，减少不必要的验证环节</li>
                                    <li>提高系统透明度，实时显示真实库存</li>
                                    <li>建立公平的排队机制，杜绝插队和特权</li>
                                    <li>加强对黄牛的技术防范和法律打击</li>
                                    <li>优化服务器性能，提供稳定的用户体验</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="success-actions">
                        <button class="ancient-button" onclick="closeSuccessModal()">我知道了</button>
                        <button class="ancient-button-secondary" onclick="restartBooking()">再次体验</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(successModal);
    successModal.style.display = 'block';
}

// 关闭成功模态框
function closeSuccessModal() {
    const successModal = document.getElementById('success-modal');
    if (successModal) {
        successModal.remove();
    }
}

// 重新开始预约
function restartBooking() {
    closeSuccessModal();
    resetBookingForm();
    setTimeout(() => {
        startBooking();
    }, 500);
}

// 获取随机消息
function getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
}

// 显示消息提示
function showMessage(message, type = 'info') {
    const toast = document.getElementById('message-toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `message-toast ancient-toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};
