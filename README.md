# QELVION Biotech — Competition Landing Page

高端科研级肽制造商 / CDMO 定位的英文落地页（比赛演示用），整体视觉与文案对标并超越 norcopeptide.com 的骨架，全部内容为合规的 **Research & Development use only** 口径。

## 📦 文件结构

```
QELVION-landing/
├── index.html                 ← 首页（默认深色主题；右上角 ☀/☾ 一键切换浅色，记忆选择）
├── index-light.html           ← 首页浅色变体（打开即白底版，可切回深色）
├── catalog.html               ← 真实产品目录页（43+ 条科研产品线，可搜索 + 分类筛选，含 COA/报价入口）
├── assets/
│   ├── logo-mark.svg          ← QELVION 图标（六边形分子环 + 肽链双螺旋 + Q 尾）
│   ├── logo-mark.png          ← 图标 PNG 预览（透明底）
│   ├── logo-lockup.svg        ← 横版组合（深色字，用于浅色底）
│   ├── logo-lockup.png
│   ├── logo-lockup-dark.svg   ← 横版组合（浅色字，用于深色底/页面本身）
│   └── logo-lockup-dark.png
└── _qa/                       ← 自检截图与日志（可删除，不影响交付）
```

> 主题切换：点右上角 ☀/☾ 图标即可在深/浅色间切换（会记住你的选择）；也可在网址后加 `?theme=light` 或 `?theme=dark` 强制指定，便于演示时快速展示两种版本。

## 🚀 快速开始

1. **本地演示**：双击 `index.html` 即可在浏览器打开（断网也能完整展示，仅字体回退为系统字体）。
2. **本地服务器**（可选）：在文件夹内运行
   - `python -m http.server 8080` 或 `npx serve`
   - 浏览器访问 `http://localhost:8080`
3. **上线（5 分钟，任选其一）**：
   - **Netlify Drop**：打开 https://app.netlify.com/drop → 把整个 `QELVION-landing` 文件夹拖进去 → 即得公网网址（比赛评委可手机/电脑直接访问）。
   - **GitHub Pages**：新建仓库上传全部文件 → Settings → Pages → 选分支 → 生成 `https://<你的用户名>.github.io/...`
   
   ⚠️ 三个页面（index / index-light / catalog）互相链接，必须放在**同一文件夹/同一域名根目录**上传，直接双击本地文件时也一样（彼此能互相跳转）。

## ✏️ 常见修改点（在 index.html 中搜以下关键字）

| 想改什么 | 搜索关键字 |
|---|---|
| 联系邮箱 | `quote@qelvionbiotech.com`（顶部栏 / Hero 数据条 / 联系区 / 页脚共 4 处） |
| 数据统计 | `data-count`（120+ SKU、≥99%、35+ 国家）与 `7+` 年份 |
| 产品六大类 | `P-01` … `P-06` 卡片文字 |
| 目录页产品线 | `catalog.html` 底部 `CATS` 数组（改名称/规格/描述即可增删，排版自动适应） |
| 质控证书卡 | `QV-2049`、`LOT 8812`、纯度数值 |
| FAQ 文案 | `<details>` 标签内的问答 |
| 页脚年份 | 自动获取当前年份，无需改 |

## 🏆 设计要点（答辩/评审时可用）

- **参考站骨架 → 高级化**：保留 norcopeptide 的信息架构（顶部报价条 → 导航 → Hero → Why Choose Us → 产品分类 → 认证 → 数据 → FAQ → Quote CTA），升级为企业级科研品牌语言。
- **视觉系统**：深空蓝底 + 青/碧渐变（分子科技感）、网格背景、玻璃拟态卡片、滚动入场动画、数字滚动统计、QC 释放记录卡（纯度 99.31% + 条形码 + 计量条）。**双主题**：深色默认、浅色一键切换。
- **产品图**：参照市场冻干粉西林瓶形态（银色 flip-off 铝盖、瓶内白色冻干饼、wrap 标签）绘制品牌瓶；首页 Hero + 六大产品卡 + 目录页 43 个 SKU **每个产品都有专属瓶图**（贴纸含产品名/规格/条码，纯 SVG 矢量可无限放大）。
- **原创品牌资产**：`QELVION` 图标 = 六边形分子环 + 肽链双螺旋 + 向外延伸的 Q 尾，全套 SVG（无限缩放）+ PNG，深/浅双版本。
- **真实产品目录页**：按科研应用分 6 大类、43 条产品线（BPC-157 / TB-500 / GHK-Cu / NAD+ / Epithalon / GLOW / KLOW 等，规格与你的价格表口径一致），支持关键词搜索 + 分类筛选 + 计数，每条带“Request COA & Quote”按钮。
- **技术指标**：单文件零依赖、响应式（桌面/平板/手机）、暗色优先、`prefers-reduced-motion` 无障碍支持、无任何外部图片。
- **定位安全**：全程 "research-grade / research use only" 口径，无面向个人注射的剂量引导、无零售价格、无产地隐瞒表述 —— 合规即专业，也是正规评审的加分项。

## ⚠️ 演示前检查

- 如现场需要联网字体（Sora / Manrope / JetBrains Mono），确认评委演示环境有网；无网时自动回退 Segoe UI / Consolas，版面不受影响。
- 联系邮箱为占位内容，正式提交前请替换为自己的真实联系渠道（如 WhatsApp / 企业邮箱）。
