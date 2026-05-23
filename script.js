// ========================================
// 云游东洋 - 核心业务逻辑
// ========================================

// 全局状态
let isLoggedIn = false;
let currentUser = null;
let currentTab = 'home';
let selectedDate = '';
let selectedTime = '';
let selectedSpotId = 'gugong'; // 默认选中紫禁城
let ticketCounts = { adult: 0, child: 0, senior: 0 };
let selectedIdentity = null;
let selectedPaymentMethod = 'wechat';
let queueInterval = null;
let queuePosition = 0;
let currentQueueId = null;
let toastTimer = null;
let bookingState = 'entry'; // entry, date, time, ticket, identity, queue
let currentBookingId = null;
let hasAgreedSession = false; // 本次会话是否已同意过协议
let currentSpotsData = null; // 当前景点数据

// 票价配置（从scenic-data.js动态获取）
let ticketPrices = { adult: 60, child: 30, senior: 30 };

// 虚拟手机号列表
const virtualPhones = [
    '138****6789', '139****1234', '136****5678', '137****8901',
    '158****3456', '159****7890', '186****2345', '188****6789',
    '135****0123', '150****4567', '151****8901', '152****2345',
    '153****6789', '155****0123', '156****4567', '157****8901',
    '180****2345', '181****6789', '182****0123', '183****4567',
    '185****8901', '187****2345', '189****6789', '170****0123',
    '171****4567', '176****8901', '177****2345', '198****6789',
    '199****0123', '175****4567'
];
let selectedVirtualPhone = '';
let phoneDropdownOpen = false;

// ========================================
// 放票倒计时
// ========================================
const RELEASE_TIME_KEY = 'dongyang_release_time';
let releaseTime = 0;
let releaseTimer = null;
let bookingPhaseTimer = null;

function initReleaseTime() {
    const saved = localStorage.getItem(RELEASE_TIME_KEY);
    if (saved) {
        releaseTime = parseInt(saved, 10);
        if (Date.now() >= releaseTime) {
            localStorage.removeItem(RELEASE_TIME_KEY);
            releaseTime = 0;
        }
    } else {
        releaseTime = Date.now() + 60000;
        localStorage.setItem(RELEASE_TIME_KEY, releaseTime.toString());
    }
}

function isBeforeRelease() {
    return releaseTime > 0 && Date.now() < releaseTime;
}

function getReleaseSeconds() {
    return Math.max(0, Math.ceil((releaseTime - Date.now()) / 1000));
}

function startReleaseCountdown() {
    const banner = document.getElementById('release-banner');
    const timer = document.getElementById('release-timer');
    if (!banner || !timer) return;

    banner.style.display = 'block';
    timer.textContent = getReleaseSeconds();

    releaseTimer = setInterval(() => {
        const secs = getReleaseSeconds();
        timer.textContent = secs;
        if (secs <= 0) {
            clearInterval(releaseTimer);
            releaseTimer = null;
            banner.style.display = 'none';
            localStorage.removeItem(RELEASE_TIME_KEY);
            releaseTime = 0;
            showMessage('系统已放票，请尽快预约', 'success');
            loadScenicSpots();
            startBookingPhase();
        }
    }, 1000);
}

function forceLoadAvailableTickets() {
    // 跳过API请求，直接生成有余票的本地数据
    if (typeof SCENIC_SPOTS !== 'undefined') {
        currentSpotsData = Object.values(SCENIC_SPOTS).map(spot => {
            const total = spot.maxDailyCapacity / 2;
            return {
                ...spot,
                slots: spot.timeSlots.map(slot => {
                    const raw = Math.floor(Math.random() * total * 0.8) + Math.floor(total * 0.05);
                    const remaining = Math.min(raw, total);
                    const ratio = remaining / total;
                    let displayStatus = 'available';
                    if (remaining <= 0) {
                        displayStatus = 'sold_out';
                    } else if (ratio < 0.05) {
                        displayStatus = 'scarce';
                    } else if (ratio < 0.2) {
                        displayStatus = 'warn';
                    }
                    return {
                        time: slot.id,
                        label: slot.label,
                        timeRange: slot.time,
                        remaining,
                        total,
                        displayStatus
                    };
                })
            };
        });
    }
    stopReleaseCountdown();
    updateScenicPage();
    updateTicketPrices();
}

function stopReleaseCountdown() {
    if (releaseTimer) {
        clearInterval(releaseTimer);
        releaseTimer = null;
    }
    const banner = document.getElementById('release-banner');
    if (banner) banner.style.display = 'none';
    localStorage.removeItem(RELEASE_TIME_KEY);
    releaseTime = 0;
}

