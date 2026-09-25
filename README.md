# 快乐源泉 🤣

一个纯静态的轻松搞笑小网站，包含冷笑话合集、图文段子和随机生成器。

## 页面
- `index.html` — 首页「今日整活」，随机一条笑话 + 换一个/复制
- `jokes.html` — 冷笑话合集（分类筛选，点击卡片复制）
- `memes.html` — 图文段子（瀑布流卡片）
- `generator.html` — 随机生成器（沙雕文案 / 今日运势 / 沙雕昵称）

## 本地预览
```bash
cd fun-site
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 加内容
所有内容都在 `js/data.js`，直接往 `JOKES`（冷笑话）、`MEMES`（段子）、`GEN`（生成器词库）里加一条即可，保存刷新即生效。

## 部署到 Vercel（免费）
1. 把本目录 push 到 GitHub 仓库
2. 打开 [vercel.com](https://vercel.com) → Add New Project → 导入该仓库
3. Vercel 会自动识别为静态站，**无需任何配置**，直接 Deploy
4. 得到 `https://xxx.vercel.app` 的访问地址

或者用 CLI：`npm i -g vercel && vercel`

## 部署到 Cloudflare Pages（免费）
1. push 到 GitHub
2. Cloudflare 控制台 → Workers & Pages → Create → Pages → 连接 GitHub
3. 构建命令留空，输出目录填 `/`，保存即部署

## 技术栈
纯 HTML + CSS + 原生 JS，无依赖、无构建，任何静态托管都能跑。
