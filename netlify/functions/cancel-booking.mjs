// ========================================
// POST /api/cancel-booking/:id
// ========================================

import { bookings, inventory, SPOTS } from './_shared/store.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const pathParts = event.path.split('/');
    const bookingId = pathParts[pathParts.length - 1];
    const { phone } = JSON.parse(event.body || '{}');

    if (!bookingId) {
      return resp(400, { error: '缺少预约ID' });
    }

    // 模拟延迟
    await delay(200 + Math.random() * 300);

    const booking = bookings[bookingId];
    if (!booking) {
      return resp(404, { error: '预约不存在' });
    }

    if (booking.phone !== phone) {
      return resp(403, { error: '无权操作此预约' });
    }

    // 如果是待支付状态，恢复库存（先检查再修改状态）
    if (booking.status === 'pending_payment') {
      const inv = inventory[booking.spotId]?.[booking.date]?.[booking.timeSlot];
      if (inv) {
        const totalTickets = (booking.tickets.adult || 0) + (booking.tickets.child || 0) + (booking.tickets.senior || 0);
        inv.remaining += totalTickets;
      }
    }

    // 取消预约
    booking.status = 'cancelled';

    return resp(200, { success: true, booking });
  } catch (err) {
    return resp(500, { error: '服务器错误' });
  }
};

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
