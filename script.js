// ========================================
// 云游东洋 - 核心业务逻辑
// ========================================

// 全局状态
let isLoggedIn = false;
let currentUser = null;
let currentTab = 'home';
let selectedDate = '';
let selectedTime = '';
let ticketCounts = { adult: 0, child: 0, senior: 0 };
let selectedIdentity = null;
let selectedPaymentMethod = 'wechat';
let queueInterval = null;
let queuePosition = 2847;
let toastTimer = null;
let bookingState = 'entry'; // entry, date, time, ticket, identity, queue

// 票价配置
const ticketPrices = { adult: 128, child: 68, senior: 88 };

// ========================================
// 页面路由
// ========================================
function switchTab(tab) {
    currentTab = tab;

    // 更新TabBar
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });

    // 更新页面显示
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const pageMap = {
        'home': 'page-home',
        'scenic': 'page-scenic',
        'booking': 'page-booking',
        'profile': 'page-profile'
    };

    const pageEl = document.getElementById(pageMap[tab]);
    if (pageEl) pageEl.classList.add('active');

    // 更新导航栏标题
    const titles = {
        'home': '云游东洋',
        'scenic': '景点列表',
        'booking': '景区预约',
        'profile': '我的'
    };
    document.getElementById('nav-title').textContent = titles[tab] || '云游东洋';

    // 更新导航栏返回按钮
    const backBtn = document.getElementById('nav-back');
    backBtn.style.display = (tab === 'home') ? 'none' : 'block';

    // 更新预约页面状态
    if (tab === 'booking') {
        updateBookingPage();
    }

    // 更新个人页面
    if (tab === 'profile') {
        updateProfilePage();
    }
}

function goBack() {
    switchTab('home');
}

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // 更新状态栏时间
    updateStatusTime();
    setInterval(updateStatusTime, 60000);

    // 加载动画
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('home-content').style.display = 'block';
    }, 2500);
});

function updateStatusTime() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('status-time').textContent = `${h}:${m}`;
}

