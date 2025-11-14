import { toHiragana, toKatakana, toRomaji } from "wanakana";

// 檢查是否包含漢字
const hasKanji = (text) => {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
};

/**
 * 在羅馬拼音中添加空格以便閱讀
 * 在音節之間添加空格（音節通常以母音結尾）
 * @param {string} romaji - 羅馬拼音
 * @returns {string} 添加空格後的羅馬拼音
 */
export const addSpacesToRomaji = (romaji) => {
  if (!romaji || romaji.trim() === "") {
    return "";
  }

  // 如果已經包含空格，直接返回（保留用戶手動添加的空格）
  if (romaji.includes(" ")) {
    return romaji;
  }

  // 日文音節模式：CV（子音+母音）結構
  // 特殊情況：n（單獨成音節）、tsu/ch/s/sh 等
  // 使用正則表達式在音節之間插入空格
  let spaced = romaji
    // 處理特殊音節組合：tsu, chu, shu, sha, sho, shi, she 等
    .replace(
      /(tsu|chu|shu|sha|sho|shi|she|kya|kyu|kyo|gya|gyu|gyo|nya|nyu|nyo|hya|hyu|hyo|bya|byu|byo|pya|pyu|pyo|mya|myu|myo|rya|ryu|ryo)([bcdfghjklmnpqrstvwxyz])/gi,
      "$1 $2"
    )
    // 在母音後、子音+母音前添加空格（CV 結構）
    .replace(/([aeiou])([bcdfghjklmnpqrstvwxyz][aeiou])/gi, "$1 $2")
    // 在 n 後、子音+母音前添加空格（n 是特殊音節）
    .replace(/(n)([bcdfghjklmnpqrstvwxyz][aeiou])/gi, "$1 $2")
    // 在長音（重複母音或長音符號）後添加空格
    .replace(/([aeiou])([bcdfghjklmnpqrstvwxyz][aeiou])/gi, "$1 $2")
    // 清理多餘的空格
    .replace(/\s+/g, " ")
    .trim();

  return spaced;
};

/**
 * 處理日文輸入，自動轉換為平假名、片假名和羅馬拼音
 * @param {string} japanese - 日文輸入（可以是漢字、假名等）
 * @returns {Promise<object>} 包含 hiragana, katakana, romaji 的物件
 */
export const processJapanese = async (japanese) => {
  if (!japanese || japanese.trim() === "") {
    return {
      hiragana: "",
      katakana: "",
      romaji: "",
    };
  }

  const text = japanese.trim();

  try {
    // 如果包含漢字，使用後端 API 轉換
    if (hasKanji(text)) {
      try {
        console.log("調用轉換 API，文字:", text);
        const response = await fetch("/api/convert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        console.log("API 回應狀態:", response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          console.log("API 轉換結果:", result);
          return {
            hiragana: result.hiragana || "",
            katakana: result.katakana || "",
            romaji: result.romaji || "",
          };
        } else {
          const errorText = await response.text();
          console.error("API 失敗，狀態:", response.status, "錯誤:", errorText);
          // API 失敗時回退到 wanakana
          return fallbackConversion(text);
        }
      } catch (error) {
        console.error("轉換 API 錯誤:", error);
        // API 錯誤時回退到 wanakana
        return fallbackConversion(text);
      }
    } else {
      // 如果不包含漢字，使用 wanakana（更快）
      return fallbackConversion(text);
    }
  } catch (error) {
    console.error("日文處理錯誤:", error);
    // 發生錯誤時，嘗試使用 wanakana 作為備選
    return fallbackConversion(text);
  }
};

/**
 * 使用 wanakana 進行轉換（備選方案）
 */
const fallbackConversion = (text) => {
  try {
    const hiragana = toHiragana(text, { useObsoleteKana: false });
    const katakana = toKatakana(text, { useObsoleteKana: false });
    const romaji = toRomaji(text, { useObsoleteKana: false });

    // 檢查轉換是否成功（如果結果和輸入相同，可能表示無法轉換）
    const conversionSuccessful =
      hiragana !== text || katakana !== text || romaji !== text;

    return {
      hiragana: conversionSuccessful ? hiragana : "",
      katakana: conversionSuccessful ? katakana : "",
      romaji: conversionSuccessful ? romaji : "",
    };
  } catch (error) {
    console.error("wanakana 轉換錯誤:", error);
    return {
      hiragana: "",
      katakana: "",
      romaji: "",
    };
  }
};

/**
 * 獲取日文語音
 */
const getJapaneseVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  return voices.find(
    (voice) => voice.lang.startsWith("ja") || voice.lang === "ja-JP"
  );
};

/**
 * 播放日文發音
 * @param {string} text - 要播放的日文文字
 */
export const speakJapanese = (text) => {
  if (!text || text.trim() === "") {
    return;
  }

  if (!("speechSynthesis" in window)) {
    console.warn("此瀏覽器不支援語音合成功能");
    return;
  }

  // 停止當前播放
  window.speechSynthesis.cancel();

  const doSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9; // 稍微慢一點，方便學習
    utterance.pitch = 1;

    // 嘗試使用日文語音
    const japaneseVoice = getJapaneseVoice();
    if (japaneseVoice) {
      utterance.voice = japaneseVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // 嘗試獲取語音列表
  let japaneseVoice = getJapaneseVoice();

  // 如果語音列表還沒載入，等待載入完成
  if (!japaneseVoice && window.speechSynthesis.getVoices().length === 0) {
    const handleVoicesChanged = () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged
      );
      doSpeak();
    };
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      handleVoicesChanged
    );
    // 觸發語音列表載入
    window.speechSynthesis.getVoices();
  } else {
    doSpeak();
  }
};
