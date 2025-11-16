import { fileURLToPath } from "url";
import fs from "fs";
import https from "https";
import { parse as parseUrl } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "src", "data", "words.json");

// 初始化 kuroshiro（單例模式）
let kuroshiroInstance = null;
let kuroshiroInitialized = false;

const initKuroshiro = async () => {
  if (kuroshiroInitialized && kuroshiroInstance) {
    return kuroshiroInstance;
  }

  try {
    console.log("[API] 開始初始化 kuroshiro...");

    // 動態導入 kuroshiro 和 analyzer
    const KuroshiroModule = await import("kuroshiro");
    const KuromojiAnalyzerModule = await import("kuroshiro-analyzer-kuromoji");

    // 處理 ES modules 導入（kuroshiro 有雙層 default）
    const Kuroshiro =
      KuroshiroModule.default?.default ||
      KuroshiroModule.default ||
      KuroshiroModule;
    const KuromojiAnalyzer =
      KuromojiAnalyzerModule.default?.default ||
      KuromojiAnalyzerModule.default ||
      KuromojiAnalyzerModule;

    console.log("[API] Kuroshiro 類型:", typeof Kuroshiro);
    console.log("[API] Kuroshiro 是函數:", typeof Kuroshiro === "function");
    console.log("[API] 創建 Kuroshiro 實例...");

    if (typeof Kuroshiro !== "function") {
      throw new Error(
        `Kuroshiro is not a constructor. Type: ${typeof Kuroshiro}, Value: ${Kuroshiro}`
      );
    }

    const kuroshiro = new Kuroshiro();

    console.log("[API] 創建 KuromojiAnalyzer...");

    // 指定字典路徑
    const dictPath = path.join(__dirname, "node_modules", "kuromoji", "dict");
    console.log("[API] 字典路徑:", dictPath);

    const analyzer = new KuromojiAnalyzer({
      dictPath: dictPath,
    });

    console.log("[API] 初始化 kuroshiro...");
    await kuroshiro.init(analyzer);
    console.log("[API] kuroshiro 初始化成功！");
    kuroshiroInstance = kuroshiro;
    kuroshiroInitialized = true;
    return kuroshiro;
  } catch (error) {
    console.error("[API] 初始化 kuroshiro 失敗:", error);
    console.error("[API] 錯誤訊息:", error.message);
    console.error("[API] 錯誤堆疊:", error.stack);
    return null;
  }
};

// 檢查是否包含漢字
const hasKanji = (text) => {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
};