// ========================================
// Toast 提示
// ========================================
function showMessage(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = 'toast show';

    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ========================================
// 登录系统
// ========================================
function showLoginSheet() {
    document.getElementById('login-sheet').classList.add('show');
}

function closeLoginSheet() {
    document.getElementById('login-sheet').classList.remove('show');
}

// 发送验证码
function sendVerificationCode() {
    const phone = document.getElementById('login-phone').value;

    if (!phone || phone.length !== 11) {
        showMessage('请输入正确的手机号码', 'error');
        return;
    }

    // 显示验证码游戏（替代传统验证码）
    if (typeof showCaptchaGame === 'function') {
        showCaptchaGame();
        return;
    }

    // 备用：直接发送
    doSendCode();
}

function doSendCode() {
    const btn = document.getElementById('send-code-btn');
    if (!btn) return;

    // 20%概率发送失败
    if (Math.random() < 0.2) {
        showMessage('验证码发送失败，请重试', 'error');
        return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    showCodeNotification(code);

    showMessage('验证码已发送', 'success');

    // 倒计时
    let countdown = 60;
    btn.disabled = true;
    btn.textContent = `${countdown}s`;

    const timer = setInterval(() => {
        countdown--;
        btn.textContent = `${countdown}s`;
        if (countdown <= 0) {
            clearInterval(timer);
            btn.disabled = false;
            btn.textContent = '发送验证码';
        }
    }, 1000);
}

function showCodeNotification(code) {
    const existing = document.querySelector('.code-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'code-notification show';
    notification.innerHTML = `
        <div class="notification-header">
            <span class="notification-title">短信验证码</span>
            <button class="close-notification" onclick="this.closest('.code-notification').remove()">&times;</button>
        </div>
        <div class="verification-code">${code}</div>
        <div class="notification-text">请将此验证码输入到登录框中</div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 8000);
}

// 执行登录
function performLogin() {
    const phone = document.getElementById('login-phone').value;
    const code = document.getElementById('verification-code').value;
    const agreed = document.getElementById('agree-terms').checked;

    if (!phone || phone.length !== 11) {
        showMessage('请输入正确的手机号码', 'error');
        return;
    }

    if (!code) {
        showMessage('请输入验证码', 'error');
        return;
    }

    if (!agreed) {
        showMessage('请先同意用户服务协议', 'error');
        return;
    }

    // 15%概率登录失败
    if (Math.random() < 0.15) {
        const errors = ['验证码错误', '验证码已过期', '系统繁忙，请稍后再试'];
        showMessage(errors[Math.floor(Math.random() * errors.length)], 'error');
        return;
    }

    // 登录成功
    isLoggedIn = true;
    currentUser = { phone };

    // 更新UI
    document.getElementById('profile-name').textContent = '东洋游客';
    document.getElementById('profile-phone').textContent = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    document.getElementById('profile-avatar').textContent = '😊';

    closeLoginSheet();
    showMessage('登录成功', 'success');

    // 触发成就
    if (typeof unlockAchievement === 'function') {
        unlockAchievement('first_login');
    }

    updateBookingPage();
}

// ========================================
// 预约页面状态管理
// ========================================
function updateBookingPage() {
    const notLogged = document.getElementById('booking-not-logged');
    const logged = document.getElementById('booking-logged');
    const queue = document.getElementById('booking-queue');

    if (!isLoggedIn) {
        notLogged.style.display = 'block';
        logged.style.display = 'none';
        queue.style.display = 'none';
        return;
    }

    notLogged.style.display = 'none';

    // 如果在排队中
    if (bookingState === 'queue') {
        logged.style.display = 'none';
        queue.style.display = 'block';
        return;
    }

    logged.style.display = 'block';
    queue.style.display = 'none';

    // 根据状态显示不同区域
    const timeSlots = document.getElementById('time-slots-section');
    const ticketSection = document.getElementById('ticket-section');
    const identitySection = document.getElementById('identity-section');
    const actionBtn = document.getElementById('booking-action-btn');

    timeSlots.style.display = selectedDate ? 'block' : 'none';
    ticketSection.style.display = selectedTime ? 'block' : 'none';
    identitySection.style.display = (ticketCounts.adult + ticketCounts.child + ticketCounts.senior > 0) ? 'block' : 'none';

    // 更新按钮文字
    if (!selectedDate) {
        actionBtn.textContent = '选择日期和时段';
        actionBtn.disabled = false;
    } else if (!selectedTime) {
        actionBtn.textContent = '请选择时段';
        actionBtn.disabled = true;
    } else if (ticketCounts.adult + ticketCounts.child + ticketCounts.senior === 0) {
        actionBtn.textContent = '请选择票种';
        actionBtn.disabled = true;
    } else if (!selectedIdentity) {
        actionBtn.textContent = '请选择游客身份';
        actionBtn.disabled = true;
    } else {
        actionBtn.textContent = '提交预约';
        actionBtn.disabled = false;
    }
}

// ========================================
// 日期选择
// ========================================
function openDatePicker() {
    const grid = document.getElementById('date-grid');
    grid.innerHTML = '';

    const today = new Date();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    // 生成7天日期
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const item = document.createElement('div');
        item.className = 'date-item';

        const isMonday = date.getDay() === 1;
        const isToday = i === 0;

        if (isMonday) {
            item.classList.add('disabled');
        }

        if (isToday) {
            item.classList.add('today');
        }

        if (selectedDate === date.toISOString().split('T')[0]) {
            item.classList.add('selected');
        }

        item.innerHTML = `
            <span class="date-day">${date.getDate()}</span>
            <span class="date-weekday">${isToday ? '今天' : '周' + weekdays[date.getDay()]}</span>
        `;

        if (!isMonday) {
            item.onclick = () => {
                grid.querySelectorAll('.date-item').forEach(d => d.classList.remove('selected'));
                item.classList.add('selected');
                selectedDate = date.toISOString().split('T')[0];
            };
        }

        grid.appendChild(item);
    }

    document.getElementById('date-sheet').classList.add('show');
}

function closeDatePicker() {
    document.getElementById('date-sheet').classList.remove('show');
}

function confirmDate() {
    if (!selectedDate) {
        showMessage('请选择日期', 'error');
        return;
    }

    // 检查是否为周一
    const date = new Date(selectedDate);
    if (date.getDay() === 1) {
        showMessage('景区每周一闭馆维护', 'error');
        return;
    }

    closeDatePicker();

    // 更新显示
    const dateObj = new Date(selectedDate);
    document.getElementById('display-date').textContent =
        `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;

    // 40%概率触发协议
    if (Math.random() < 0.4) {
        showAgreementSheet();
        return;
    }

    updateBookingPage();
}

// ========================================
// 时段选择
// ========================================
function selectTime(btn) {
    document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTime = btn.dataset.time;

    document.getElementById('display-time').textContent = selectedTime + ':00';

    updateBookingPage();
}

// ========================================
// 票种选择
// ========================================
function changeTicket(type, delta) {
    const current = ticketCounts[type];
    const newVal = Math.max(0, Math.min(5, current + delta));
    ticketCounts[type] = newVal;

    document.getElementById(`${type}-count`).textContent = newVal;
    updateTicketTotal();
    updateBookingPage();
}

function updateTicketTotal() {
    const total = ticketCounts.adult + ticketCounts.child + ticketCounts.senior;
    const price = ticketCounts.adult * ticketPrices.adult +
                  ticketCounts.child * ticketPrices.child +
                  ticketCounts.senior * ticketPrices.senior;

    document.getElementById('total-count').textContent = total;
    document.getElementById('total-price').textContent = `¥${price}`;
}

// ========================================
// 预约主流程
// ========================================
function bookingAction() {
    if (!selectedDate) {
        openDatePicker();
        return;
    }

    if (!selectedTime) {
        showMessage('请选择时段', 'error');
        return;
    }

    const totalTickets = ticketCounts.adult + ticketCounts.child + ticketCounts.senior;
    if (totalTickets === 0) {
        showMessage('请选择票种', 'error');
        return;
    }

    if (!selectedIdentity) {
        // 触发虚拟身份选择
        if (typeof showIdentitySelector === 'function') {
            showIdentitySelector();
        }
        return;
    }

    // 提交预约
    submitBooking();
}

// ========================================
// 提交预约
// ========================================
function submitBooking() {
    // 30%概率进入排队
    if (Math.random() < 0.3 && bookingState !== 'queue') {
        bookingState = 'queue';
        updateBookingPage();
        startQueueCountdown();
        if (typeof startSocialFeed === 'function') {
            startSocialFeed();
        }
        return;
    }

    // 40%概率弹出协议
    if (Math.random() < 0.4) {
        showAgreementSheet();
        return;
    }

    // 30%概率进入抽签
    if (Math.random() < 0.3) {
        showLotterySheet();
        return;
    }

    // 模拟系统卡顿
    showMessage('系统响应中...', 'warning');

    setTimeout(() => {
        // 各种随机失败
        const failRate = 0.3;
        if (Math.random() < failRate) {
            const errors = [
                '该日期/时段已约满',
                '库存不足，请选择其他日期',
                '系统检测到异常，请重新操作',
                '票已售罄',
                '网络拥堵，请稍后重试'
            ];
            showMessage(errors[Math.floor(Math.random() * errors.length)], 'error');
            return;
        }

        // 进入支付
        showPaymentSheet();

    }, 1500 + Math.random() * 2000);
}

// ========================================
// 排队系统
// ========================================
function startQueueCountdown() {
    queuePosition = 2847;

    queueInterval = setInterval(() => {
        const decrease = Math.floor(Math.random() * 5) + 1;
        queuePosition = Math.max(0, queuePosition - decrease);

        document.getElementById('queue-count').textContent = queuePosition;
        document.getElementById('queue-time').textContent = `约${Math.ceil(queuePosition / 100)}分钟`;

        // 排队到低时随机通过
        if (queuePosition < 50 && Math.random() < 0.3) {
            clearInterval(queueInterval);
            bookingState = 'entry';
            showMessage('排队成功！', 'success');
            updateBookingPage();
        }

        // 2%概率排队异常
        if (Math.random() < 0.02) {
            clearInterval(queueInterval);
            bookingState = 'entry';
            const errors = ['排队超时', '网络异常，排队已结束'];
            showMessage(errors[Math.floor(Math.random() * errors.length)], 'error');
            updateBookingPage();
        }
    }, 2000);
}

function giveUpQueue() {
    clearInterval(queueInterval);
    bookingState = 'entry';
    showMessage('已退出排队', 'warning');
    updateBookingPage();
}

function continueWaiting() {
    showMessage('请继续耐心等待...', 'warning');
}

// ========================================
// 用户协议
// ========================================
function showAgreementSheet() {
    const sheet = document.getElementById('agreement-sheet');
    sheet.classList.add('show');

    const scrollEl = document.getElementById('agreement-scroll');
    const progressEl = document.getElementById('agreement-progress');
    const agreeBtn = document.getElementById('agree-btn');

    agreeBtn.disabled = true;

    scrollEl.onscroll = function() {
        const scrollTop = scrollEl.scrollTop;
        const scrollHeight = scrollEl.scrollHeight - scrollEl.clientHeight;
        const percent = Math.round((scrollTop / scrollHeight) * 100);

        progressEl.textContent = `阅读进度: ${percent}%`;

        if (percent >= 95) {
            agreeBtn.disabled = false;
            progressEl.textContent = '已阅读完毕，可以继续';
        }
    };
}

function closeAgreementSheet() {
    document.getElementById('agreement-sheet').classList.remove('show');
}

function disagreeAgreement() {
    closeAgreementSheet();
    showMessage('您必须同意协议才能继续', 'error');
}

function agreeAgreement() {
    closeAgreementSheet();
    showMessage('协议确认成功', 'success');

    // 触发成就
    if (typeof unlockAchievement === 'function') {
        unlockAchievement('agreement_reader');
    }

    updateBookingPage();
}

// ========================================
// 抽签系统
// ========================================
function showLotterySheet() {
    document.getElementById('lottery-sheet').classList.add('show');
    document.getElementById('lottery-status').innerHTML = `
        <div class="lottery-ball-icon">🎱</div>
        <p>点击下方按钮开始抽签</p>
    `;
    document.getElementById('start-lottery-btn').disabled = false;
    document.getElementById('start-lottery-btn').textContent = '开始抽签';
}

function closeLotterySheet() {
    document.getElementById('lottery-sheet').classList.remove('show');
}

function startLottery() {
    const startBtn = document.getElementById('start-lottery-btn');
    const statusEl = document.getElementById('lottery-status');

    startBtn.disabled = true;
    startBtn.textContent = '抽签中...';

    statusEl.innerHTML = `
        <div class="lottery-ball-icon" style="animation: spin 1s linear infinite;">🎱</div>
        <p>正在进行公平抽签，请稍候...</p>
        <div class="lottery-progress">
            <div class="lottery-progress-bar" id="lottery-progress-bar"></div>
        </div>
        <div class="lottery-count">参与人数：<span id="lottery-participants">28,947</span></div>
    `;

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 8 + 2;
        if (progress > 100) progress = 100;

        const bar = document.getElementById('lottery-progress-bar');
        if (bar) bar.style.width = progress + '%';

        // 随机增加参与人数
        if (Math.random() < 0.3) {
            const pEl = document.getElementById('lottery-participants');
            if (pEl) {
                const c = parseInt(pEl.textContent.replace(/,/g, ''));
                pEl.textContent = (c + Math.floor(Math.random() * 100)).toLocaleString();
            }
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(showLotteryResult, 1000);
        }
    }, 300);
}

function showLotteryResult() {
    const statusEl = document.getElementById('lottery-status');

    // 95%失败
    if (Math.random() < 0.95) {
        const num = Math.floor(Math.random() * 30000) + 1000;
        statusEl.innerHTML = `
            <div class="lottery-result">
                <div class="lottery-result-icon">😞</div>
                <h4>很遗憾，未中签</h4>
                <div class="lottery-result-details">
                    <p><span>参与人数</span><span>29,156人</span></p>
                    <p><span>中签人数</span><span>50人</span></p>
                    <p><span>您的号码</span><span>${num}</span></p>
                    <p><span>中签范围</span><span>1-50</span></p>
                    <p><span>中签率</span><span style="color:var(--wechat-danger)">0.17%</span></p>
                </div>
                <div class="lottery-result-tips">明日上午9:00将开启新一轮抽签</div>
            </div>
        `;
        document.getElementById('start-lottery-btn').textContent = '关闭';

        // 触发成就
        if (typeof unlockAchievement === 'function') {
            unlockAchievement('lottery_fail');
        }
    } else {
        const lucky = Math.floor(Math.random() * 50) + 1;
        statusEl.innerHTML = `
            <div class="lottery-result">
                <div class="lottery-result-icon">🎉</div>
                <h4>恭喜中签！</h4>
                <div class="lottery-result-details">
                    <p><span>您的号码</span><span style="color:var(--wechat-green)">${lucky}</span></p>
                    <p><span>状态</span><span>获得优先预约资格</span></p>
                </div>
                <div class="lottery-result-tips">请在10分钟内完成预约</div>
            </div>
        `;
        document.getElementById('start-lottery-btn').textContent = '继续预约';
        document.getElementById('start-lottery-btn').onclick = () => {
            closeLotterySheet();

            // 60%概率中签后还是失败
            if (Math.random() < 0.6) {
                showMessage('中签资格已失效', 'error');
                return;
            }
        };
    }
}

// ========================================
// 支付系统
// ========================================
function showPaymentSheet() {
    const total = ticketCounts.adult * ticketPrices.adult +
                  ticketCounts.child * ticketPrices.child +
                  ticketCounts.senior * ticketPrices.senior;

    document.getElementById('payment-amount').textContent = `¥${total}`;
    document.getElementById('payment-sheet').classList.add('show');

    // 开始倒计时
    startPaymentCountdown();

    // 初始化支付方式选择
    document.querySelectorAll('.payment-method').forEach((m, i) => {
        m.classList.toggle('selected', i === 0);
    });
}

function closePaymentSheet() {
    document.getElementById('payment-sheet').classList.remove('show');
}

function selectPayment(el, method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    el.classList.add('selected');
}

function startPaymentCountdown() {
    let timeLeft = 900; // 15分钟
    const countdownEl = document.getElementById('pay-countdown');

    const timer = setInterval(() => {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        if (countdownEl) {
            countdownEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        }
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(timer);
            closePaymentSheet();
            showMessage('支付超时，订单已取消', 'error');
        }
    }, 1000);

    // 存储timer以便清除
    window._paymentTimer = timer;
}

