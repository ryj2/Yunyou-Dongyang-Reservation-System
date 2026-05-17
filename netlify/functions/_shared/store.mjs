// ========================================
// 共享内存状态（Netlify Functions）
// 注意：冷启动后状态会重置（这是设计的一部分）
// ========================================

// 库存: spotId -> date -> timeSlot -> { total, remaining }
const inventory = {};

// 用户: phone -> { phone, createdAt, verificationCode, codeExpiry, codeAttempts }
const users = {};

// 预约: bookingId -> bookingObject
const bookings = {};

// 排队队列
const queue = [];

// 并发用户数（近似值）
let concurrentUsers = Math.floor(Math.random() * 3000) + 2000;

// 景点配置
const SPOTS = {
  gugong: { name: '紫禁城博物院', alias: '东洋秘境', maxDaily: 80000, closedDays: [1] },
  changcheng: { name: '八达岭长城', alias: '东洋长城', maxDaily: 65000, closedDays: [] },
  yuanmingyuan: { name: '颐和园', alias: '东洋园林', maxDaily: 60000, closedDays: [1] },
  tiantan: { name: '天坛公园', alias: '东洋祭坛', maxDaily: 40000, closedDays: [1] },
  badaling: { name: '圆明园遗址公园', alias: '东洋遗址', maxDaily: 50000, closedDays: [1] }
};

// 放票时间（服务器启动后1分钟）
const RELEASE_DELAY = 60000;
let releaseTime = Date.now() + RELEASE_DELAY;

function getReleaseTime() {
  return releaseTime;
}

function getCountdown() {
  return Math.max(0, Math.floor((releaseTime - Date.now()) / 1000));
}

// 初始化库存
function initInventory(spotId, date) {
  if (!inventory[spotId]) inventory[spotId] = {};
  if (!inventory[spotId][date]) {
    const spot = SPOTS[spotId];
    const capPerSlot = spot ? spot.maxDaily / 2 : 40000;
    // 放票时间未到：全部显示已售罄
    if (Date.now() < releaseTime) {
      inventory[spotId][date] = {
        morning: { total: capPerSlot, remaining: 0 },
        afternoon: { total: capPerSlot, remaining: 0 },
        _releaseInit: false
      };
    } else {
      // 随机预消耗 30%-80%
      const consumed = Math.floor(capPerSlot * (0.3 + Math.random() * 0.5));
      inventory[spotId][date] = {
        morning: { total: capPerSlot, remaining: capPerSlot - Math.floor(consumed * 0.6) },
        afternoon: { total: capPerSlot, remaining: capPerSlot - Math.floor(consumed * 0.4) },
        _releaseInit: true
      };
    }
  } else if (Date.now() >= releaseTime && inventory[spotId][date]._releaseInit === false) {
    // 放票前初始化过缓存 → 放票时间到了，重新初始化真实库存
    const spot = SPOTS[spotId];
    const capPerSlot = spot ? spot.maxDaily / 2 : 40000;
    const consumed = Math.floor(capPerSlot * (0.3 + Math.random() * 0.5));
    inventory[spotId][date] = {
      morning: { total: capPerSlot, remaining: capPerSlot - Math.floor(consumed * 0.6) },
      afternoon: { total: capPerSlot, remaining: capPerSlot - Math.floor(consumed * 0.4) },
      _releaseInit: true
    };
  }
  return inventory[spotId][date];
}

// 生成日期字符串
function getDateStr(date) {
  return date.toISOString().split('T')[0];
}

// 生成未来7天日期
function getNext7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(getDateStr(d));
  }
  return days;
}

// 生成验证码
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 生成预约ID
function generateBookingId() {
  return 'BK' + Date.now() + Math.floor(Math.random() * 1000);
}

// 更新并发数
function updateConcurrent() {
  concurrentUsers = Math.max(100, concurrentUsers + Math.floor(Math.random() * 200) - 100);
}

// 初始化并发数
updateConcurrent();
setInterval(updateConcurrent, 5000);

export { inventory, users, bookings, queue, concurrentUsers, SPOTS, initInventory, getDateStr, getNext7Days, generateCode, generateBookingId, getReleaseTime, getCountdown };
