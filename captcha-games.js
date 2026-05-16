// ========================================
// 验证码小游戏模块
// 替代传统验证码，增加趣味性
// ========================================

// 游戏类型
const CAPTCHA_TYPES = ['mole', 'emoji', 'poetry', 'puzzle'];

// 古诗词库
const poetryPairs = [
    { q: '床前明月光', a: '疑是地上霜', opts: ['疑是地上霜', '举头望明月', '低头思故乡', '春风又绿江南岸'] },
    { q: '春眠不觉晓', a: '处处闻啼鸟', opts: ['处处闻啼鸟', '夜来风雨声', '花落知多少', '春去花还在'] },
    { q: '白日依山尽', a: '黄河入海流', opts: ['黄河入海流', '欲穷千里目', '更上一层楼', '遥知兄弟登高处'] },
    { q: '锄禾日当午', a: '汗滴禾下土', opts: ['汗滴禾下土', '谁知盘中餐', '粒粒皆辛苦', '春种一粒粟'] },
    { q: '离离原上草', a: '一岁一枯荣', opts: ['一岁一枯荣', '野火烧不尽', '春风吹又生', '远芳侵古道'] },
    { q: '空山新雨后', a: '天气晚来秋', opts: ['天气晚来秋', '明月松间照', '清泉石上流', '竹喧归浣女'] },
    { q: '红豆生南国', a: '春来发几枝', opts: ['春来发几枝', '愿君多采撷', '此物最相思', '相思故人来'] },
    { q: '千山鸟飞绝', a: '万径人踪灭', opts: ['万径人踪灭', '孤舟蓑笠翁', '独钓寒江雪', '独坐幽篁里'] },
    { q: '松下问童子', a: '言师采药去', opts: ['言师采药去', '只在此山中', '云深不知处', '返景入深林'] },
    { q: '月落乌啼霜满天', a: '江枫渔火对愁眠', opts: ['江枫渔火对愁眠', '姑苏城外寒山寺', '夜半钟声到客船', '两岸猿声啼不住'] }
];

// 汉字池（打地鼠用）
const chineseChars = '天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏';

function showCaptchaGame() {
    const area = document.getElementById('captcha-area');
    if (!area) return;

    area.style.display = 'block';

    const type = CAPTCHA_TYPES[Math.floor(Math.random() * CAPTCHA_TYPES.length)];

    switch (type) {
        case 'mole': renderMoleGame(area); break;
        case 'emoji': renderEmojiGame(area); break;
        case 'poetry': renderPoetryGame(area); break;
        case 'puzzle': renderPuzzleGame(area); break;
    }
}

// ========================================
// 打地鼠验证码
// ========================================
function renderMoleGame(container) {
    // 随机选一个目标字
    const targetChar = chineseChars[Math.floor(Math.random() * chineseChars.length)];

    container.innerHTML = `
        <div class="captcha-title">人机验证 - 打地鼠</div>
        <div class="captcha-hint">请点击出现的汉字：<strong>${targetChar}</strong></div>
        <div class="mole-grid" id="mole-grid"></div>
    `;

    const grid = document.getElementById('mole-grid');
    let moleTimer;
    let hitCount = 0;
    const requiredHits = 3;

    function spawnMole() {
        // 清除之前的target
        grid.querySelectorAll('.mole-cell').forEach(c => {
            c.classList.remove('target', 'hit', 'wrong');
            c.textContent = '';
        });

        // 随机选一个格子显示目标字
        const cells = grid.querySelectorAll('.mole-cell');
        const randomIndex = Math.floor(Math.random() * 9);
        const cell = cells[randomIndex];

        cell.textContent = targetChar;
        cell.classList.add('target');

        // 2秒后消失
        moleTimer = setTimeout(() => {
            cell.classList.remove('target');
            cell.textContent = '';

            if (hitCount < requiredHits) {
                setTimeout(spawnMole, 300);
            }
        }, 2000);
    }

    // 初始化9宫格
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'mole-cell';
        cell.onclick = () => {
            if (cell.classList.contains('target')) {
                // 正确
                clearTimeout(moleTimer);
                cell.classList.remove('target');
                cell.classList.add('hit');
                hitCount++;

                if (hitCount >= requiredHits) {
                    container.innerHTML = `
                        <div class="captcha-title" style="color:var(--wechat-green);">✓ 验证通过</div>
                    `;
                    // 继续发送验证码
                    if (typeof doSendCode === 'function') {
                        setTimeout(doSendCode, 500);
                    }
                } else {
                    setTimeout(spawnMole, 500);
                }
            } else {
                // 错误
                cell.classList.add('wrong');
                setTimeout(() => cell.classList.remove('wrong'), 300);
            }
        };
        grid.appendChild(cell);
    }

    // 开始游戏
    setTimeout(spawnMole, 500);
}

