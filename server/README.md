# QELVION quote-form API · 部署说明

网站上的 "Request a Quote" 表单会 POST 到这里，然后由本服务把询价**用邮件发给客户来源对应的销售**（`/steven` 进来的 → Steven 邮箱），并**抄送一份到公司主邮箱**，确保不丢单。

## 一、在 Render 建服务（约 3 分钟）

1. 打开 https://dashboard.render.com → **New + → Web Service**
2. 连接仓库 `bkcompanychatgpt/qelvion-landing`
3. 填写：
   - **Name**: `qelvion-quote-api`
   - **Root Directory**: `server`   ← 重要
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free（免费；缺点：15 分钟无人访问会休眠，第一条提交可能要等 30-60 秒）
4. 点 **Create Web Service**，等待首次部署完成，得到网址：
   `https://qelvion-quote-api.onrender.com`

## 二、Environment（环境变量）

| Key | Value | 说明 |
|---|---|---|
| `MAIL_FROM` | `orders@qelvionbiotech.com` | 发件人（必须是你 Fastmail 里已验证的地址） |
| `MAIL_FALLBACK_TO` | `main@qelvionbiotech.com` | 公司主邮箱（无对应销售时收件 / 有销售时抄送） |
| `SMTP_HOST` | `smtp.fastmail.com` | Fastmail SMTP |
| `SMTP_PORT` | `465` | |
| `SMTP_USER` | `orders@qelvionbiotech.com` | |
| `SMTP_PASS` | （Fastmail App Password） | **不要用登录密码**；到 Fastmail → Settings → Privacy & Security → App passwords 新建一个，权限选 SMTP |
| `ALLOW_ORIGIN` | `https://qelvionbiotech.com` | 只允许你的网站调用 |
| `CONTACTS_URL` | `https://qelvionbiotech.com/assets/contacts.json` | 销售名单来源（改名单只改这个文件） |
| `RESEND_API_KEY` | （可选 `re_xxx`） | 如果以后改用 Resend 发信，填了它就会优先走 Resend，忽略 SMTP |

> 发信方式二选一：**SMTP（Fastmail，推荐先用）** 或 **Resend（更专业、可看投递日志）**。代码已同时支持。

## 三、前端已配置的地址

`index.html`（及各销售页）里的：

```js
var QUOTE_API="https://qelvion-quote-api.onrender.com/api/quote";
```

如果 Render 给你的网址不同，把这一行改掉即可（也可以用自定义子域 `api.qelvionbiotech.com`，更美观）。

## 四、验收

1. 浏览器打开 `https://qelvion-quote-api.onrender.com/health` → 应返回 `{"ok":true,"transport":"smtp"}`；
2. 打开 https://qelvionbiotech.com → 填表单（用假数据）→ 提交；
3. 对应销售的邮箱应收到标题形如 `[Website quote] Test Name · Test Co · Steven` 的邮件，`main@` 会收到抄送；
4. 直接回复该邮件 → 会自动回复给客户（Reply-To 已设为客户邮箱）。

## 五、可选优化

- **防休眠**：用 UptimeRobot（免费）每 5 分钟访问一次 `/health`，避免第一条提交等 30-60 秒；
- **自定义域**：Render → Settings → Custom Domains 添加 `api.qelvionbiotech.com`，再到 Cloudflare 加一条 CNAME 指向 `qelvion-quote-api.onrender.com`（DNS only 即可）。
