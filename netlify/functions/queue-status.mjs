// ========================================
// GET /api/queue-status?phone=xxx
// ========================================

import { queue } from './_shared/store.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const params = new URLSearchParams(event.queryStringParameters || {});
    const phone = params.get('phone');

    if (!phone) {
      return resp(400, { error: '缺少手机号' });
    }

    // 模拟延迟
    await delay(100 + Math.random() * 300);

    // 查找排队记录
    const idx = queue.findIndex(q => q.phone === phone);
    if (idx === -1) {
      return resp(200, { position: 0, completed: true });
    }

    const entry = queue[idx];
    const elapsed = Date.now() - entry.timestamp;

    // 基于时间计算位置递减
    // 每秒减少约1-3人
    const decrease = Math.floor(elapsed / 1000 * (1 + Math.random() * 2));
    const position = Math.max(0, idx * 100 + 50 - decrease);

    // 超时检查（5分钟）
    if (elapsed > 5 * 60 * 1000) {
      queue.splice(idx, 1);
      return resp(200, { position: 0, timeout: true });
    }

    // 排队完成
    if (position <= 0) {
      queue.splice(idx, 1);
      return resp(200, { position: 0, completed: true });
    }

    return resp(200, {
      position,
      estimatedWait: `约${Math.ceil(position / 100)}分钟`,
      completed: false,
      timeout: false
    });
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
