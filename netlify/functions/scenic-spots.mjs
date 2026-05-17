// ========================================
// GET /api/scenic-spots?date=YYYY-MM-DD
// ========================================

import { SPOTS, initInventory, getNext7Days, concurrentUsers } from './_shared/store.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const params = new URLSearchParams(event.queryStringParameters || {});
    let date = params.get('date');

    // 如果没有指定日期，默认明天
    if (!date) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
    }

    // 模拟网络延迟
    await delay(200 + Math.random() * 400);

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));

    const spots = Object.entries(SPOTS).map(([id, config]) => {
      const isClosed = config.closedDays.includes(dayOfWeek);
      const isTooFar = daysDiff > 7 || daysDiff < 0;
      const inv = isClosed || isTooFar ? null : initInventory(id, date);

      // 故意隐藏10-20%有余票的时段（讽刺元素）
      const slots = ['morning', 'afternoon'].map(slot => {
        const slotData = inv ? inv[slot] : { total: 0, remaining: 0 };
        let remaining = slotData.remaining;
        let displayStatus = 'available';

        if (isClosed || isTooFar) {
          remaining = 0;
          displayStatus = 'closed';
        } else if (remaining <= 0) {
          displayStatus = 'sold_out';
        } else {
          // 10-20%概率显示售罄（即使还有票）
          if (remaining > 0 && remaining < slotData.total * 0.3 && Math.random() < 0.15) {
            displayStatus = 'sold_out';
            // 但不真正扣减库存
          } else if (remaining < slotData.total * 0.05) {
            displayStatus = 'scarce';
          } else if (remaining < slotData.total * 0.2) {
            displayStatus = 'warn';
          }
        }

        return {
          time: slot,
          label: slot === 'morning' ? '上午场' : '下午场',
          timeRange: slot === 'morning' ? '08:30-12:00' : '13:00-17:00',
          remaining,
          total: slotData ? slotData.total : 0,
          displayStatus
        };
      });

      // 随机并发浏览人数
      const viewers = Math.floor(Math.random() * 5000) + 2000;

      return {
        id,
        name: config.name,
        alias: config.alias,
        date,
        slots,
        isClosed,
        isTooFar,
        advanceBooking: true,
        concurrentViewers: viewers
      };
    });

    return resp(200, { spots, serverTime: new Date().toISOString() });
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
