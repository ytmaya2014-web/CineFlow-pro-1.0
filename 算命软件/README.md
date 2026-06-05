# 🔮 算命小工具

手机浏览器打开，随时算八字、看日运月运、挑好日子、选水晶。

## 这是什么

一个纯网页的算命工具，八字+紫微斗数+水晶知识库全都有。AI 帮你推演排盘，但**只说人话**，不拽术语，不吓唬人。

## 功能

| Tab | 做什么 |
|-----|--------|
| 📿 命盘 | 填生辰 → AI 排盘推演，输出性格/事业/感情/运势/水晶建议 |
| ☀️ 日运 | 每天看看今天气场怎么样，给具体的小建议 |
| 🌙 月运 | 本月主题 + 事业/感情/健康提醒 |
| 📅 择日 | 选活动类型和日期范围，AI 帮你挑好日子 + 标出避开日 |
| 👤 档案 | 存自己、家人、朋友的生辰，随时切换 |

## 怎么用

### 方式一：用我已经搭好的（推荐）

部署到服务器后直接手机浏览器打开网页，加入主屏幕。

### 方式二：自己搭

1. **注册 DeepSeek**
   - 去 [platform.deepseek.com](https://platform.deepseek.com) 注册
   - 在「API Keys」创建一个 Key
   - 充 10 块钱够用很久（一次排盘几分钱）

2. **部署后端（Vercel）**
   - Fork 这个仓库
   - 在 [vercel.com](https://vercel.com) 导入
   - 设置环境变量：
     - `DEEPSEEK_API_KEY` = 你刚才创建的 DeepSeek Key
     - `FORTUNE_API_KEY` = 自己随便想一个密钥（比如 `my-fortune-2024`）

3. **打开前端**
   - 启用 GitHub Pages（Settings → Pages → main 分支）
   - 打开 `index.html`，找到这一行：
     ```js
     const API_URL = 'https://YOUR_VERCEL_APP.vercel.app/api/fortune';
     const API_KEY = 'your-secret-key-here';
     ```
   - 改成你的 Vercel 域名和密钥
   - Push 上去，手机打开 GitHub Pages URL

4. **添加到手机主屏幕**
   - Safari：底部分享按钮 → 添加到主屏幕
   - Chrome：菜单 → 添加到主屏幕

## 技术栈

- **前端**：纯 HTML/CSS/JS，零框架，一个文件搞定
- **后端**：Vercel Serverless Function + DeepSeek API
- **存储**：localStorage（数据只在你手机上，不上传）
- **推理**：DeepSeek `deepseek-chat`，流式输出

## 隐私

所有档案数据通过 localStorage 存在你的手机浏览器里，**不会上传到任何服务器**。发送给 API 的只有生辰数据和查询类型，不包含姓名。

## License

MIT
