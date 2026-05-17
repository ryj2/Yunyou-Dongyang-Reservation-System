// ========================================
// 云游东洋 - 景点配置数据
// 参考北京热门景点真实预约规则
// ========================================

const SCENIC_SPOTS = {
  gugong: {
    id: 'gugong',
    name: '紫禁城博物院',
    alias: '东洋秘境',
    description: '明清两代皇家宫殿，世界文化遗产',
    emoji: '🏯',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    ticketPrices: { adult: 60, child: 30, senior: 30 },
    timeSlots: [
      { id: 'morning', label: '上午场', time: '08:30-12:00' },
      { id: 'afternoon', label: '下午场', time: '13:00-17:00' }
    ],
    maxDailyCapacity: 80000,
    advanceBookingDays: 7,
    closedDays: [1],
    rules: [
      '须提前1-7天预约',
      '每人每日限预约1次',
      '周一闭馆（法定节假日除外）',
      '旺季(4-10月)限流8万人/日',
      '分上午场(8:30-12:00)和下午场(13:00-17:00)',
      '需凭有效身份证件入场'
    ]
  },
  changcheng: {
    id: 'changcheng',
    name: '八达岭长城',
    alias: '东洋长城',
    description: '万里长城著名关口，世界文化遗产',
    emoji: '🏔️',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    ticketPrices: { adult: 40, child: 20, senior: 0 },
    timeSlots: [
      { id: 'morning', label: '上午场', time: '07:30-12:00' },
      { id: 'afternoon', label: '下午场', time: '12:00-16:30' }
    ],
    maxDailyCapacity: 65000,
    advanceBookingDays: 7,
    closedDays: [],
    rules: [
      '须提前预约，现场不售票',
      '每人每日限预约1次',
      '旺季限流6.5万人/日',
      '分上午场和下午场',
      '60周岁以上老人凭身份证免费'
    ]
  },
  yuanmingyuan: {
    id: 'yuanmingyuan',
    name: '颐和园',
    alias: '东洋园林',
    description: '皇家园林博物馆，世界文化遗产',
    emoji: '🏛️',
    gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
    ticketPrices: { adult: 30, child: 15, senior: 15 },
    timeSlots: [
      { id: 'morning', label: '上午场', time: '06:30-12:00' },
      { id: 'afternoon', label: '下午场', time: '12:00-18:00' }
    ],
    maxDailyCapacity: 60000,
    advanceBookingDays: 7,
    closedDays: [1],
    rules: [
      '须提前1-7天预约',
      '周一闭馆（法定节假日除外）',
      '旺季限流6万人/日',
      '联票包含苏州街、佛香阁等'
    ]
  },
  tiantan: {
    id: 'tiantan',
    name: '天坛公园',
    alias: '东洋祭坛',
    description: '明清两代皇帝祭天圣地，世界文化遗产',
    emoji: '⛩️',
    gradient: 'linear-gradient(135deg, #fa709a, #fee140)',
    ticketPrices: { adult: 15, child: 8, senior: 8 },
    timeSlots: [
      { id: 'morning', label: '上午场', time: '06:00-12:00' },
      { id: 'afternoon', label: '下午场', time: '12:00-21:00' }
    ],
    maxDailyCapacity: 40000,
    advanceBookingDays: 7,
    closedDays: [1],
    rules: [
      '须提前预约',
      '周一闭馆（法定节假日除外）',
      '联票含祈年殿、回音壁等',
      '公园门票与联票分开预约'
    ]
  },
  badaling: {
    id: 'badaling',
    name: '圆明园遗址公园',
    alias: '东洋遗址',
    description: '清代皇家园林遗址，爱国主义教育基地',
    emoji: '🏛️',
    gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    ticketPrices: { adult: 10, child: 5, senior: 5 },
    timeSlots: [
      { id: 'morning', label: '上午场', time: '07:00-12:00' },
      { id: 'afternoon', label: '下午场', time: '12:00-19:30' }
    ],
    maxDailyCapacity: 50000,
    advanceBookingDays: 7,
    closedDays: [1],
    rules: [
      '须提前预约',
      '周一闭馆（法定节假日除外）',
      '遗址区需另购西洋楼遗址票',
      '园区内禁止使用无人机'
    ]
  }
};
