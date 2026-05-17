// ========================================
// POST /api/login
// ========================================

import { users, generateCode } from './_shared/store.mjs';

export const handler = async (event) => {
  // CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { phone, code, action } = JSON.parse(event.body || '{}');

    if (!phone) {
      return resp(400, { success: false, error: '请选择手机号' });
    }

    // 模拟网络延迟
    await delay(300 + Math.random() * 500);

    if (action === 'request_code') {
      // 发送验证码
      const verificationCode = generateCode();
      users[phone] = {
        phone,
        createdAt: Date.now(),
        verificationCode,
        codeExpiry: Date.now() + 5 * 60 * 1000,
        codeAttempts: 0
      };

      // 20%概率发送失败
      if (Math.random() < 0.2) {
        return resp(200, { success: false, error: '验证码发送失败，请重试' });
      }

      // 演示模式：返回验证码
      return resp(200, { success: true, code: verificationCode });
    }

    if (action === 'verify') {
      // 验证登录
      const user = users[phone];
      if (!user) {
        return resp(200, { success: false, error: '请先获取验证码' });
      }

      // 检查验证码过期
      if (Date.now() > user.codeExpiry) {
        return resp(200, { success: false, error: '验证码已过期，请重新获取' });
      }

      // 检查尝试次数
      if (user.codeAttempts >= 3) {
        return resp(200, { success: false, error: '尝试次数过多，请稍后再试' });
      }

      user.codeAttempts++;

      // 验证码：硬编码888888，或任意6位码85%概率通过
      const validCode = code === '888888' || (code.length === 6 && Math.random() < 0.85);

      if (!validCode) {
        // 15%概率验证码错误
        return resp(200, { success: false, error: '验证码错误' });
      }

      // 登录成功
      delete users[phone].verificationCode;
      return resp(200, { success: true, user: { phone } });
    }

    return resp(400, { success: false, error: '无效的操作' });
  } catch (err) {
    return resp(500, { success: false, error: '系统繁忙，请稍后重试' });
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
