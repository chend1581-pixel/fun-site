/* ============ 公共工具 ============ */
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr, n) {
  const copy = arr.slice();
  const out = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

// Toast 轻提示
let toastTimer = null;
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

// 复制文本
function copyText(text) {
  const done = () => showToast('已复制，去发给朋友笑一笑 😄');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { showToast('复制失败，手动复制吧'); }
  document.body.removeChild(ta);
}

// 高亮当前 tab
function highlightTab() {
  const id = document.body.id;
  const map = { 'page-home': 0, 'page-jokes': 1, 'page-memes': 2, 'page-generator': 3 };
  const links = document.querySelectorAll('.tabbar a');
  if (map[id] !== undefined) links[map[id]].classList.add('active');
}

/* ============ 首页：今日整活 ============ */
function initHome() {
  let current = -1;
  const textEl = document.getElementById('jokeText');
  const pillEl = document.getElementById('jokeCat');

  function showRandom() {
    let i;
    do { i = randInt(0, JOKES.length - 1); } while (i === current && JOKES.length > 1);
    current = i;
    const j = JOKES[i];
    textEl.textContent = j.text;
    pillEl.textContent = j.cat;
    pillEl.className = 'cat-pill cat-' + j.cat;
  }

  document.getElementById('nextBtn').addEventListener('click', showRandom);
  document.getElementById('copyBtn').addEventListener('click', () => copyText(textEl.textContent));
  showRandom();
}

/* ============ 冷笑话合集 ============ */
function initJokes() {
  const cats = ['全部', ...new Set(JOKES.map(j => j.cat))];
  const filterBar = document.getElementById('filterBar');
  const listEl = document.getElementById('jokeList');
  let activeCat = '全部';

  cats.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat === '全部' ? ' active' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      activeCat = cat;
      filterBar.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      render();
    });
    filterBar.appendChild(chip);
  });

  function render() {
    const list = activeCat === '全部' ? JOKES : JOKES.filter(j => j.cat === activeCat);
    listEl.innerHTML = '';
    if (!list.length) {
      listEl.innerHTML = '<div class="empty-tip">这里空空如也 🤷（换个分类看看）</div>';
      return;
    }
    list.forEach((j, idx) => {
      const item = document.createElement('div');
      item.className = 'joke-item';
      item.innerHTML =
        '<div class="idx cat-' + j.cat + '">' + (idx + 1) + '</div>' +
        '<div class="body">' +
          '<div class="text">' + j.text + '</div>' +
          '<span class="tag">' + j.cat + '</span>' +
        '</div>';
      item.addEventListener('click', () => copyText(j.text));
      listEl.appendChild(item);
    });
  }
  render();
}

/* ============ 图文段子 ============ */
function initMemes() {
  const grid = document.getElementById('memeGrid');
  MEMES.forEach(m => {
    const card = document.createElement('div');
    card.className = 'meme-card';
    card.innerHTML =
      '<div class="meme-emoji">' + m.emoji + '</div>' +
      '<div class="meme-text">' + m.text + '</div>' +
      '<div class="meme-tag">' + m.tag + '</div>';
    card.addEventListener('click', () => copyText(m.text));
    grid.appendChild(card);
  });
}

/* ============ 随机生成器 ============ */
function initGenerator() {
  // 沙雕文案
  const copyOut = document.getElementById('genCopy');
  function genCopy() {
    copyOut.textContent = rand(GEN.copy_subject) + rand(GEN.copy_action) + '，' + rand(GEN.copy_result) + '。';
  }
  document.getElementById('genCopyBtn').addEventListener('click', genCopy);
  copyOut.addEventListener('click', () => copyText(copyOut.textContent));

  // 今日运势
  const luckOut = document.getElementById('genLuck');
  function genLuck() {
    const lvl = rand(GEN.luck_level);
    const color = rand(GEN.luck_color);
    const num = randInt(1, 99);
    const good = pick(GEN.luck_good, 2).join('、');
    const bad = pick(GEN.luck_bad, 2).join('、');
    luckOut.innerHTML =
      '<div style="font-size:26px;margin-bottom:6px;">' + lvl + '</div>' +
      '<div class="muted">幸运色：' + color + ' · 幸运数字：' + num + '</div>' +
      '<div class="muted">宜：' + good + '</div>' +
      '<div class="muted">忌：' + bad + '</div>';
  }
  document.getElementById('genLuckBtn').addEventListener('click', genLuck);

  // 沙雕昵称
  const nickOut = document.getElementById('genNick');
  function genNick() {
    nickOut.textContent = rand(GEN.nick_prefix) + rand(GEN.nick_suffix);
  }
  document.getElementById('genNickBtn').addEventListener('click', genNick);
  nickOut.addEventListener('click', () => copyText(nickOut.textContent));

  genCopy();
  genLuck();
  genNick();
}

/* ============ 启动 ============ */
document.addEventListener('DOMContentLoaded', () => {
  highlightTab();
  const page = document.body.id;
  if (page === 'page-home') initHome();
  else if (page === 'page-jokes') initJokes();
  else if (page === 'page-memes') initMemes();
  else if (page === 'page-generator') initGenerator();
});
