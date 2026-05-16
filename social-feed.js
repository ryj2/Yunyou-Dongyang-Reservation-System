// ========================================
// 社交动态流模块
// 模拟其他用户的预约动态
// ========================================

const feedAvatars = ['🧑', '👩', '👨', '👴', '👵', '🧒', '🧑‍💻', '👩‍🎨', '👨‍🍳', '🧑‍🚀'];
const feedLastNames = ['张', '李', '王', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡'];
const feedFirstNames = ['明', '华', '花', '强', '伟', '芳', '娜', '磊', '洋', '勇', '艳', '杰', '丽', '军', '超'];

const feedTemplates = [
    (name) => `${name} 刚刚预约成功`,
    (name) => `${name} 排队中...前方还有${Math.floor(Math.random()*3000+500)}人`,
    (name) => `${name} 抽签未中签，正在哭泣...`,
    (name) => `${name} 验证码连续失败5次`,
    (name) => `${name} 支付成功但出票失败`,
    (name) => `${name} 被系统检测到异常操作`,
    (name) => `${name} 退出排队，明天再来`,
    (name) => `${name} 正在阅读第100页用户协议`,
    (name) => `${name} 和AI客服吵起来了`,
    (name) => `${name} 已放弃预约，选择宅家`
];

const systemAnnouncements = [
    '📢 系统升级完成，现在更慢了',
    '📢 黄牛团伙已被抓获（假的）',
    '📢 新增更多验证码类型',
    '📢 服务器扩容：从1台变成2台',
    '📢 系统维护公告：维护后更卡',
    '📢 公告：排队系统已优化（并没有）'
];

let feedInterval = null;

function generateRandomName() {
    const last = feedLastNames[Math.floor(Math.random() * feedLastNames.length)];
    const first = feedFirstNames[Math.floor(Math.random() * feedFirstNames.length)];
    return last + '*' + first;
}

function generateFeedItem() {
    const isAnnouncement = Math.random() < 0.15;

    if (isAnnouncement) {
        return {
            type: 'announcement',
            text: systemAnnouncements[Math.floor(Math.random() * systemAnnouncements.length)],
            avatar: '📢'
        };
    }

    const name = generateRandomName();
    const template = feedTemplates[Math.floor(Math.random() * feedTemplates.length)];
    const avatar = feedAvatars[Math.floor(Math.random() * feedAvatars.length)];

    return {
        type: 'normal',
        text: template(name),
        avatar
    };
}

function addFeedItem() {
    const feedList = document.getElementById('feed-list');
    if (!feedList) return;

    const item = generateFeedItem();
    const div = document.createElement('div');
    div.className = `feed-item ${item.type === 'announcement' ? 'announcement' : ''}`;
    div.innerHTML = `
        <span class="feed-avatar">${item.avatar}</span>
        <span class="feed-text">${item.text}</span>
    `;

    // 插入到顶部
    feedList.insertBefore(div, feedList.firstChild);

    // 限制最多15条
    while (feedList.children.length > 15) {
        feedList.removeChild(feedList.lastChild);
    }
}

function startSocialFeed() {
    const feedList = document.getElementById('feed-list');
    if (!feedList) return;

    feedList.innerHTML = '';

    // 初始填充5条
    for (let i = 0; i < 5; i++) {
        addFeedItem();
    }

    // 每2-4秒新增一条
    if (feedInterval) clearInterval(feedInterval);
    feedInterval = setInterval(() => {
        addFeedItem();
    }, 2000 + Math.random() * 2000);
}

function stopSocialFeed() {
    if (feedInterval) {
        clearInterval(feedInterval);
        feedInterval = null;
    }
}
