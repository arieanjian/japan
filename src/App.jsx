import "./App.css";

import { useEffect, useState } from "react";

import WordForm from "./components/WordForm";
import WordList from "./components/WordList";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingWord, setEditingWord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleWordAdded = () => {
    // 觸發自訂事件，通知 WordList 重新載入
    window.dispatchEvent(new Event("wordAdded"));
    setRefreshKey((prev) => prev + 1);
    // 清除編輯狀態並關閉彈窗
    setEditingWord(null);
    setIsModalOpen(false);
  };

  const handleEditWord = (word) => {
    setEditingWord(word);
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingWord(null);
    setIsModalOpen(false);
  };

  const handleAddNew = () => {
    setEditingWord(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingWord(null);
    setIsModalOpen(false);
  };

  // 確保語音 API 可用
  useEffect(() => {
    if ("speechSynthesis" in window) {
      // 某些瀏覽器需要先呼叫一次 getVoices 才能載入語音列表
      window.speechSynthesis.getVoices();
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>日文學習單字本</h1>
        <p>記錄並複習你的日文單字</p>
      </header>

      <main className="app-main">
        <WordList
          key={refreshKey}
          onEditWord={handleEditWord}
          onAddNew={handleAddNew}
        />
      </main>

      {/* 彈窗 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseModal}>
              ×
            </button>
            <WordForm
              onWordAdded={handleWordAdded}
              editingWord={editingWord}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
