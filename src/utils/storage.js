const API_BASE = "/api/words";
const STORAGE_KEY = "japanese_words";
const DATA_FILE = "/data/words.json";

// 檢查是否為開發環境
const isDev = import.meta.env.DEV;

// 從 localStorage 讀取
const getFromLocalStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("從 localStorage 讀取失敗:", error);
    return [];
  }
};

// 儲存到 localStorage
const saveToLocalStorage = (words) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch (error) {
    console.error("儲存到 localStorage 失敗:", error);
  }
};

// 讀取所有單字
export const getWords = async () => {
  // 開發環境：優先使用 API
  if (isDev) {
    try {
      const response = await fetch(API_BASE);
      if (response.ok) {
        const data = await response.json();
        // 同步到 localStorage 作為備份
        saveToLocalStorage(data);
        return data;
      }
    } catch (error) {
      console.warn("API 讀取失敗，嘗試使用 localStorage:", error);
    }
  } else {
    // 生產環境：先嘗試從 public/data/words.json 讀取
    try {
      const response = await fetch(DATA_FILE);
      if (response.ok) {
        const data = await response.json();
        // 同步到 localStorage
        saveToLocalStorage(data);
        return data;
      }
    } catch (error) {
      console.warn("從文件讀取失敗，嘗試使用 localStorage:", error);
    }
  }

  // 如果都失敗，使用 localStorage
  const localData = getFromLocalStorage();
  if (localData.length > 0) {
    return localData;
  }

  // 如果 localStorage 也是空的，返回空陣列
  return [];
};

// 儲存單字
export const saveWord = async (word) => {
  // 開發環境：優先使用 API
  if (isDev) {
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(word),
      });
      if (response.ok) {
        const savedWord = await response.json();
        // 同步到 localStorage
        const words = getFromLocalStorage();
        words.push(savedWord);
        saveToLocalStorage(words);
        return savedWord;
      }
    } catch (error) {
      console.warn("API 儲存失敗，使用 localStorage:", error);
    }
  }

  // 使用 localStorage
  const words = getFromLocalStorage();
  const newWord = {
    ...word,
    id: word.id || Date.now().toString(),
  };
  words.push(newWord);
  saveToLocalStorage(words);
  return newWord;
};

// 刪除單字
export const deleteWord = async (id) => {
  // 開發環境：優先使用 API
  if (isDev) {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // 同步到 localStorage
        const words = getFromLocalStorage();
        const filtered = words.filter((word) => word.id !== id);
        saveToLocalStorage(filtered);
        return { success: true };
      }
    } catch (error) {
      console.warn("API 刪除失敗，使用 localStorage:", error);
    }
  }

  // 使用 localStorage
  const words = getFromLocalStorage();
  const filtered = words.filter((word) => word.id !== id);
  saveToLocalStorage(filtered);
  return { success: true };
};

// 更新單字
export const updateWord = async (id, updatedWord) => {
  // 開發環境：優先使用 API
  if (isDev) {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedWord),
      });
      if (response.ok) {
        const savedWord = await response.json();
        // 同步到 localStorage
        const words = getFromLocalStorage();
        const index = words.findIndex((word) => word.id === id);
        if (index !== -1) {
          words[index] = savedWord;
          saveToLocalStorage(words);
        }
        return savedWord;
      }
    } catch (error) {
      console.warn("API 更新失敗，使用 localStorage:", error);
    }
  }

  // 使用 localStorage
  const words = getFromLocalStorage();
  const index = words.findIndex((word) => word.id === id);
  if (index !== -1) {
    words[index] = { ...updatedWord, id };
    saveToLocalStorage(words);
    return words[index];
  }
  throw new Error("找不到要更新的單字");
};