function confirmPayment() {
    clearInterval(window._paymentTimer);

    const sheet = document.getElementById('payment-sheet');
    sheet.querySelector('.sheet-body').innerHTML = `
        <div class="payment-processing">
            <div class="payment-spinner"></div>
            <p>支付处理中...</p>
        </div>
    `;

    // 3-6秒后出结果
    setTimeout(() => {
        const result = Math.random();

        if (result < 0.3) {
            // 支付成功但出票失败
            sheet.querySelector('.sheet-body').innerHTML = `
                <div class="payment-processing">
                    <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
                    <p style="color:var(--wechat-danger);font-weight:600;">支付成功但出票失败</p>
                    <p style="color:var(--wechat-text-secondary);font-size:13px;margin-top:8px;">系统将在24小时内自动退款</p>
                    <button class="btn-primary btn-block" style="margin-top:16px;" onclick="closePaymentSheet()">知道了</button>
                </div>
            `;

            if (typeof unlockAchievement === 'function') {
                unlockAchievement('payment_fail');
            }
        } else if (result < 0.5) {
            // 东洋币余额不足
            if (selectedPaymentMethod === 'dongyang') {
                sheet.querySelector('.sheet-body').innerHTML = `
                    <div class="payment-processing">
                        <div style="font-size:48px;margin-bottom:12px;">😅</div>
                        <p style="color:var(--wechat-danger);font-weight:600;">东洋币余额不足</p>
                        <p style="color:var(--wechat-text-secondary);font-size:13px;margin-top:8px;">您的东洋币余额：0.00</p>
                        <button class="btn-primary btn-block" style="margin-top:16px;" onclick="closePaymentSheet()">换种支付方式</button>
                    </div>
                `;
            } else {
                // 银行风控
                sheet.querySelector('.sheet-body').innerHTML = `
                    <div class="payment-processing">
                        <div style="font-size:48px;margin-bottom:12px;">🏦</div>
                        <p style="color:var(--wechat-danger);font-weight:600;">银行风控拦截</p>
                        <p style="color:var(--wechat-text-secondary);font-size:13px;margin-top:8px;">交易被银行安全系统拦截，请联系发卡行</p>
                        <button class="btn-primary btn-block" style="margin-top:16px;" onclick="closePaymentSheet()">知道了</button>
                    </div>
                `;
            }

            if (typeof unlockAchievement === 'function') {
                unlockAchievement('payment_block');
            }
        } else {
            // 支付成功
            sheet.querySelector('.sheet-body').innerHTML = `
                <div class="payment-processing">
                    <div style="font-size:48px;margin-bottom:12px;">✅</div>
                    <p style="color:var(--wechat-green);font-weight:600;">支付成功</p>
                    <p style="color:var(--wechat-text-secondary);font-size:13px;margin-top:8px;">正在生成订单...</p>
                </div>
            `;

            setTimeout(() => {
                closePaymentSheet();
                showSuccessPage();
            }, 1500);
        }
    }, 2000 + Math.random() * 3000);
}