const BOOKING_PHASE_DURATION = 45;

function startBookingPhase() {
    stopBookingPhase();
    const banner = document.getElementById('booking-phase-banner');
    const timer = document.getElementById('booking-phase-timer');
    if (banner) banner.style.display = 'block';
    if (timer) timer.textContent = BOOKING_PHASE_DURATION;

    let remaining = BOOKING_PHASE_DURATION;
    bookingPhaseTimer = setInterval(() => {
        remaining--;
        const timerEl = document.getElementById('booking-phase-timer');
        if (timerEl) timerEl.textContent = Math.max(0, remaining);
        if (remaining <= 0) {
            clearInterval(bookingPhaseTimer);
            bookingPhaseTimer = null;
            if (banner) banner.style.display = 'none';
            showMessage('余票已刷新，请继续预约', 'warning');
            refreshRemainingTickets();
            startBookingPhase();
        }
    }, 1000);
}

function refreshRemainingTickets() {
    // 优先从服务端获取最新余票数据
    if (typeof API !== 'undefined') {
        API.getScenicSpots().then(result => {
            if (result && result.spots) {
                currentSpotsData = result.spots;
                updateScenicPage();
                const container = document.querySelector('.time-slots-grid');
                if (container && selectedDate) {
                    loadTimeSlots();
                }
                return;
            }
            refreshRemainingTicketsLocal();
        }).catch(() => refreshRemainingTicketsLocal());
    } else {
        refreshRemainingTicketsLocal();
    }
}

function refreshRemainingTicketsLocal() {
    if (!currentSpotsData) return;
    currentSpotsData.forEach(spot => {
        if (spot.slots) {
            spot.slots.forEach(slot => {
                const total = slot.total || 40000;
                const raw = Math.floor(Math.random() * total * 0.8) + Math.floor(total * 0.05);
                slot.remaining = Math.min(raw, total);
                const ratio = slot.remaining / total;
                if (slot.remaining <= 0) {
                    slot.displayStatus = 'sold_out';
                } else if (ratio < 0.05) {
                    slot.displayStatus = 'scarce';
                } else if (ratio < 0.2) {
                    slot.displayStatus = 'warn';
                } else {
                    slot.displayStatus = 'available';
                }
            });
        }
    });
    updateScenicPage();
    const container = document.querySelector('.time-slots-grid');
    if (container && selectedDate) {
        loadTimeSlots();
    }
}

function stopBookingPhase() {
    if (bookingPhaseTimer) {
        clearInterval(bookingPhaseTimer);
        bookingPhaseTimer = null;
    }
    const banner = document.getElementById('booking-phase-banner');
    if (banner) banner.style.display = 'none';
}

function startNextRound() {
    stopReleaseCountdown();
    stopBookingPhase();
    clearInterval(queueInterval);
    queueInterval = null;
    localStorage.removeItem(RELEASE_TIME_KEY);
    releaseTime = Date.now() + 60000;
    localStorage.setItem(RELEASE_TIME_KEY, releaseTime.toString());
    currentSpotsData = null;
    currentQueueId = null;
    queuePosition = 0;
    Storage.clearQueueState();
    // 通知服务端进入下一轮
    if (typeof API !== 'undefined') {
        API.nextRound().then(result => {
            if (result && result.releaseTime) {
                releaseTime = result.releaseTime;
                localStorage.setItem(RELEASE_TIME_KEY, releaseTime.toString());
            }
        }).catch(() => {});
    }
    showMessage('即将开启新一轮放票', 'warning');
    setTimeout(() => {
        loadScenicSpots();
    }, 500);
}

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
    // 初始化放票倒计时
    initReleaseTime();

    // 初始化虚拟手机号选择器
    initVirtualPhoneDropdown();

    // 从localStorage恢复登录状态
    const savedUser = Storage.getUser();
    if (savedUser && savedUser.phone) {
        isLoggedIn = true;
        currentUser = { phone: savedUser.phone };
        document.getElementById('profile-name').textContent = '东洋游客';
        document.getElementById('profile-phone').textContent = savedUser.phone;
        document.getElementById('profile-avatar').textContent = '😊';
    }

    // 从localStorage恢复成就进度
    const savedAchievements = Storage.getAchievements();
    if (savedAchievements && typeof achievements !== 'undefined') {
        for (const [key, val] of Object.entries(savedAchievements)) {
            if (achievements[key]) {
                achievements[key].unlocked = val.unlocked;
                achievements[key].unlockedAt = val.unlockedAt;
            }
        }
        if (typeof getUnlockedCount === 'function') {
            const badge = document.getElementById('achievement-badge');
            if (badge) badge.textContent = getUnlockedCount();
        }
    }

    // 从localStorage恢复排队状态
    const savedQueue = Storage.getQueueState();
    if (savedQueue && isLoggedIn) {
        bookingState = 'queue';
        queuePosition = savedQueue.queuePosition || 0;
        currentQueueId = savedQueue.queueId || null;
        selectedSpotId = savedQueue.spotId || 'gugong';
    }

    // 加载景点数据
    loadScenicSpots();

    // 加载动画
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('home-content').style.display = 'block';
    }, 2500);
});

