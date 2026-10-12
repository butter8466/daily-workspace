# 股研室 · 台股研究工作台

網站：https://butter8466.github.io/daily-workspace/

## 功能

- 新增自選股，記錄證券代號、名称、市場與研究狀態。
- 搜尋代號或名稱，篩選觀察中、研究中、待回顧。
- 記錄關注原因、風險與疑問、下一步查證。
- 收藏每檔股票的參考連結；提供證交所、公開資訊觀測站與櫃買中心官方入口。
- 自動儲存在此瀏覽器，支援 JSON 匯出／匯入。匯入採合併，同代號保留原有筆記，不覆寫。

代號與名稱需自行核對。無即時行情、資料爬取或買賣建議。資料不會跨裝置自動同步，也不會上傳到 GitHub。清除瀏覽器資料會遺失筆記，請定期匯出備份。舊待辦資料使用不同儲存鍵，不會被新工具覆寫。

## macOS 本機執行

安裝 .NET 10 SDK，下載本儲存庫原始碼。在專案目錄執行：

```bash
dotnet build
dotnet run --urls http://localhost:5127
```

開啟 http://localhost:5127/ 。HTML、CSS、JavaScript 分別位於 index.html、site.css、app.js；C# API 在 Program.cs。建置時前端複製到輸出目錄 wwwroot。GitHub Pages 從 main / (root) 發布純前端。
