// ========================================
// 增强功能模块 - 适配微信小程序风格UI
// ========================================

// 监听错误类型（成就系统用）
let observedErrors = new Set();

const originalShowMessage = window.showMessage;
window.showMessage = function(message, type) {
    if (type === 'error') {
        observedErrors.add(message);
        if (observedErrors.size >= 10 && typeof unlockAchievement === 'function') {
            unlockAchievement('error_10');
        }
    }
    if (originalShowMessage) originalShowMessage(message, type);
};

// 增强的预约提交（增加更多随机失败）
const originalSubmitBooking = window.submitBooking;
window.submitBooking = function() {
    // 周一检测成就
    if (selectedDate) {
        const d = new Date(selectedDate);
        if (d.getDay() === 1 && typeof unlockAchievement === 'function') {
            unlockAchievement('monday_visitor');
        }
    }

    // 排队计数
    if (typeof queueCount !== 'undefined') {
        queueCount++;
        if (queueCount >= 5 && typeof unlockAchievement === 'function') {
            unlockAchievement('queue_master');
        }
    }

    if (originalSubmitBooking) originalSubmitBooking();
};

// 监听抽签失败
const originalShowLotteryResult2 = window.showLotteryResult;
window.showLotteryResult = function() {
    if (typeof lotteryFailCount !== 'undefined') {
        lotteryFailCount++;
        if (lotteryFailCount >= 3 && typeof unlockAchievement === 'function') {
            unlockAchievement('lottery_fail_3');
        }
    }
    if (originalShowLotteryResult2) originalShowLotteryResult2();
};

// 监听排队超时
const originalGiveUpQueue = window.giveUpQueue;
window.giveUpQueue = function() {
    if (typeof unlockAchievement === 'function') {
        unlockAchievement('queue_timeout');
    }
    if (originalGiveUpQueue) originalGiveUpQueue();
};

console.log('增强功能模块已加载');