// 設置 API 中間件的函數（可在 dev 和 preview 模式下共用）
function setupApiMiddlewares(server) {
      // 統一路由處理
      server.middlewares.use("/api/words", (req, res, next) => {
        const urlParts = req.url.split("/").filter(Boolean);
        const id = urlParts.length > 0 ? urlParts[urlParts.length - 1] : null;
        const isIdRoute = id && id !== "words";

        // 確保資料檔案存在
        if (!fs.existsSync(DATA_FILE)) {
          fs.writeFileSync(DATA_FILE, "[]", "utf-8");
        }

        // GET /api/words - 讀取所有單字
        if (req.method === "GET" && !isIdRoute) {
          try {
            const data = fs.readFileSync(DATA_FILE, "utf-8");
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(data);
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }

        // POST /api/words - 新增單字
        if (req.method === "POST" && !isIdRoute) {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });
          req.on("end", () => {
            try {
              const words = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
              const newWord = JSON.parse(body);
              newWord.id = newWord.id || Date.now().toString();
              newWord.createdAt = newWord.createdAt || Date.now();
              words.push(newWord);
              fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(words, null, 2),
                "utf-8"
              );
              res.setHeader("Content-Type", "application/json");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.end(JSON.stringify(newWord));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }

        // DELETE /api/words/:id - 刪除單字
        if (req.method === "DELETE" && isIdRoute) {
          try {
            const words = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
            const filtered = words.filter((word) => word.id !== id);
            fs.writeFileSync(
              DATA_FILE,
              JSON.stringify(filtered, null, 2),
              "utf-8"
            );
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }

        // PUT /api/words/:id - 更新單字
        if (req.method === "PUT" && isIdRoute) {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });
          req.on("end", () => {
            try {
              const words = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
              const index = words.findIndex((word) => word.id === id);
              if (index !== -1) {
                const updatedWord = JSON.parse(body);
                words[index] = { ...words[index], ...updatedWord };
                fs.writeFileSync(
                  DATA_FILE,
                  JSON.stringify(words, null, 2),
                  "utf-8"
                );
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.end(JSON.stringify(words[index]));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "Word not found" }));
              }
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }

        next();
      });

      // GET /api/tts - Google TTS 代理
      server.middlewares.use("/api/tts", async (req, res, next) => {
        // 處理 CORS preflight 請求
        if (req.method === "OPTIONS") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method === "GET") {
          try {
            // 解析 URL 參數
            const urlObj = parseUrl(req.url, true);
            const text = urlObj.query?.text;

            if (!text) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Text parameter is required" }));
              return;
            }

            const decodedText = decodeURIComponent(text);
            console.log("[API] TTS 請求，文字:", decodedText);

            // 使用 Google Translate TTS API
            const encodedText = encodeURIComponent(decodedText);
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&textlen=${decodedText.length}&q=${encodedText}`;

            console.log("[API] 請求 Google TTS URL:", ttsUrl);

            // 使用 Node.js 的 https 模組來獲取音頻
            const parsedUrl = parseUrl(ttsUrl);
            const options = {
              hostname: parsedUrl.hostname,
              path: parsedUrl.path,
              method: "GET",
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Referer: "https://translate.google.com/",
                Accept:
                  "audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,application/ogg;q=0.7,video/*;q=0.6,*/*;q=0.5",
              },
            };

            https
              .get(options, (ttsRes) => {
                // 檢查響應狀態
                if (ttsRes.statusCode !== 200) {
                  console.error("[API] TTS 響應狀態碼:", ttsRes.statusCode);
                  if (!res.headersSent) {
                    res.statusCode = ttsRes.statusCode;
                    res.end(JSON.stringify({ error: "TTS request failed" }));
                  }
                  return;
                }

                // 獲取內容類型，優先使用 Google 返回的類型
                let contentType =
                  ttsRes.headers["content-type"] || "audio/mpeg";
                console.log("[API] TTS 響應 Content-Type:", contentType);
                console.log("[API] TTS 響應狀態碼:", ttsRes.statusCode);
                console.log(
                  "[API] TTS 響應頭:",
                  JSON.stringify(ttsRes.headers, null, 2)
                );

                // 如果 Google 返回的格式不被瀏覽器支持，嘗試強制使用 mp3
                // 檢查是否是瀏覽器不支持的格式
                if (
                  !contentType.includes("mp3") &&
                  !contentType.includes("mpeg") &&
                  !contentType.includes("webm") &&
                  !contentType.includes("ogg") &&
                  !contentType.includes("wav")
                ) {
                  console.warn(
                    "[API] 檢測到不支持的音頻格式，嘗試使用 audio/mpeg"
                  );
                  contentType = "audio/mpeg";
                }

                // 設置響應頭（必須在寫入數據之前設置）
                if (!res.headersSent) {
                  res.setHeader("Content-Type", contentType);
                  res.setHeader("Access-Control-Allow-Origin", "*");
                  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
                  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
                  res.setHeader("Cache-Control", "no-cache");
                  res.setHeader("Accept-Ranges", "bytes");
                }

                // 使用 pipe 轉發音頻數據（更可靠）
                ttsRes.pipe(res);

                ttsRes.on("end", () => {
                  console.log("[API] TTS 音頻數據傳輸完成");
                });

                ttsRes.on("error", (error) => {
                  console.error("[API] TTS 響應流錯誤:", error);
                  if (!res.headersSent) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: "TTS stream error" }));
                  } else {
                    res.destroy();
                  }
                });
              })
              .on("error", (error) => {
                console.error("[API] TTS 請求失敗:", error);
                if (!res.headersSent) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: "TTS request failed" }));
                }
              });
          } catch (error) {
            console.error("[API] TTS 處理錯誤:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: error.message }));
          }
          return;
        }
        next();
      });

      // POST /api/convert - 轉換日文
      server.middlewares.use("/api/convert", async (req, res, next) => {
        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });
          req.on("end", async () => {
            try {
              const { text } = JSON.parse(body);
              console.log("[API] 收到轉換請求，文字:", text);

              if (!text || text.trim() === "") {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Text is required" }));
                return;
              }

              const trimmedText = text.trim();
              console.log(
                "[API] 處理文字:",
                trimmedText,
                "包含漢字:",
                hasKanji(trimmedText)
              );

              // 如果包含漢字，使用 kuroshiro 轉換
              if (hasKanji(trimmedText)) {
                console.log("[API] 開始初始化 kuroshiro...");
                const kuroshiro = await initKuroshiro();
                if (kuroshiro) {
                  console.log("[API] kuroshiro 初始化成功，開始轉換...");
                  console.log("[API] 轉換文字:", trimmedText);

                  try {
                    const hiragana = await kuroshiro.convert(trimmedText, {
                      to: "hiragana",
                    });
                    console.log("[API] 平假名轉換結果:", hiragana);

                    const katakana = await kuroshiro.convert(trimmedText, {
                      to: "katakana",
                    });
                    console.log("[API] 片假名轉換結果:", katakana);

                    const romaji = await kuroshiro.convert(trimmedText, {
                      to: "romaji",
                    });
                    console.log("[API] 羅馬拼音轉換結果:", romaji);

                    console.log("[API] 完整轉換結果:", {
                      hiragana,
                      katakana,
                      romaji,
                    });

                    res.setHeader("Content-Type", "application/json");
                    res.setHeader("Access-Control-Allow-Origin", "*");
                    res.end(
                      JSON.stringify({
                        hiragana: hiragana || "",
                        katakana: katakana || "",
                        romaji: romaji || "",
                      })
                    );
                  } catch (convertError) {
                    console.error("[API] 轉換過程出錯:", convertError);
                    console.error("[API] 轉換錯誤堆疊:", convertError.stack);
                    res.setHeader("Content-Type", "application/json");
                    res.setHeader("Access-Control-Allow-Origin", "*");
                    res.end(
                      JSON.stringify({
                        hiragana: "",
                        katakana: "",
                        romaji: "",
                      })
                    );
                  }
                } else {
                  console.error("[API] kuroshiro 初始化失敗，返回空值");
                  // 初始化失敗時，返回空值讓前端使用 wanakana 處理
                  res.setHeader("Content-Type", "application/json");
                  res.setHeader("Access-Control-Allow-Origin", "*");
                  res.end(
                    JSON.stringify({
                      hiragana: "",
                      katakana: "",
                      romaji: "",
                    })
                  );
                }
              } else {
                // 如果不包含漢字，回傳空值（前端會用 wanakana 處理）
                console.log("[API] 不包含漢字，回傳空值");
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.end(
                  JSON.stringify({
                    hiragana: "",
                    katakana: "",
                    romaji: "",
                  })
                );
              }
            } catch (error) {
              console.error("[API] 處理錯誤:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          return;
        }
        next();
      });
}

export function apiPlugin() {
  return {
    name: "api-plugin",
    configureServer(server) {
      // 開發模式
      setupApiMiddlewares(server);
    },
    configurePreviewServer(server) {
      // 預覽模式
      setupApiMiddlewares(server);
    },
  };
}