// 加载景点数据
async function loadScenicSpots() {
    if (typeof API !== 'undefined') {
        const result = await API.getScenicSpots();
        if (result && result.spots) {
            currentSpotsData = result.spots;
            // 如果API返回了放票时间，覆盖本地时间
            if (result.releaseTime && result.releaseTime > Date.now()) {
                releaseTime = result.releaseTime;
                localStorage.setItem(RELEASE_TIME_KEY, releaseTime.toString());
            } else if (result.releaseTime && result.releaseTime <= Date.now()) {
                // 服务端已放票，清除本地倒计时
                stopReleaseCountdown();
            }
        }
    }
    // 如果API不可用或失败，使用本地scenic-data.js的数据
    if (!currentSpotsData && typeof SCENIC_SPOTS !== 'undefined') {
        currentSpotsData = Object.values(SCENIC_SPOTS).map(spot => ({
            ...spot,
            slots: spot.timeSlots.map(slot => ({
                time: slot.id,
                label: slot.label,
                timeRange: slot.time,
                remaining: Math.floor(Math.random() * 50000) + 1000,
                total: spot.maxDailyCapacity / 2,
                displayStatus: 'available'
            }))
        }));
    }

    // 放票时间未到：覆盖所有数据为已售罄
    if (isBeforeRelease() && currentSpotsData) {
        currentSpotsData.forEach(spot => {
            if (spot.slots) {
                spot.slots.forEach(slot => {
                    slot.remaining = 0;
                    slot.displayStatus = 'sold_out';
                });
            }
        });
        startReleaseCountdown();
    } else {
        stopReleaseCountdown();
    }

    updateScenicPage();
    updateTicketPrices();
}

// 更新景点页面
function updateScenicPage() {
    const list = document.querySelector('.scenic-list');
    if (!list || !currentSpotsData) return;

    list.innerHTML = '';
    currentSpotsData.forEach(spot => {
        const config = typeof SCENIC_SPOTS !== 'undefined' ? SCENIC_SPOTS[spot.id] : null;
        const name = config ? config.alias || config.name : spot.name;
        const emoji = config ? config.emoji : '🏯';
        const gradient = config ? config.gradient : 'linear-gradient(135deg, #667eea, #764ba2)';
        const price = config ? config.ticketPrices.adult : (spot.ticketPrices ? spot.ticketPrices.adult : 60);

        // 计算状态
        let statusClass = 'available';
        let statusText = '可预约';
        if (spot.isClosed) {
            statusClass = 'closed';
            statusText = '闭馆';
        } else if (spot.slots) {
            const totalRemaining = spot.slots.reduce((sum, s) => sum + (s.remaining || 0), 0);
            if (totalRemaining <= 0) {
                statusClass = 'sold-out';
                statusText = '已售罄';
            } else if (totalRemaining < 500) {
                statusClass = 'scarce';
                statusText = '余票紧张';
            }
        }

        const card = document.createElement('div');
        card.className = 'scenic-card';
        card.onclick = () => selectScenicSpot(spot.id);
        card.innerHTML = `
            <div class="scenic-img" style="background:${gradient};"><span class="scenic-emoji">${emoji}</span></div>
            <div class="scenic-info">
                <h3>${name}</h3><p class="scenic-desc">${config ? config.description : ''}</p>
                <div class="scenic-meta"><span class="scenic-price">¥${price}/人</span><span class="scenic-status ${statusClass}">${statusText}</span></div>
            </div>
        `;
        list.appendChild(card);
    });
}

// 选择景点
function selectScenicSpot(spotId) {
    selectedSpotId = spotId;
    updateTicketPrices();
    switchTab('booking');
}