// ========================================
// 表情包验证码
// ========================================
function renderEmojiGame(container) {
    const challenges = [
        { prompt: '请选择最开心的表情', target: '😄', emojis: ['😢', '😡', '😄', '😴', '🤔', '😎'] },
        { prompt: '请选择最生气的表情', target: '😡', emojis: ['😊', '😡', '😢', '🤣', '😴', '🥳'] },
        { prompt: '请选择睡觉的表情', target: '😴', emojis: ['😊', '😴', '😡', '😄', '🤩', '😢'] },
        { prompt: '请选择哭泣的表情', target: '😢', emojis: ['😢', '😊', '😡', '🤣', '😎', '🥳'] },
        { prompt: '请选择惊讶的表情', target: '😲', emojis: ['😊', '😲', '😴', '😡', '😢', '🤔'] },
        { prompt: '请选择思考的表情', target: '🤔', emojis: ['😎', '🤔', '😢', '😄', '😡', '🥳'] },
        { prompt: '请选择戴墨镜的表情', target: '😎', emojis: ['😊', '😎', '😴', '😢', '😡', '🤣'] },
        { prompt: '请选择庆祝的表情', target: '🥳', emojis: ['😢', '🥳', '😴', '😡', '😊', '🤔'] }
    ];

    const challenge = challenges[Math.floor(Math.random() * challenges.length)];

    // 打乱顺序
    const shuffled = [...challenge.emojis].sort(() => Math.random() - 0.5);

    container.innerHTML = `
        <div class="captcha-title">人机验证 - 表情选择</div>
        <div class="captcha-hint">${challenge.prompt}</div>
        <div class="emoji-grid" id="emoji-grid"></div>
    `;

    const grid = document.getElementById('emoji-grid');
    shuffled.forEach(emoji => {
        const cell = document.createElement('div');
        cell.className = 'emoji-cell';
        cell.textContent = emoji;
        cell.onclick = () => {
            if (emoji === challenge.target) {
                cell.classList.add('correct');
                container.innerHTML = `
                    <div class="captcha-title" style="color:var(--wechat-green);">✓ 验证通过</div>
                `;
                if (typeof doSendCode === 'function') {
                    setTimeout(doSendCode, 500);
                }
            } else {
                cell.classList.add('wrong');
                setTimeout(() => cell.classList.remove('wrong'), 500);
            }
        };
        grid.appendChild(cell);
    });
}

// ========================================
// 古诗词验证码
// ========================================
function renderPoetryGame(container) {
    const pair = poetryPairs[Math.floor(Math.random() * poetryPairs.length)];

    // 打乱选项
    const shuffled = [...pair.opts].sort(() => Math.random() - 0.5);

    container.innerHTML = `
        <div class="captcha-title">人机验证 - 古诗词</div>
        <div class="captcha-hint">请选择正确的下句</div>
        <div class="poetry-question">${pair.q}，______</div>
        <div class="poetry-options" id="poetry-options"></div>
    `;

    const optionsEl = document.getElementById('poetry-options');
    shuffled.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'poetry-option';
        btn.textContent = opt;
        btn.onclick = () => {
            if (opt === pair.a) {
                btn.classList.add('correct');
                container.innerHTML = `
                    <div class="captcha-title" style="color:var(--wechat-green);">✓ 验证通过</div>
                `;
                if (typeof doSendCode === 'function') {
                    setTimeout(doSendCode, 500);
                }
            } else {
                btn.classList.add('wrong');
                setTimeout(() => btn.classList.remove('wrong'), 500);
            }
        };
        optionsEl.appendChild(btn);
    });
}

// ========================================
// 拼图验证码
// ========================================
function renderPuzzleGame(container) {
    const pieces = ['🌸', '🎯', '🎪'];
    const targetPiece = pieces[Math.floor(Math.random() * pieces.length)];

    // 随机目标位置
    const targetX = Math.floor(Math.random() * 200) + 50;
    const targetY = Math.floor(Math.random() * 80) + 30;

    // 打乱拼图块初始位置
    const startX = Math.floor(Math.random() * 100) + 10;
    const startY = Math.floor(Math.random() * 60) + 80;

    container.innerHTML = `
        <div class="captcha-title">人机验证 - 拖拽拼图</div>
        <div class="captcha-hint">将 ${targetPiece} 拖到正确位置</div>
        <div class="puzzle-container" id="puzzle-container">
            <div class="puzzle-target" style="left:${targetX}px;top:${targetY}px;"></div>
            <div class="puzzle-piece" id="puzzle-piece" style="left:${startX}px;top:${startY}px;">${targetPiece}</div>
        </div>
    `;

    const piece = document.getElementById('puzzle-piece');
    const puzzleContainer = document.getElementById('puzzle-container');
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    piece.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - piece.offsetLeft;
        offsetY = e.clientY - piece.offsetTop;
        piece.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        piece.style.left = x + 'px';
        piece.style.top = y + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        piece.style.cursor = 'grab';

        const pieceX = parseInt(piece.style.left);
        const pieceY = parseInt(piece.style.top);

        // 检查是否在目标位置附近
        if (Math.abs(pieceX - targetX) < 30 && Math.abs(pieceY - targetY) < 30) {
            piece.style.left = targetX + 'px';
            piece.style.top = targetY + 'px';
            piece.style.border = '2px solid var(--wechat-green)';

            container.innerHTML = `
                <div class="captcha-title" style="color:var(--wechat-green);">✓ 验证通过</div>
            `;
            if (typeof doSendCode === 'function') {
                setTimeout(doSendCode, 500);
            }
        }
    });
}
