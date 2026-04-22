# 對話練習平台（OpenAI / Vercel 版本）

呢個專案已經改成可部署到 Vercel 嘅 Next.js 版本，並使用 OpenAI ChatGPT API。

## 1. 安裝
```bash
npm install
```

## 2. 建立環境變數
複製 `.env.example` 成 `.env.local`：

```bash
cp .env.example .env.local
```

然後填入你嘅 OpenAI API Key：

```bash
OPENAI_API_KEY=sk-xxxx
```

## 3. 本地開發
```bash
npm run dev
```

## 4. Deploy 去 Vercel
- 將成個 project upload 去 GitHub，或者用 Vercel CLI / 其他方法 deploy
- 喺 Vercel 專案設定加入環境變數：
  - `OPENAI_API_KEY`

## 檔案結構
- `pages/index.js`：前端介面
- `pages/api/chat.js`：server-side API proxy，安全呼叫 OpenAI API

## 使用模型
- 預設：`gpt-4o-mini`

## 注意
- 唔好喺前端直接放 API Key
- Vercel 上記得設定 environment variable
