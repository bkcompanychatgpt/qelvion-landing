# QELVION 上线操作单（Cloudflare 域名 + GitHub + Render）

本地已就绪：`QELVION-landing` 已是 git 仓库，`main` 分支已有首次提交（57 个文件）。
下面每一步只需要你的浏览器 + 一次终端命令，全程约 10 分钟。

---

## 第 1 步 · GitHub 建仓库（2 分钟）
1. 打开 https://github.com/new （需登录 GitHub，没有就注册）
2. Repository name: `qelvion-landing`
3. 选 **Private**（私有；要公开演示也可选 Public）
4. 不要勾选任何初始化选项 → 点 **Create repository**
5. 页面会显示推送命令。打开 PowerShell，执行（替换 `<你的用户名>`）：

```powershell
cd "C:\Users\teren\Downloads\多肽\QELVION-landing"
git remote add origin https://github.com/<你的用户名>/qelvion-landing.git
git branch -M main
git push -u origin main
```

> 若提示登录：会弹出浏览器窗口/让你填用户名密码 —— 用 GitHub 网页登录或创建 Personal Access Token 粘贴即可。
> 完成后把仓库地址（https://github.com/<你的用户名>/qelvion-landing）发我。

## 第 2 步 · Render 部署（5 分钟）
1. 打开 https://render.com 注册/登录（可用 GitHub 账号一键登录，这样能直接看到你的仓库）
2. 顶部 **New + → Static Site**
3. 连接 GitHub → 选择 `qelvion-landing` 仓库
4. 配置：
   - Name: `qelvion-landing`
   - Build Command: **留空**
   - Publish Directory: **`.`**（英文句点，表示仓库根目录）
5. 点 **Create Static Site** → 等待几分钟首次部署
6. 完成后顶部有个网址，形如 `https://qelvion-landing.onrender.com`
   —— **把该网址发我**，我先做线上验收。

## 第 3 步 · Cloudflare 绑域名（3 分钟，域名你已在 Cloudflare 购买）
1. 打开 https://dash.cloudflare.com → 点域名 `qelvionbiotech.com`（买完会自动建好 zone）
2. 左侧 **DNS → Records → Add record**：
   - Type: **CNAME**
   - Name: `@`（代表裸域名）
   - Target: `qelvion-landing.onrender.com`（第 2 步的网址去掉 https://）
   - Proxy status: **Proxied（橙色云朵）**
   - 保存
3. 回到 **Render → 你的站点 → Settings → Custom Domains → Add Custom Domain** → 输入 `qelvionbiotech.com` → 确认
   （可选再加一条 `www.qelvionbiotech.com`，DNS 加一条 CNAME：Name `www`、Target `qelvionbiotech.com`）
4. 等待 10–60 分钟证书生效（Render 显示 domain active）
   > 若超过 1 小时还是 Pending：把第 2 步那条 CNAME 的 Proxy 临时改成 **DNS only（灰色云朵）**，等 Render 显示 Active 后再改回 Proxied。

## 第 4 步 · 上线后自查
- 打开 https://qelvionbiotech.com 确认显示网站 → **发我网址**，我做完整线上验收（三页跳转 / 43 图加载 / WhatsApp 悬浮钮 / 手机端 / HTTPS / 目录筛选）。

## 以后自己改内容
- 改联系方式：GitHub 网页打开 `assets/site-settings.js` → 铅笔编辑 `email` / `whatsapp` → Commit → Render 自动重新部署，1-3 分钟生效。
- 改页面文字/产品：告诉我或直接编辑对应 HTML（静态站，改完 commit 即上线）。