// 更新票价
function updateTicketPrices() {
    if (typeof SCENIC_SPOTS !== 'undefined' && SCENIC_SPOTS[selectedSpotId]) {
        ticketPrices = { ...SCENIC_SPOTS[selectedSpotId].ticketPrices };
        // 更新票种选择区域的价格显示
        const adultPriceEl = document.querySelector('.ticket-item:nth-child(1) .ticket-price');
        const childPriceEl = document.querySelector('.ticket-item:nth-child(2) .ticket-price');
        const seniorPriceEl = document.querySelector('.ticket-item:nth-child(3) .ticket-price');
        if (adultPriceEl) adultPriceEl.textContent = `¥${ticketPrices.adult}`;
        if (childPriceEl) childPriceEl.textContent = `¥${ticketPrices.child}`;
        if (seniorPriceEl) seniorPriceEl.textContent = `¥${ticketPrices.senior}`;
    }
}

function initVirtualPhoneDropdown() {
    const dropdown = document.getElementById('phone-dropdown');
    if (!dropdown) return;

    dropdown.innerHTML = virtualPhones.map(phone => `
        <div class="phone-option" onclick="selectVirtualPhone('${phone}')">${phone}</div>
    `).join('');
}

function togglePhoneDropdown() {
    const dropdown = document.getElementById('phone-dropdown');
    if (!dropdown) return;
    phoneDropdownOpen = !phoneDropdownOpen;
    dropdown.classList.toggle('open', phoneDropdownOpen);
}

function selectVirtualPhone(phone) {
    selectedVirtualPhone = phone;
    document.getElementById('selected-phone-display').textContent = phone;
    document.getElementById('phone-dropdown').classList.remove('open');
    phoneDropdownOpen = false;
}

// 点击外部关闭下拉
document.addEventListener('click', function(e) {
    if (!e.target.closest('.virtual-phone-select')) {
        const dropdown = document.getElementById('phone-dropdown');
        if (dropdown) dropdown.classList.remove('open');
        phoneDropdownOpen = false;
    }
});

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
async function sendVerificationCode() {
    if (!selectedVirtualPhone) {
        showMessage('请先选择虚拟手机号', 'error');
        return;
    }

    // 显示验证码游戏（替代传统验证码）
    if (typeof showCaptchaGame === 'function') {
        showCaptchaGame();
        return;
    }

    // 备用：直接发送
    await doSendCode();
}

