# 日語 Shadowing 句型代換 — PWA 版

日語口語跟讀練習工具的 PWA（Progressive Web App）版本，改寫自 [shadowing-extension](https://github.com/danny19891219/japanese-shadowing-extension) Chrome Extension，邏輯完全相同，UI 改為手機優先（mobile-first）設計，可透過瀏覽器直接使用，或「加入主畫面」安裝為手機 App，離線也能運作。

---

## 與 Chrome Extension 版的差異

| 項目 | Chrome Extension 版 | PWA 版 |
|------|---------------------|--------|
| 資料儲存 | `chrome.storage.local` | `localStorage`（同機同瀏覽器持久化） |
| 進入方式 | 點擊擴充功能圖示開新分頁 | 直接開啟網址，或安裝到手機主畫面 |
| 離線支援 | 不需要（本機執行） | Service Worker 快取 app shell，離線可用 |
| UI 版型 | 桌面優先（側欄、多欄 Grid） | 手機優先（底部導覽列、單欄堆疊、橫向滑動字卡） |
| 核心邏輯（句型代換、TTS、CRUD、匯入匯出） | 完全相同 | 完全相同（逐行搬移） |

---

## 本機開發

```bash
npm install
npm run build     # 建置 dist/tailwind.css 與 dist/app.js
npm run serve      # 啟動本機靜態伺服器（python3 -m http.server 8080）
```

開啟 http://localhost:8080 即可預覽。修改 `src/app.jsx` 或 `src/input.css` 後需重新 `npm run build`。

---

## 部署到 GitHub Pages（手機開啟用）

1. 建立 GitHub repo 並 push 本專案（**需為 Public repo**，否則免費方案的 GitHub Pages 無法啟用）。
2. Repo 設定 → Pages → Source 選擇 `main` branch、`/ (root)` 目錄。
3. 等待部署完成後，會得到一個網址，例如：
   `https://<你的帳號>.github.io/<repo 名稱>/`
4. 用手機瀏覽器開啟該網址：
   - iOS Safari：分享 → 加入主畫面
   - Android Chrome：右上角選單 → 安裝應用程式 / 加入主畫面
5. 安裝後即可像原生 App 一樣從主畫面啟動，且支援離線使用（Service Worker 快取）。

> 注意：`manifest.webmanifest` 與 `sw.js` 內的路徑皆為相對路徑，因此無論部署在 repo 根目錄或子路徑（GitHub Pages 的預設路徑）都能正常運作。

---

## 專案結構

```
japaness-shadowing-pwa/
├── index.html              ← 入口頁面（PWA meta、manifest、SW 註冊）
├── manifest.webmanifest    ← PWA 安裝設定
├── sw.js                   ← Service Worker（離線快取）
├── src/
│   ├── app.jsx              ← React 原始碼（手機優先 UI）
│   └── input.css
├── dist/                    ← build 產出（app.js / tailwind.css）
├── lib/                     ← React / ReactDOM (production, UMD)
└── icons/                   ← 192 / 512 / apple-touch-icon
```

---

## 本地儲存結構

資料儲存於瀏覽器 `localStorage`，key 如下：

| Key | 型別 | 內容 |
|-----|------|------|
| `patterns` | `Pattern[]` | 所有自訂句型（覆蓋預設教材） |
| `progress` | `Record<id, { masteredAt: string }>` | 已標記熟練的句型 ID 對照表 |

資料格式、`template`/`components` 語法與匯入 JSON 範例，與 Chrome Extension 版完全相同，詳見原專案 [README](https://github.com/danny19891219/japanese-shadowing-extension#資料格式)。

---

## 已知限制

- **iOS Safari 語音**：Web Speech API 在 iOS 上日文語音選項較少，且首次播放需要使用者手動點擊觸發（無法自動播放）。
- **App 圖示畫質**：`icons/icon192.png`、`icons/icon512.png` 是從原專案 128px 圖示放大而成，建議之後換成正式高解析度美術圖。
- **資料不跨裝置同步**：`localStorage` 僅存在單一瀏覽器/裝置上，換手機或清除瀏覽器資料會遺失自訂教材與進度。
