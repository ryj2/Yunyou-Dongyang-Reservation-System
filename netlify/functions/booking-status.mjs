// ========================================
// GET /api/booking-status/:id
// ========================================

import { bookings } from './_shared/store.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // 从路径中提取 booking ID
    const pathParts = event.path.split('/');
    const bookingId = pathParts[pathParts.length - 1];

    if (!bookingId) {
      return resp(400, { error: '缺少预约ID' });
    }

    // 模拟延迟
    await delay(100 + Math.random() * 200);

    const booking = bookings[bookingId];
    if (!booking) {
      return resp(404, { error: '预约不存在' });
    }

    // 检查支付是否超时
    if (booking.status === 'pending_payment' && Date.now() > booking.paymentDeadline) {
      booking.status = 'expired';
    }

    return resp(200, { booking });
  } catch (err) {
    return resp(500, { error: '服务器错误' });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