async function doSendCode() {
    const btn = document.getElementById('send-code-btn');
    if (!btn) return;

    // 尝试通过API发送验证码
    if (typeof API !== 'undefined') {
        const result = await API.requestCode(selectedVirtualPhone);
        if (result && result.code) {
            // API返回验证码（演示模式）
            showCodeNotification(result.code);
            showMessage('验证码已发送', 'success');
        } else if (result && result.success === false) {
            showMessage(result.error || '验证码发送失败，请重试', 'error');
            return;
        }
    } else {
        // 本地模式：20%概率发送失败
        if (Math.random() < 0.2) {
            showMessage('验证码发送失败，请重试', 'error');
            return;
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        showCodeNotification(code);
        showMessage('验证码已发送', 'success');
    }

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
async function performLogin() {
    if (!selectedVirtualPhone) {
        showMessage('请先选择虚拟手机号', 'error');
        return;
    }

    const code = document.getElementById('verification-code').value;
    const agreed = document.getElementById('agree-terms').checked;

    if (!code) {
        showMessage('请输入验证码', 'error');
        return;
    }

    if (!agreed) {
        showMessage('请先同意用户服务协议', 'error');
        return;
    }

    // 尝试通过API验证
    let loginSuccess = false;
    let loginError = '';

    if (typeof API !== 'undefined') {
        const result = await API.login(selectedVirtualPhone, code);
        if (result && result.success) {
            loginSuccess = true;
        } else {
            loginError = result ? result.error : '登录失败';
        }
    } else {
        // 本地模式：15%概率登录失败
        if (Math.random() < 0.15) {
            const errors = ['验证码错误', '验证码已过期', '系统繁忙，请稍后再试'];
            loginError = errors[Math.floor(Math.random() * errors.length)];
        } else {
            loginSuccess = true;
        }
    }

    if (!loginSuccess) {
        showMessage(loginError || '登录失败', 'error');
        return;
    }

    // 登录成功
    isLoggedIn = true;
    currentUser = { phone: selectedVirtualPhone };

    // 持久化到localStorage
    Storage.saveUser(selectedVirtualPhone);

    // 更新UI
    document.getElementById('profile-name').textContent = '东洋游客';
    document.getElementById('profile-phone').textContent = selectedVirtualPhone;
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
        actionBtn.disabled = false;
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

    // 本次会话首次预约时触发协议（更真实）
    if (!hasAgreedSession) {
        hasAgreedSession = true;
        showAgreementSheet();
        return;
    }

    // 加载该日期的时段数据
    loadTimeSlots();

    updateBookingPage();
}

// 加载时段数据
async function loadTimeSlots() {
    const container = document.querySelector('.time-slots-grid');
    if (!container) return;

    // 如果有API数据，使用真实数据
    if (currentSpotsData && selectedSpotId) {
        const spot = currentSpotsData.find(s => s.id === selectedSpotId);
        if (spot && spot.slots) {
            container.innerHTML = '';
            spot.slots.forEach(slot => {
                const remaining = slot.remaining || 0;
                const total = slot.total || 40000;
                const ratio = remaining / total;

                let statusClass = '';
                let statusText = '';
                if (slot.displayStatus === 'sold_out' || remaining <= 0) {
                    statusClass = 'sold-out';
                    statusText = '已售罄';
                } else if (ratio < 0.05) {
                    statusClass = 'scarce';
                    statusText = '即将售罄';
                } else if (ratio < 0.2) {
                    statusClass = 'warn';
                    statusText = '余票紧张';
                } else {
                    statusText = '余票充足';
                }

                const btn = document.createElement('button');
                btn.className = `time-slot-btn ${statusClass}`;
                btn.dataset.time = slot.id;
                btn.dataset.remaining = remaining;
                btn.onclick = () => selectTime(btn);
                btn.innerHTML = `
                    <span class="slot-time">${slot.label}</span>
                    <span class="slot-period">${slot.timeRange || slot.time || ''}</span>
                    <span class="slot-status ${statusClass}">${statusText}</span>
                    <span class="slot-remaining">剩余 ${remaining.toLocaleString()} 张</span>
                `;
                if (remaining <= 0) btn.disabled = true;
                container.appendChild(btn);
            });
            return;
        }
    }

    // 本地模式：使用默认时段
    const config = typeof SCENIC_SPOTS !== 'undefined' ? SCENIC_SPOTS[selectedSpotId] : null;
    const slots = config ? config.timeSlots : [
        { id: 'morning', label: '上午场', time: '08:30-12:00' },
        { id: 'afternoon', label: '下午场', time: '13:00-17:00' }
    ];

    container.innerHTML = '';
    slots.forEach(slot => {
        const total = config ? config.maxDailyCapacity / 2 : 40000;
        const raw = Math.floor(Math.random() * total * 0.8) + Math.floor(total * 0.05);
        const remaining = Math.min(raw, total);
        const ratio = remaining / total;

        let statusClass = '';
        let statusText = '';
        if (ratio < 0.05) {
            statusClass = 'scarce';
            statusText = '即将售罄';
        } else if (ratio < 0.2) {
            statusClass = 'warn';
            statusText = '余票紧张';
        } else {
            statusText = '余票充足';
        }

        const btn = document.createElement('button');
        btn.className = `time-slot-btn ${statusClass}`;
        btn.dataset.time = slot.id;
        btn.dataset.remaining = remaining;
        btn.onclick = () => selectTime(btn);
        btn.innerHTML = `
            <span class="slot-time">${slot.label}</span>
            <span class="slot-period">${slot.time}</span>
            <span class="slot-status ${statusClass}">${statusText}</span>
            <span class="slot-remaining">剩余 ${remaining.toLocaleString()} 张</span>
        `;
        container.appendChild(btn);
    });
}

// ========================================
// 时段选择
// ========================================
function selectTime(btn) {
    if (btn.disabled) {
        showMessage('该时段已售罄', 'error');
        return;
    }
    document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTime = btn.dataset.time;

    const config = typeof SCENIC_SPOTS !== 'undefined' ? SCENIC_SPOTS[selectedSpotId] : null;
    const slot = config ? config.timeSlots.find(s => s.id === selectedTime) : null;
    document.getElementById('display-time').textContent = slot ? slot.label : selectedTime;

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
async function submitBooking() {
    showMessage('系统响应中...', 'warning');

    // 尝试通过API提交
    if (typeof API !== 'undefined') {
        const config = typeof SCENIC_SPOTS !== 'undefined' ? SCENIC_SPOTS[selectedSpotId] : null;
        const result = await API.createBooking({
            phone: currentUser ? currentUser.phone : '',
            spotId: selectedSpotId,
            date: selectedDate,
            timeSlot: selectedTime,
            tickets: { ...ticketCounts },
            visitorName: selectedIdentity ? selectedIdentity.name : '游客',
            visitorId: selectedIdentity ? selectedIdentity.id : ''
        });

        if (result.inQueue) {
            // 进入排队
            stopBookingPhase();
            bookingState = 'queue';
            currentQueueId = result.queueId || null;
            queuePosition = result.queuePosition;
            Storage.saveQueueState({ queueId: currentQueueId, queuePosition, spotId: selectedSpotId });
            updateBookingPage();
            startQueueCountdown();
            if (typeof startSocialFeed === 'function') startSocialFeed();
            return;
        }

        if (result.lottery) {
            stopBookingPhase();
            showLotterySheet();
            return;
        }

        if (result.success) {
            stopBookingPhase();
            currentBookingId = result.bookingId;
            if (result.booking) Storage.saveBooking(result.booking);
            showPaymentSheet();
            return;
        }

        // API返回错误
        showMessage(result.error || '系统繁忙，请稍后重试', 'error');
        setTimeout(startNextRound, 3000);
        return;
    }

    // 本地模式：使用原来的随机逻辑
    if (Math.random() < 0.3 && bookingState !== 'queue') {
        stopBookingPhase();
        bookingState = 'queue';
        updateBookingPage();
        startQueueCountdown();
        if (typeof startSocialFeed === 'function') startSocialFeed();
        return;
    }

    if (Math.random() < 0.3) {
        stopBookingPhase();
        showLotterySheet();
        return;
    }

    setTimeout(() => {
        if (Math.random() < 0.3) {
            const errors = ['该日期/时段已约满', '库存不足，请选择其他日期', '票已售罄', '网络拥堵，请稍后重试'];
            showMessage(errors[Math.floor(Math.random() * errors.length)], 'error');
            setTimeout(startNextRound, 3000);
            return;
        }
        stopBookingPhase();
        showPaymentSheet();
    }, 1500 + Math.random() * 2000);
}

// ========================================
// 排队系统
// ========================================
function startQueueCountdown() {
    clearInterval(queueInterval);

    // 立即更新显示
    document.getElementById('queue-count').textContent = queuePosition;
    document.getElementById('queue-time').textContent = `约${Math.ceil(queuePosition / 100)}分钟`;

    queueInterval = setInterval(async () => {
        // 尝试通过API获取排队状态
        if (typeof API !== 'undefined' && currentUser) {
            const result = await API.getQueueStatus({ phone: currentUser.phone, queueId: currentQueueId });
            if (result && result.position !== undefined) {
                queuePosition = result.position;

                if (result.completed) {
                    clearInterval(queueInterval);
                    queueInterval = null;
                    bookingState = 'entry';
                    currentQueueId = null;
                    Storage.clearQueueState();
                    showMessage('排队成功！', 'success');
                    updateBookingPage();
                    return;
                }

                if (result.timeout) {
                    clearInterval(queueInterval);
                    queueInterval = null;
                    bookingState = 'entry';
                    currentQueueId = null;
                    Storage.clearQueueState();
                    showMessage('排队超时，即将进入下一轮放票', 'error');
                    updateBookingPage();
                    setTimeout(startNextRound, 3000);
                    return;
                }
            } else if (result && result.error) {
                clearInterval(queueInterval);
                queueInterval = null;
                bookingState = 'entry';
                currentQueueId = null;
                Storage.clearQueueState();
                showMessage(result.error, 'error');
                updateBookingPage();
                return;
            }
        } else {
            // 本地模式：随机递减
            const decrease = Math.floor(Math.random() * 5) + 1;
            queuePosition = Math.max(0, queuePosition - decrease);

            if (queuePosition < 50 && Math.random() < 0.3) {
                clearInterval(queueInterval);
                queueInterval = null;
                bookingState = 'entry';
                currentQueueId = null;
                Storage.clearQueueState();
                showMessage('排队成功！', 'success');
                updateBookingPage();
                return;
            }

            if (Math.random() < 0.02) {
                clearInterval(queueInterval);
                queueInterval = null;
                bookingState = 'entry';
                currentQueueId = null;
                Storage.clearQueueState();
                showMessage('排队超时，即将进入下一轮放票', 'error');
                updateBookingPage();
                setTimeout(startNextRound, 3000);
                return;
            }
        }

        // 更新显示
        document.getElementById('queue-count').textContent = queuePosition;
        document.getElementById('queue-time').textContent = `约${Math.ceil(queuePosition / 100)}分钟`;
        Storage.saveQueueState({ queueId: currentQueueId, queuePosition, spotId: selectedSpotId });
    }, 3000);
}

function giveUpQueue() {
    clearInterval(queueInterval);
    queueInterval = null;
    bookingState = 'entry';
    currentQueueId = null;
    Storage.clearQueueState();
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
                <div class="lottery-result-tips">点击下方按钮进入下一轮放票</div>
            </div>
        `;
        document.getElementById('start-lottery-btn').textContent = '进入下一轮放票';
        document.getElementById('start-lottery-btn').onclick = () => {
            closeLotterySheet();
            startNextRound();
        };

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
                setTimeout(startNextRound, 3000);
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
            showMessage('支付超时，订单已取消，即将进入下一轮放票', 'error');
            setTimeout(startNextRound, 3000);
        }
    }, 1000);

    // 存储timer以便清除
    window._paymentTimer = timer;
}

async function confirmPayment() {
    clearInterval(window._paymentTimer);

    const sheet = document.getElementById('payment-sheet');
    sheet.querySelector('.sheet-body').innerHTML = `
        <div class="payment-processing">
            <div class="payment-spinner"></div>
            <p>支付处理中...</p>
        </div>
    `;

    // 尝试通过API确认支付
    let paymentResult = null;
    if (typeof API !== 'undefined' && currentBookingId) {
        paymentResult = await API.confirmPayment(currentBookingId, selectedPaymentMethod);
    }

    // 本地模式：使用随机结果
    if (!paymentResult) {
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
        const rand = Math.random();
        if (rand < 0.2) {
            paymentResult = { success: false, error: 'payment_fail', message: '支付成功但出票失败' };
        } else if (rand < 0.35) {
            paymentResult = { success: false, error: 'payment_block', message: selectedPaymentMethod === 'dongyang' ? '东洋币余额不足' : '银行风控拦截' };
        } else {
            paymentResult = { success: true };
        }
    }

    if (!paymentResult.success) {
        const errorType = paymentResult.error;
        let icon = '⚠️';
        let title = paymentResult.message || '支付失败';
        let hint = '系统将在24小时内自动退款';

        if (errorType === 'payment_block') {
            icon = '🏦';
            hint = selectedPaymentMethod === 'dongyang' ? '您的东洋币余额：0.00' : '交易被银行安全系统拦截，请联系发卡行';
        }

        sheet.querySelector('.sheet-body').innerHTML = `
            <div class="payment-processing">
                <div style="font-size:48px;margin-bottom:12px;">${icon}</div>
                <p style="color:var(--wechat-danger);font-weight:600;">${title}</p>
                <p style="color:var(--wechat-text-secondary);font-size:13px;margin-top:8px;">${hint}</p>
                <button class="btn-primary btn-block" style="margin-top:16px;" onclick="closePaymentSheet();setTimeout(startNextRound,1000)">进入下一轮放票</button>
            </div>
        `;

        if (errorType === 'payment_fail' && typeof unlockAchievement === 'function') unlockAchievement('payment_fail');
        if (errorType === 'payment_block' && typeof unlockAchievement === 'function') unlockAchievement('payment_block');
        return;
    }

    // 支付成功
    sheet.querySelector('.sheet-body').innerHTML = `
        <div class="payment-processing">
            <div style="font-size:48px;margin-bottom:12px;">✅</div>
            <p style="color:var(--wechat-green);font-weight:600;">支付成功</p>
            <p style="color:var(--wechat-text-secondary);font-size:13px;margin-top:8px;">正在生成订单...</p>
        </div>
    `;

    // 更新预约记录状态
    if (currentBookingId) {
        const bookings = Storage.getBookings();
        const booking = bookings.find(b => b.id === currentBookingId);
        if (booking) {
            booking.status = 'confirmed';
            Storage.saveBooking(booking);
        }
    }

    setTimeout(() => {
        closePaymentSheet();
        showSuccessPage();
    }, 1500);
}

// ========================================
// 通关页面
// ========================================
function showSuccessPage() {
    const total = ticketCounts.adult * ticketPrices.adult +
                  ticketCounts.child * ticketPrices.child +
                  ticketCounts.senior * ticketPrices.senior;

    const config = typeof SCENIC_SPOTS !== 'undefined' ? SCENIC_SPOTS[selectedSpotId] : null;
    const spotName = config ? config.alias || config.name : '东洋秘境';

    const detailsEl = document.getElementById('success-details');
    detailsEl.innerHTML = `
        <div class="detail-row"><span>景点</span><span>${spotName}</span></div>
        <div class="detail-row"><span>预约日期</span><span>${selectedDate}</span></div>
        <div class="detail-row"><span>游览时段</span><span>${selectedTime === 'morning' ? '上午场' : '下午场'}</span></div>
        <div class="detail-row"><span>票种</span><span>
            ${ticketCounts.adult > 0 ? `成人${ticketCounts.adult}张 ` : ''}
            ${ticketCounts.child > 0 ? `儿童${ticketCounts.child}张 ` : ''}
            ${ticketCounts.senior > 0 ? `老年${ticketCounts.senior}张` : ''}
        </span></div>
        <div class="detail-row"><span>合计金额</span><span style="color:var(--wechat-danger)">¥${total}</span></div>
        <div class="detail-row"><span>游客</span><span>${selectedIdentity ? selectedIdentity.name : '游客'}</span></div>
        <div class="detail-row"><span>订单号</span><span>${currentBookingId || 'BK' + Date.now()}</span></div>
    `;

    // 生成揭露数据
    const realRemaining = Math.floor(Math.random() * 50000) + 10000;
    const fakeSoldOut = Math.floor(Math.random() * 200) + 50;
    const captchaFail = Math.floor(Math.random() * 30) + 60;
    const lagCount = Math.floor(Math.random() * 30) + 10;

    const statsEl = document.getElementById('reveal-stats');
    statsEl.innerHTML = `
        <div class="reveal-stat"><span class="label">实际余票</span><span class="value">${realRemaining.toLocaleString()}张</span></div>
        <div class="reveal-stat"><span class="label">"已售罄"次数</span><span class="value">${fakeSoldOut}次</span></div>
        <div class="reveal-stat"><span class="label">验证码失败率</span><span class="value">${captchaFail}%</span></div>
        <div class="reveal-stat"><span class="label">系统"卡顿"次数</span><span class="value">${lagCount}次</span></div>
        <div class="reveal-stat"><span class="label">虚假排队人数</span><span class="value">${queuePosition.toLocaleString()}人（实际0人）</span></div>
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

    // 更新预约记录数量
    const bookings = Storage.getBookings();
    const bookingCountEl = document.querySelector('.menu-item:nth-child(2) .menu-extra');
    if (bookingCountEl) {
        bookingCountEl.textContent = bookings.length;
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

// 显示预约记录
function showBookingHistory() {
    const bookings = Storage.getBookings();
    const sheet = document.getElementById('booking-history-sheet');
    const list = document.getElementById('booking-history-list');

    if (!list) return;

    if (bookings.length === 0) {
        list.innerHTML = '<div class="empty-history"><p>暂无预约记录</p></div>';
    } else {
        list.innerHTML = bookings.map(b => {
            const statusMap = {
                'pending_payment': { text: '待支付', class: 'pending' },
                'confirmed': { text: '已确认', class: 'confirmed' },
                'cancelled': { text: '已取消', class: 'cancelled' },
                'expired': { text: '已过期', class: 'expired' }
            };
            const status = statusMap[b.status] || { text: b.status, class: '' };
            const config = typeof SCENIC_SPOTS !== 'undefined' ? SCENIC_SPOTS[b.spotId] : null;
            const spotName = config ? config.alias || config.name : b.spotName || '未知景点';

            return `
                <div class="booking-history-item">
                    <div class="history-header">
                        <span class="history-spot">${spotName}</span>
                        <span class="history-status ${status.class}">${status.text}</span>
                    </div>
                    <div class="history-details">
                        <span>${b.date} ${b.timeSlot === 'morning' ? '上午场' : '下午场'}</span>
                        <span>¥${b.totalAmount || 0}</span>
                    </div>
                    <div class="history-id">订单号：${b.id}</div>
                    ${b.status === 'pending_payment' ? `<button class="btn-outline btn-sm" onclick="cancelBookingFromHistory('${b.id}')">取消订单</button>` : ''}
                </div>
            `;
        }).join('');
    }

    sheet.classList.add('show');
}

function closeBookingHistorySheet() {
    document.getElementById('booking-history-sheet').classList.remove('show');
}

async function cancelBookingFromHistory(bookingId) {
    if (typeof API !== 'undefined' && currentUser) {
        const result = await API.cancelBooking(bookingId, currentUser.phone);
        if (!result || !result.success) {
            showMessage((result && result.error) || '取消订单失败', 'error');
            return;
        }
    }
    Storage.cancelBooking(bookingId);
    showMessage('订单已取消', 'success');
    showBookingHistory(); // 刷新列表
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
