const API_BASE = "/api/words";

// 讀取所有單字
export const getWords = async () => {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error("讀取資料失敗");
    }
    return await response.json();
  } catch (error) {
    console.error("讀取單字失敗:", error);
    // 如果 API 失敗，回傳空陣列
    return [];
  }
};

// 儲存單字
export const saveWord = async (word) => {
  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(word),
    });
    if (!response.ok) {
      throw new Error("儲存資料失敗");
    }
    return await response.json();
  } catch (error) {
    console.error("儲存單字失敗:", error);
    throw error;
  }
};

// 刪除單字
export const deleteWord = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("刪除資料失敗");
    }
    return await response.json();
  } catch (error) {
    console.error("刪除單字失敗:", error);
    throw error;
  }
};

// 更新單字
export const updateWord = async (id, updatedWord) => {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedWord),
    });
    if (!response.ok) {
      throw new Error("更新資料失敗");
    }
    return await response.json();
  } catch (error) {
    console.error("更新單字失敗:", error);
    throw error;
  }
};
