// ========================================
// 云游东洋 - Netlify Functions HTTP 客户端
// ========================================

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8888'
  : '';

const API = {
  async request(method, endpoint, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}/api${endpoint}`, opts);
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, error: '网络连接失败，请检查网络' };
    }
  },

  // 登录：发送验证码
  async requestCode(phone) {
    return this.request('POST', '/login', { phone, action: 'request_code' });
  },

  // 登录：验证
  async login(phone, code) {
    return this.request('POST', '/login', { phone, code, action: 'verify' });
  },

  // 获取景点列表
  async getScenicSpots(date) {
    const params = date ? `?date=${date}` : '';
    return this.request('GET', `/scenic-spots${params}`);
  },

  // 创建预约
  async createBooking(data) {
    return this.request('POST', '/create-booking', data);
  },

  // 查询预约状态
  async getBookingStatus(bookingId) {
    return this.request('GET', `/booking-status/${bookingId}`);
  },

  // 取消预约
  async cancelBooking(bookingId, phone) {
    return this.request('POST', `/cancel-booking/${bookingId}`, { phone });
  },

  // 查询排队状态
  async getQueueStatus(phone) {
    return this.request('GET', `/queue-status?phone=${encodeURIComponent(phone)}`);
  },

  // 确认支付
  async confirmPayment(bookingId, paymentMethod) {
    return this.request('POST', `/create-booking`, {
      action: 'confirm_payment',
      bookingId,
      paymentMethod
    });
  }
};
