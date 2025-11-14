import { deleteWord, getWords } from "../utils/storage";
import { useEffect, useState } from "react";

import { CATEGORIES } from "../utils/categories";
import WordCard from "./WordCard";

const WordList = ({ onEditWord, onAddNew }) => {
  const [words, setWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [loading, setLoading] = useState(true);

  const loadWords = async () => {
    try {
      const storedWords = await getWords();
      // 保持文件中的原始順序
      setWords(storedWords);
      filterWords(storedWords, selectedCategory);
    } catch (error) {
      console.error("載入單字失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterWords = (wordsList, category) => {
    if (category === "全部") {
      setFilteredWords(wordsList);
    } else {
      const filtered = wordsList.filter((word) => word.category === category);
      setFilteredWords(filtered);
    }
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    filterWords(words, category);
  };

  useEffect(() => {
    loadWords();

    // 監聽自訂事件，當新增單字時重新載入
    const handleWordAdded = () => {
      loadWords();
    };
    window.addEventListener("wordAdded", handleWordAdded);

    return () => {
      window.removeEventListener("wordAdded", handleWordAdded);
    };
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("確定要刪除這個單字嗎？")) {
      try {
        await deleteWord(id);
        await loadWords();
      } catch (error) {
        console.error("刪除失敗:", error);
        alert("刪除失敗，請稍後再試");
      }
    }
  };

  if (loading) {
    return (
      <div className="word-list empty">
        <p>載入中...</p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="word-list empty">
        <p>還沒有儲存任何單字，開始新增第一個單字吧！</p>
      </div>
    );
  }

  if (filteredWords.length === 0 && selectedCategory !== "全部") {
    return (
      <div className="word-list">
        <div className="word-list-header">
          <h2>已儲存的單字 (0)</h2>
          <div className="category-filter">
            <label htmlFor="category-filter">分類篩選：</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="category-select"
            >
              <option value="全部">全部</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="word-list empty">
          <p>此分類下還沒有單字</p>
        </div>
      </div>
    );
  }

  return (
    <div className="word-list">
      <div className="word-list-header">
        <h2>已儲存的單字 ({filteredWords.length})</h2>
        <div className="word-list-actions">
          <button className="add-word-btn" onClick={onAddNew}>
            ＋ 新增單字
          </button>
          <div className="category-filter">
            <label htmlFor="category-filter">分類篩選：</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="category-select"
            >
              <option value="全部">全部</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="word-cards-container">
        {filteredWords.map((word) => (
          <WordCard
            key={word.id}
            word={word}
            onDelete={handleDelete}
            onEdit={onEditWord}
          />
        ))}
      </div>
    </div>
  );
};

export default WordList;
