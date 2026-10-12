# 日常 · 我的工作空間

網站：https://butter8466.github.io/daily-workspace/

繁體中文 Vue 待辦網頁，支援電腦與手機。任務只儲存在各自瀏覽器，不會跨裝置同步。GitHub Pages 使用靜態模式，不執行 C# API。

## macOS 執行完整 C# 版本

安裝 .NET 10 SDK，下載本儲存庫原始碼並解壓縮。在專案目錄執行：

```bash
dotnet build
dotnet run --urls http://localhost:5127
```

開啟 http://localhost:5127/ 。建置時前端資源複製到輸出目錄 wwwroot，使用 local-config.js 啟用 C# API。HTML、CSS、JavaScript 分別在 index.html、site.css、app.js。
