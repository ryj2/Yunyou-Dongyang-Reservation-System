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
let releaseRound = 0;

function getReleaseTime() {
  return releaseTime;
}

function getCountdown() {
  return Math.max(0, Math.floor((releaseTime - Date.now()) / 1000));
}

function nextReleaseRound() {
  releaseRound++;
  releaseTime = Date.now() + RELEASE_DELAY;
  return releaseTime;
}

// 初始化库存
function initInventory(spotId, date) {
  if (!inventory[spotId]) inventory[spotId] = {};
  const spot = SPOTS[spotId];
  const capPerSlot = spot ? spot.maxDaily / 2 : 40000;

  const cached = inventory[spotId][date];

  // 新轮次或首次：根据当前放票状态初始化
  if (!cached || cached._round !== releaseRound) {
    if (Date.now() < releaseTime) {
      inventory[spotId][date] = {
        morning: { total: capPerSlot, remaining: 0 },
        afternoon: { total: capPerSlot, remaining: 0 },
        _releaseInit: false,
        _round: releaseRound
      };
    } else {
      const consumed = Math.floor(capPerSlot * (0.3 + Math.random() * 0.5));
      inventory[spotId][date] = {
        morning: { total: capPerSlot, remaining: capPerSlot - Math.floor(consumed * 0.6) },
        afternoon: { total: capPerSlot, remaining: capPerSlot - Math.floor(consumed * 0.4) },
        _releaseInit: true,
        _round: releaseRound
      };
    }
    return inventory[spotId][date];
  }

  // 同一轮次：放票前初始化的缓存 → 放票时间到了，更新为真实库存
  if (Date.now() >= releaseTime && cached._releaseInit === false) {
    const consumed = Math.floor(capPerSlot * (0.3 + Math.random() * 0.5));
    inventory[spotId][date] = {
      morning: { total: capPerSlot, remaining: capPerSlot - Math.floor(consumed * 0.6) },
      afternoon: { total: capPerSlot, remaining: capPerSlot - Math.floor(consumed * 0.4) },
      _releaseInit: true,
      _round: releaseRound
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

export { inventory, users, bookings, queue, concurrentUsers, SPOTS, initInventory, getDateStr, getNext7Days, generateCode, generateBookingId, getReleaseTime, getCountdown, nextReleaseRound };
