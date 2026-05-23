// ========================================
// POST /api/create-booking
// ========================================

import { SPOTS, initInventory, bookings, queue, concurrentUsers, generateBookingId, generateQueueId } from './_shared/store.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // 处理支付确认
    if (body.action === 'confirm_payment') {
      return handlePaymentConfirm(body);
    }

    const { phone, spotId, date, timeSlot, tickets, visitorName, visitorId } = body;

    // 验证必填字段
    if (!phone || !spotId || !date || !timeSlot) {
      return resp(200, { success: false, error: '请填写完整信息' });
    }

    // 验证景点
    if (!SPOTS[spotId]) {
      return resp(200, { success: false, error: '景点不存在' });
    }

    // 验证日期
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    if (SPOTS[spotId].closedDays.includes(dayOfWeek)) {
      return resp(200, { success: false, error: '该日期景区闭馆' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));
    if (daysDiff < 0 || daysDiff > 7) {
      return resp(200, { success: false, error: '请选择有效日期（提前1-7天）' });
    }

    // 验证身份证（18位）
    if (visitorId && !validateIdCard(visitorId)) {
      return resp(200, { success: false, error: '身份证号格式不正确' });
    }

    // 模拟网络延迟
    await delay(500 + Math.random() * 1000);

    // 检查库存
    const inv = initInventory(spotId, date);
    const slotData = inv[timeSlot];
    if (!slotData || slotData.remaining <= 0) {
      return resp(200, { success: false, error: '该时段已售罄' });
    }

    // 计算总票数
    const totalTickets = (tickets.adult || 0) + (tickets.child || 0) + (tickets.senior || 0);
    if (totalTickets <= 0) {
      return resp(200, { success: false, error: '请选择票种' });
    }

    // 检查库存是否足够
    if (slotData.remaining < totalTickets) {
      return resp(200, { success: false, error: '库存不足，请减少票数或选择其他时段' });
    }

    // 25%概率返回"系统繁忙"
    if (Math.random() < 0.25) {
      return resp(200, { success: false, error: '系统繁忙，请稍后重试' });
    }

    // 如果库存<1000，触发抽签（5%中签率）
    if (slotData.remaining < 1000) {
      const participants = Math.floor(Math.random() * 20000) + 10000;
      const winners = 50;
      const won = Math.random() < 0.05;

      if (!won) {
        return resp(200, {
          success: false,
          lottery: true,
          participants,
          winners,
          yourNumber: Math.floor(Math.random() * participants) + 1,
          result: 'lost'
        });
      }
    }

    // 如果并发用户>3000，进入排队
    if (concurrentUsers > 3000) {
      const queueId = generateQueueId();
      const position = queue.length + Math.floor(Math.random() * 500) + 100;
      queue.push({ id: queueId, phone, spotId, date, timeSlot, timestamp: Date.now() });
      return resp(200, {
        success: false,
        inQueue: true,
        queueId,
        queuePosition: position,
        estimatedWait: `约${Math.ceil(position / 100)}分钟`
      });
    }

    // 扣减库存
    slotData.remaining -= totalTickets;

    // 创建预约
    const bookingId = generateBookingId();
    const totalAmount = (tickets.adult || 0) * (SPOTS[spotId].name === '紫禁城博物院' ? 60 : 40) +
                        (tickets.child || 0) * 30 +
                        (tickets.senior || 0) * 30;

    const booking = {
      id: bookingId,
      phone,
      spotId,
      spotName: SPOTS[spotId].name,
      date,
      timeSlot,
      tickets: { ...tickets },
      totalAmount,
      visitorName: visitorName || '游客',
      visitorId: visitorId || '',
      status: 'pending_payment',
      createdAt: Date.now(),
      paymentDeadline: Date.now() + 15 * 60 * 1000
    };

    bookings[bookingId] = booking;

    return resp(200, {
      success: true,
      bookingId,
      booking,
      remainingTickets: slotData.remaining
    });
  } catch (err) {
    return resp(500, { success: false, error: '服务器错误' });
  }
};

function handlePaymentConfirm(body) {
  const { bookingId, paymentMethod } = body;
  const booking = bookings[bookingId];

  if (!booking) {
    return resp(200, { success: false, error: '订单不存在' });
  }

  if (Date.now() > booking.paymentDeadline) {
    booking.status = 'expired';
    return resp(200, { success: false, error: '支付超时，订单已取消' });
  }

  // 模拟支付延迟
  const result = Math.random();

  if (result < 0.2) {
    // 支付成功但出票失败
    booking.status = 'failed';
    return resp(200, { success: false, error: '支付成功但出票失败', type: 'payment_fail' });
  }

  if (result < 0.35) {
    // 银行风控
    if (paymentMethod === 'dongyang') {
      return resp(200, { success: false, error: '东洋币余额不足', type: 'payment_block' });
    }
    return resp(200, { success: false, error: '银行风控拦截', type: 'payment_block' });
  }

  // 支付成功
  booking.status = 'confirmed';
  return resp(200, { success: true, booking });
}

// 18位身份证校验（GB 11643-1999）
function validateIdCard(id) {
  if (!id || id.length !== 18) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkChars = '10X98765432';
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    if (isNaN(parseInt(id[i]))) return false;
    sum += parseInt(id[i]) * weights[i];
  }
  return checkChars[sum % 11] === id[17].toUpperCase();
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

function resp(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    body: JSON.stringify(body)
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
