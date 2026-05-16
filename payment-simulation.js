// ========================================
// 支付模拟模块
// ========================================

// 支付方式配置
const paymentMethods = {
    wechat: { name: '微信支付', icon: 'fab fa-weixin', color: '#07C160' },
    alipay: { name: '支付宝', icon: 'fab fa-alipay', color: '#1677FF' },
    bank: { name: '银行卡', icon: 'fas fa-university', color: '#333' },
    dongyang: { name: '东洋币', icon: '🪙', color: '#d4af37' }
};

// 支付结果概率
const paymentResults = [
    { type: 'success', weight: 40 },
    { type: 'ticket_fail', weight: 20 },
    { type: 'timeout', weight: 15 },
    { type: 'balance', weight: 10 },
    { type: 'risk', weight: 10 },
    { type: 'system_error', weight: 5 }
];

function getPaymentResult() {
    const totalWeight = paymentResults.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;

    for (const result of paymentResults) {
        random -= result.weight;
        if (random <= 0) return result.type;
    }
    return 'success';
}