// ========================================
// 通关页面
// ========================================
function showSuccessPage() {
    const total = ticketCounts.adult * ticketPrices.adult +
                  ticketCounts.child * ticketPrices.child +
                  ticketCounts.senior * ticketPrices.senior;

    const detailsEl = document.getElementById('success-details');
    detailsEl.innerHTML = `
        <div class="detail-row"><span>预约日期</span><span>${selectedDate}</span></div>
        <div class="detail-row"><span>游览时段</span><span>${selectedTime}:00-${parseInt(selectedTime)+2}:00</span></div>
        <div class="detail-row"><span>票种</span><span>
            ${ticketCounts.adult > 0 ? `成人${ticketCounts.adult}张 ` : ''}
            ${ticketCounts.child > 0 ? `儿童${ticketCounts.child}张 ` : ''}
            ${ticketCounts.senior > 0 ? `老年${ticketCounts.senior}张` : ''}
        </span></div>
        <div class="detail-row"><span>合计金额</span><span style="color:var(--wechat-danger)">¥${total}</span></div>
        <div class="detail-row"><span>游客</span><span>${selectedIdentity ? selectedIdentity.name : '游客'}</span></div>
    `;

    const statsEl = document.getElementById('reveal-stats');
    statsEl.innerHTML = `
        <div class="reveal-stat"><span class="label">实际余票</span><span class="value">2,847张</span></div>
        <div class="reveal-stat"><span class="label">"已售罄"次数</span><span class="value">156次</span></div>
        <div class="reveal-stat"><span class="label">验证码失败率</span><span class="value">78%</span></div>
        <div class="reveal-stat"><span class="label">系统"卡顿"次数</span><span class="value">23次</span></div>
        <div class="reveal-stat"><span class="label">虚假排队人数</span><span class="value">2,847人（实际0人）</span></div>
    `;

    document.getElementById('success-sheet').classList.add('show');

    // 触发成就
    if (typeof unlockAchievement === 'function') {
        unlockAchievement('booking_complete');
    }
}

