import { speakJapanese, addSpacesToRomaji } from '../utils/japanese';

const WordCard = ({ word, onDelete, onEdit }) => {
  const handlePlay = () => {
    // 優先播放日文，如果沒有則播放平假名
    const textToSpeak = word.japanese || word.hiragana || word.chinese;
    if (textToSpeak) {
      speakJapanese(textToSpeak);
    }
  };

  const handlePlayExample = () => {
    // 播放例句的日文發音
    const textToSpeak = word.exampleJapanese || word.example || word.chinese;
    if (textToSpeak) {
      speakJapanese(textToSpeak);
    }
  };

  return (
    <div className="word-card">
      <div className="word-card-main">
        <div className="word-card-left">
          <div className="word-header">
            <div className="word-title-section">
              {/* 第一行：分類 + 按鈕 */}
              <div className="word-top-line">
                {word.category && (
                  <span className="word-category">{word.category}</span>
                )}
                <div className="word-actions">
                  <button 
                    className="play-btn" 
                    onClick={handlePlay}
                    aria-label="播放發音"
                    title="播放發音"
                  >
                    🔊
                  </button>
                  {onEdit && (
                    <button 
                      className="edit-btn" 
                      onClick={() => onEdit(word)}
                      aria-label="編輯單字"
                      title="編輯單字"
                    >
                      ✏️
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      className="delete-btn" 
                      onClick={() => onDelete(word.id)}
                      aria-label="刪除單字"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              {/* 第二行：日文漢字 + 羅馬拼音 */}
              <div className="word-japanese-line">
                {word.japanese && 
                 word.japanese.trim() !== '' && 
                 word.japanese !== word.chinese && (
                  <span className="word-japanese">{word.japanese}</span>
                )}
                {word.romaji && 
                 word.romaji.trim() !== '' && 
                 word.romaji !== word.japanese && 
                 word.romaji !== word.chinese && (
                  <span className="word-romaji">{addSpacesToRomaji(word.romaji)}</span>
                )}
              </div>
              {/* 第三行：平假名 */}
              {word.hiragana && 
               word.hiragana.trim() !== '' && 
               word.hiragana !== word.japanese && 
               word.hiragana !== word.chinese && (
                <div className="word-hiragana">{word.hiragana}</div>
              )}
              {/* 第四行：中文 */}
              {word.chinese && (
                <div className="word-chinese">{word.chinese}</div>
              )}
            </div>
          </div>
        </div>

        {word.example && (
          <div className="word-card-right">
            <div className="word-example">
              <div className="example-header">
                <span className="example-label">例句</span>
                {(word.exampleJapanese || word.exampleRomaji) && (
                  <button 
                    className="play-btn-small" 
                    onClick={handlePlayExample}
                    aria-label="播放例句發音"
                    title="播放例句發音"
                  >
                    🔊
                  </button>
                )}
              </div>
              <div className="example-content">
                <div className="example-original">{word.example}</div>
                {word.exampleJapanese && 
                 word.exampleJapanese !== word.example && 
                 word.exampleJapanese.trim() !== '' && (
                  <div className="example-japanese">
                    <span className="example-japanese-label">日文：</span>
                    <span className="example-japanese-text">{word.exampleJapanese}</span>
                  </div>
                )}
                {word.exampleRomaji && 
                 word.exampleRomaji !== word.example && 
                 word.exampleRomaji.trim() !== '' && (
                  <div className="example-romaji">
                    <span className="example-romaji-label">羅馬拼音：</span>
                    <span className="example-romaji-text">{addSpacesToRomaji(word.exampleRomaji)}</span>
                  </div>
                )}
                {word.exampleNote && 
                 word.exampleNote.trim() !== '' && (
                  <div className="example-note">
                    <span className="example-note-label">備注：</span>
                    <span className="example-note-text">{word.exampleNote}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordCard;

