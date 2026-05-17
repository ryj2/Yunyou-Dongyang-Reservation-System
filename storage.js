// ========================================
// 云游东洋 - localStorage 持久化层
// ========================================

const STORAGE_KEYS = {
  user: 'dongyang_user',
  bookings: 'dongyang_bookings',
  achievements: 'dongyang_achievements',
  queueState: 'dongyang_queue_state',
  paymentState: 'dongyang_payment_state'
};

const Storage = {
  // ========== 用户 ==========
  saveUser(phone) {
    const data = { phone, loginTime: Date.now() };
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data));
  },

  getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.user);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearUser() {
    localStorage.removeItem(STORAGE_KEYS.user);
  },

  // ========== 预约记录 ==========
  saveBooking(booking) {
    const bookings = this.getBookings();
    const idx = bookings.findIndex(b => b.id === booking.id);
    if (idx >= 0) {
      bookings[idx] = booking;
    } else {
      bookings.unshift(booking);
    }
    localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
  },

  getBookings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.bookings);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  cancelBooking(id) {
    const bookings = this.getBookings();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx >= 0) {
      bookings[idx].status = 'cancelled';
      localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
    }
  },

  // ========== 成就 ==========
  saveAchievements(achievementsObj) {
    const data = {};
    for (const [key, val] of Object.entries(achievementsObj)) {
      data[key] = { unlocked: val.unlocked, unlockedAt: val.unlockedAt || null };
    }
    localStorage.setItem(STORAGE_KEYS.achievements, JSON.stringify(data));
  },

  getAchievements() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.achievements);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // ========== 排队状态 ==========
  saveQueueState(state) {
    localStorage.setItem(STORAGE_KEYS.queueState, JSON.stringify({
      ...state,
      savedAt: Date.now()
    }));
  },

  getQueueState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.queueState);
      if (!raw) return null;
      const state = JSON.parse(raw);
      if (Date.now() - state.savedAt > 5 * 60 * 1000) {
        this.clearQueueState();
        return null;
      }
      return state;
    } catch {
      return null;
    }
  },

  clearQueueState() {
    localStorage.removeItem(STORAGE_KEYS.queueState);
  },

  // ========== 支付状态 ==========
  savePaymentState(state) {
    localStorage.setItem(STORAGE_KEYS.paymentState, JSON.stringify({
      ...state,
      savedAt: Date.now()
    }));
  },

  getPaymentState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.paymentState);
      if (!raw) return null;
      const state = JSON.parse(raw);
      if (Date.now() - state.savedAt > 15 * 60 * 1000) {
        this.clearPaymentState();
        return null;
      }
      return state;
    } catch {
      return null;
    }
  },

  clearPaymentState() {
    localStorage.removeItem(STORAGE_KEYS.paymentState);
  },

  // ========== 工具方法 ==========
  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};