function closeSuccessSheet() {
    document.getElementById('success-sheet').classList.remove('show');
}

function restartBooking() {
    closeSuccessSheet();
    selectedDate = '';
    selectedTime = '';
    ticketCounts = { adult: 0, child: 0, senior: 0 };
    selectedIdentity = null;
    bookingState = 'entry';

    document.getElementById('display-date').textContent = '请选择日期';
    document.getElementById('display-time').textContent = '请选择时段';
    document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.counter-val').forEach(el => el.textContent = '0');
    document.getElementById('total-count').textContent = '0';
    document.getElementById('total-price').textContent = '¥0';

    updateBookingPage();
}

// ========================================
// 个人页面
// ========================================
function updateProfilePage() {
    const badge = document.getElementById('achievement-badge');
    if (badge && typeof getUnlockedCount === 'function') {
        badge.textContent = getUnlockedCount();
    }
}

function showAchievements() {
    if (typeof renderAchievements === 'function') {
        renderAchievements();
    }
    document.getElementById('achievement-sheet').classList.add('show');
}

function closeAchievementSheet() {
    document.getElementById('achievement-sheet').classList.remove('show');
}

// ========================================
// 系统卡顿模拟
// ========================================
function simulateSystemLag(callback, minDelay = 1000, maxDelay = 3000) {
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    setTimeout(() => {
        const start = Date.now();
        while (Date.now() - start < Math.random() * 300 + 100) {
            // 故意卡顿
        }
        if (callback) callback();
    }, delay);
}
