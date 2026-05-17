// ========================================
// POST /api/next-round
// 进入下一轮放票
// ========================================

import { nextReleaseRound, getReleaseTime, getCountdown } from './_shared/store.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const newReleaseTime = nextReleaseRound();

    return resp(200, {
      success: true,
      releaseTime: newReleaseTime,
      countdown: getCountdown()
    });
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
