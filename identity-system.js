// ========================================
// 虚拟身份选择系统
// 用户无需输入真实身份信息
// ========================================

const fakeIdentities = [
    { name: '李逍遥', phone: '138****6789', id: '310101199001011234', emoji: '🧑‍💻', usage: 3 },
    { name: '赵灵儿', phone: '139****2345', id: '440301198805234567', emoji: '👩‍🎨', usage: 1 },
    { name: '张无忌', phone: '136****7890', id: '110101199203156789', emoji: '🧑‍🎤', usage: 7 },
    { name: '小龙女', phone: '137****3456', id: '500101199507081234', emoji: '👩‍🔬', usage: 2 },
    { name: '令狐冲', phone: '135****4567', id: '320102198812253456', emoji: '🧑‍🚀', usage: 5 },
    { name: '黄蓉', phone: '158****5678', id: '420101199309125678', emoji: '👩‍💼', usage: 0 },
    { name: '杨过', phone: '159****6789', id: '330101198706047890', emoji: '🧑‍🍳', usage: 12 },
    { name: '周芷若', phone: '186****7890', id: '120101199411239012', emoji: '👩‍🏫', usage: 1 },
    { name: '乔峰', phone: '187****8901', id: '610101198504151234', emoji: '🧑‍✈️', usage: 4 },
    { name: '段誉', phone: '188****9012', id: '530101199108273456', emoji: '🧑‍🎓', usage: 8 },
    { name: '王语嫣', phone: '133****0123', id: '350101199602145678', emoji: '👩‍⚕️', usage: 2 },
    { name: '虚竹', phone: '132****1234', id: '210101198910067890', emoji: '🧑‍🔧', usage: 6 },
    { name: '阿紫', phone: '155****2345', id: '150101199712289012', emoji: '👩‍🎤', usage: 0 },
    { name: '萧峰', phone: '156****3456', id: '230101198608191234', emoji: '🧑‍💼', usage: 3 },
    { name: '穆念慈', phone: '180****4567', id: '370101199305063456', emoji: '👩‍💻', usage: 1 },
    { name: '郭靖', phone: '181****5678', id: '430101199007285678', emoji: '🧑‍🚒', usage: 9 },
    { name: '任盈盈', phone: '182****6789', id: '510101199403157890', emoji: '👩‍🔬', usage: 2 },
    { name: '岳不群', phone: '150****7890', id: '340101198811079012', emoji: '🧑‍⚖️', usage: 15 },
    { name: '东方不败', phone: '151****8901', id: '450101199209291234', emoji: '👩‍🚒', usage: 4 },
    { name: '林平之', phone: '152****9012', id: '360101199501183456', emoji: '🧑‍🎨', usage: 1 },
    { name: '任我行', phone: '176****0123', id: '620101198704055678', emoji: '🧑‍🎤', usage: 20 },
    { name: '向问天', phone: '177****1234', id: '130101199108167890', emoji: '🧑‍🚀', usage: 3 },
    { name: '田伯光', phone: '178****2345', id: '220101198906279012', emoji: '🧑‍🍳', usage: 7 },
    { name: '不戒和尚', phone: '199****3456', id: '410101199402081234', emoji: '🧑‍🎓', usage: 11 },
    { name: '桃谷六仙', phone: '198****4567', id: '520101199607193456', emoji: '🧑‍🔧', usage: 0 },
    { name: '仪琳', phone: '166****5678', id: '140101199309305678', emoji: '👩‍⚕️', usage: 2 },
    { name: '劳德诺', phone: '167****6789', id: '180101198805117890', emoji: '🧑‍💼', usage: 5 },
    { name: '梁翁', phone: '168****7890', id: '190101199103229012', emoji: '🧑‍🏫', usage: 1 },
    { name: '风清扬', phone: '193****8901', id: '640101198608031234', emoji: '🧑‍✈️', usage: 0 },
    { name: '独孤求败', phone: '191****9012', id: '710101199012145678', emoji: '🧑‍🚒', usage: 25 }
];

let identitySelectorCallback = null;

function showIdentitySelector() {
    const container = document.getElementById('identity-cards');
    if (!container) return;

    container.innerHTML = '';

    // 随机打乱顺序
    const shuffled = [...fakeIdentities].sort(() => Math.random() - 0.5).slice(0, 10);

    shuffled.forEach((identity, index) => {
        const card = document.createElement('div');
        card.className = 'identity-card';
        if (selectedIdentity && selectedIdentity.name === identity.name) {
            card.classList.add('selected');
        }

        const usageText = identity.usage === 0
            ? '该身份证今日未被使用'
            : `该身份证今日已被使用 ${identity.usage} 次`;

        card.innerHTML = `
            <div class="identity-avatar">${identity.emoji}</div>
            <div class="identity-name">${identity.name}</div>
            <div class="identity-phone">手机：${identity.phone}</div>
            <div class="identity-id">证件：${identity.id}</div>
            <div class="identity-usage">${usageText}</div>
        `;

        card.onclick = () => {
            container.querySelectorAll('.identity-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedIdentity = identity;

            showMessage(`已选择身份：${identity.name}`, 'success');

            if (typeof updateBookingPage === 'function') {
                updateBookingPage();
            }
        };

        container.appendChild(card);
    });

    // 添加"自定义身份"提示卡片
    const customCard = document.createElement('div');
    customCard.className = 'identity-card';
    customCard.style.background = '#fff8e1';
    customCard.style.borderStyle = 'dashed';
    customCard.innerHTML = `
        <div class="identity-avatar">✏️</div>
        <div class="identity-name" style="color:var(--wechat-text-secondary);">自定义身份</div>
        <div class="identity-phone" style="font-size:11px;">系统不推荐</div>
    `;
    customCard.onclick = () => {
        showMessage('系统检测到自定义身份风险，请使用系统分配的身份', 'error');
    };
    container.appendChild(customCard);
}
