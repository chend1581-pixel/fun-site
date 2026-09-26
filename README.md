# 期货看板 📈

一个纯静态的期货监控数据看板，展示阿里云 ECS 监控系统产出的期货数据：量能异动、支撑压力位、基本面五维分析、比特币行情。

## 页面
- `index.html` — 总览（市场统计 + BTC 卡片 + 异动 TOP + 重要新闻）
- `volume.html` — 量能异动榜（49 品种信号/强度/量比/持仓变化）
- `support.html` — 支撑 / 压力位（机构方向 + 趋势）
- `fundamental.html` — 基本面五维（基差/库存/供需/政策/资金 + 偏多/偏空筛选）

## 数据流
```
ECS 监控脚本 → 3 份 JSON → publish.py 合并 → git push 到 data 分支
    ↓
GitHub fun-site 仓库 data 分支的 market.json
    ↓ 浏览器 fetch（jsDelivr CDN / raw 兜底）
Vercel 前端看板（main 分支）
```

- 网站壳（HTML/CSS/JS）在 `main` 分支，Vercel 监听 main 自动部署。
- 数据 `market.json` 在 `data` 分支，由 ECS 每 30 分钟 push，**不触发 Vercel 构建**（绕开免费构建额度）。

## 本地预览
```bash
cd fun-site
python -m http.server 8080
# 浏览器打开 http://localhost:8080
# 前端按序尝试 jsDelivr → raw → 本地 market.json，本地验证时放一份 market.json 即可
```

## 数据获取顺序
前端 `js/main.js` 按序尝试：
1. `https://cdn.jsdelivr.net/gh/chend1581-pixel/fun-site@data/market.json`
2. `https://raw.githubusercontent.com/chend1581-pixel/fun-site/data/market.json`
3. 本地同源 `market.json`（部署环境不存在，仅本地调试用）

## 技术栈
纯 HTML + CSS + 原生 JS，无依赖、无构建。数据由 ECS 侧 `publish.py` 推送。
