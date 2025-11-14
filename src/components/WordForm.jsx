import { useState, useEffect } from 'react';
import { processJapanese } from '../utils/japanese';
import { saveWord, updateWord } from '../utils/storage';
import { CATEGORIES } from '../utils/categories';

const WordForm = ({ onWordAdded, editingWord, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    chinese: '',
    japaneseKanji: '',
    japanese: '',
    romaji: '',
    example: '',
    exampleJapanese: '',
    exampleRomaji: '',
    exampleNote: '',
    category: ''
  });
  const [errors, setErrors] = useState({});

  // 當 editingWord 改變時，預填表單
  useEffect(() => {
    if (editingWord) {
      // 判斷 japanese 是否包含漢字
      const hasKanji = editingWord.japanese && /[\u4e00-\u9faf\u3400-\u4dbf]/.test(editingWord.japanese);
      
      setFormData({
        chinese: editingWord.chinese || '',
        // 如果包含漢字，放在 japaneseKanji；否則放在 japanese
        japaneseKanji: hasKanji ? (editingWord.japanese || '') : '',
        japanese: hasKanji ? '' : (editingWord.japanese || ''),
        romaji: editingWord.romaji || '',
        example: editingWord.example || '',
        exampleJapanese: editingWord.exampleJapanese || '',
        exampleRomaji: editingWord.exampleRomaji || '',
        exampleNote: editingWord.exampleNote || '',
        category: editingWord.category || ''
      });
    } else {
      // 取消編輯時重置表單
      setFormData({
        chinese: '',
        japaneseKanji: '',
        japanese: '',
        romaji: '',
        example: '',
        exampleJapanese: '',
        exampleRomaji: '',
        exampleNote: '',
        category: ''
      });
      setErrors({});
    }
  }, [editingWord]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 清除對應欄位的錯誤
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // 如果輸入日文，自動轉換
    if (name === 'japanese' && value) {
      // 轉換會在提交時處理
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== 表單提交開始 ===');
    console.log('表單資料:', formData);
    
    const newErrors = {};

    // 驗證必填欄位
    if (!formData.chinese.trim()) {
      newErrors.chinese = '請輸入中文翻譯';
    }
    if (!formData.example.trim()) {
      newErrors.example = '請輸入例句';
    }
    if (!formData.category) {
      newErrors.category = '請選擇分類';
    }

    if (Object.keys(newErrors).length > 0) {
      console.log('驗證失敗:', newErrors);
      setErrors(newErrors);
      return;
    }

    // 處理日文轉換
    let japaneseData = {
      japanese: '',
      hiragana: '',
      katakana: '',
      romaji: ''
    };

    // 優先使用日文漢字（如果輸入）
    if (formData.japaneseKanji.trim()) {
      console.log('使用日文漢字:', formData.japaneseKanji.trim());
      try {
        const converted = await processJapanese(formData.japaneseKanji.trim());
        console.log('日文漢字轉換結果:', converted);
        japaneseData = {
          japanese: formData.japaneseKanji.trim(),
          ...converted
        };
        console.log('轉換後的 japaneseData:', japaneseData);
      } catch (error) {
        console.error('轉換失敗:', error);
        // 即使轉換失敗，也儲存原始日文漢字
        japaneseData = {
          japanese: formData.japaneseKanji.trim(),
          hiragana: '',
          katakana: '',
          romaji: ''
        };
      }
    } else if (formData.japanese.trim()) {
      // 如果沒有輸入日文漢字，但有輸入日文，進行轉換
      console.log('開始轉換日文:', formData.japanese.trim());
      try {
        const converted = await processJapanese(formData.japanese.trim());
        console.log('轉換結果:', converted);
        japaneseData = {
          japanese: formData.japanese.trim(),
          ...converted
        };
        console.log('轉換後的 japaneseData:', japaneseData);
      } catch (error) {
        console.error('轉換失敗:', error);
        // 即使轉換失敗，也儲存原始日文
        japaneseData = {
          japanese: formData.japanese.trim(),
          hiragana: '',
          katakana: '',
          romaji: ''
        };
      }
    } else {
      // 如果都沒有輸入，嘗試轉換中文（如果中文是漢字）
      console.log('沒有輸入日文，嘗試轉換中文:', formData.chinese.trim());
      try {
        const converted = await processJapanese(formData.chinese.trim());
        console.log('中文轉換結果:', converted);
        
        // 如果轉換成功（有結果），使用轉換結果
        if (converted.hiragana || converted.katakana || converted.romaji) {
          japaneseData = {
            japanese: formData.chinese.trim(),
            ...converted
          };
        } else {
          // 如果轉換失敗，使用中文作為替代
          japaneseData = {
            japanese: formData.chinese.trim(),
            hiragana: formData.chinese.trim(),
            katakana: formData.chinese.trim(),
            romaji: formData.chinese.trim()
          };
        }
        console.log('轉換後的 japaneseData:', japaneseData);
      } catch (error) {
        console.error('轉換失敗:', error);
        // 轉換失敗時，使用中文作為替代
        japaneseData = {
          japanese: formData.chinese.trim(),
          hiragana: formData.chinese.trim(),
          katakana: formData.chinese.trim(),
          romaji: formData.chinese.trim()
        };
      }
    }

    // 如果用戶在編輯模式下輸入了羅馬拼音，優先使用用戶輸入的
    if (editingWord && formData.romaji.trim()) {
      japaneseData.romaji = formData.romaji.trim();
    }

    // 處理例句轉換
    let exampleData = {
      example: formData.example.trim(),
      exampleJapanese: '',
      exampleRomaji: '',
      exampleNote: formData.exampleNote.trim()
    };

    // 如果用戶在編輯模式下輸入了例句羅馬拼音，優先使用用戶輸入的
    if (editingWord && formData.exampleRomaji.trim()) {
      exampleData.exampleRomaji = formData.exampleRomaji.trim();
    }

    // 如果用戶輸入了例句日文，以用戶輸入為主
    if (formData.exampleJapanese.trim()) {
      try {
        console.log('用戶輸入例句日文:', formData.exampleJapanese.trim());
        // 將用戶輸入的日文轉換為羅馬拼音（如果用戶沒有手動輸入羅馬拼音）
        if (!editingWord || !formData.exampleRomaji.trim()) {
          const exampleConverted = await processJapanese(formData.exampleJapanese.trim());
          console.log('例句日文轉換結果:', exampleConverted);
          
          if (!exampleData.exampleRomaji) {
            exampleData.exampleRomaji = exampleConverted.romaji || '';
          }
        }
        
        exampleData.exampleJapanese = formData.exampleJapanese.trim();
        exampleData.example = formData.example.trim();
        exampleData.exampleNote = formData.exampleNote.trim();
        console.log('使用用戶輸入的例句日文:', exampleData);
      } catch (error) {
        console.error('例句日文轉換失敗:', error);
        exampleData = {
          example: formData.example.trim(),
          exampleJapanese: formData.exampleJapanese.trim(),
          exampleRomaji: exampleData.exampleRomaji || '',
          exampleNote: formData.exampleNote.trim()
        };
      }
    } else if (formData.example.trim()) {
      // 如果沒有輸入例句日文，自動轉換例句
      try {
        console.log('開始轉換例句:', formData.example.trim());
        const exampleConverted = await processJapanese(formData.example.trim());
        console.log('例句轉換結果:', exampleConverted);
        
        // 如果轉換成功，使用轉換結果（但保留用戶手動輸入的羅馬拼音）
        if (exampleConverted.hiragana || exampleConverted.katakana || exampleConverted.romaji) {
          exampleData = {
            example: formData.example.trim(),
            exampleJapanese: exampleConverted.hiragana || exampleConverted.katakana || formData.example.trim(),
            exampleRomaji: exampleData.exampleRomaji || exampleConverted.romaji || '',
            exampleNote: formData.exampleNote.trim()
          };
        } else {
          // 如果轉換失敗，使用原始例句
          exampleData = {
            example: formData.example.trim(),
            exampleJapanese: formData.example.trim(),
            exampleRomaji: exampleData.exampleRomaji || '',
            exampleNote: formData.exampleNote.trim()
          };
        }
        console.log('轉換後的 exampleData:', exampleData);
      } catch (error) {
        console.error('例句轉換失敗:', error);
        exampleData = {
          example: formData.example.trim(),
          exampleJapanese: formData.example.trim(),
          exampleRomaji: exampleData.exampleRomaji || '',
          exampleNote: formData.exampleNote.trim()
        };
      }
    }

    // 建立單字物件
    const newWord = {
      chinese: formData.chinese.trim(),
      category: formData.category,
      ...japaneseData,
      ...exampleData
    };

    console.log('準備儲存的單字:', newWord);

    // 如果是編輯模式，更新單字；否則新增單字
    const savePromise = editingWord 
      ? updateWord(editingWord.id, { ...newWord, id: editingWord.id, createdAt: editingWord.createdAt })
      : saveWord(newWord);

    savePromise
      .then(() => {
        // 通知父元件
        if (onWordAdded) {
          onWordAdded();
        }

        // 如果是編輯模式，取消編輯狀態
        if (editingWord && onCancelEdit) {
          onCancelEdit();
        }

        // 重置表單
        setFormData({
          chinese: '',
          japaneseKanji: '',
          japanese: '',
          romaji: '',
          example: '',
          exampleJapanese: '',
          exampleRomaji: '',
          exampleNote: '',
          category: ''
        });
        setErrors({});
      })
      .catch((error) => {
        console.error('儲存失敗:', error);
        alert(editingWord ? '更新失敗，請稍後再試' : '儲存失敗，請稍後再試');
      });
  };

  return (
    <form onSubmit={handleSubmit} className="word-form">
      <h2>{editingWord ? '編輯單字' : '新增單字'}</h2>
      {editingWord && (
        <button 
          type="button" 
          className="cancel-btn" 
          onClick={onCancelEdit}
        >
          取消編輯
        </button>
      )}
      
      <div className="form-group">
        <label htmlFor="category">
          分類 <span className="required">*</span>
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={errors.category ? 'error' : ''}
        >
          <option value="">請選擇分類</option>
          {CATEGORIES.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && <span className="error-message">{errors.category}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="chinese">
          中文翻譯 <span className="required">*</span>
        </label>
        <input
          type="text"
          id="chinese"
          name="chinese"
          value={formData.chinese}
          onChange={handleChange}
          placeholder="例如：你好"
          className={errors.chinese ? 'error' : ''}
        />
        {errors.chinese && <span className="error-message">{errors.chinese}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="japaneseKanji">日文漢字（選填）</label>
        <input
          type="text"
          id="japaneseKanji"
          name="japaneseKanji"
          value={formData.japaneseKanji}
          onChange={handleChange}
          placeholder="例如：車、食べ物"
        />
        <small className="form-hint">
          如果輸入，將優先使用此欄位進行轉換
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="japanese">日文單字（選填）</label>
        <input
          type="text"
          id="japanese"
          name="japanese"
          value={formData.japanese}
          onChange={handleChange}
          placeholder="例如：こんにちは"
        />
        <small className="form-hint">
          如果未填寫，將使用中文翻譯作為替代
        </small>
      </div>

      {editingWord && (
        <div className="form-group">
          <label htmlFor="romaji">羅馬拼音（選填，可編輯）</label>
          <input
            type="text"
            id="romaji"
            name="romaji"
            value={formData.romaji}
            onChange={handleChange}
            placeholder="例如：densha"
          />
          <small className="form-hint">
            可在音節之間添加空格以便閱讀，例如：den sha
          </small>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="example">
          例句 <span className="required">*</span>
        </label>
        <textarea
          id="example"
          name="example"
          value={formData.example}
          onChange={handleChange}
          placeholder="例如：坐車"
          rows="2"
          className={errors.example ? 'error' : ''}
        />
        {errors.example && <span className="error-message">{errors.example}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="exampleJapanese">例句日文（選填）</label>
        <input
          type="text"
          id="exampleJapanese"
          name="exampleJapanese"
          value={formData.exampleJapanese}
          onChange={handleChange}
          placeholder="例如：車に乗る"
        />
        <small className="form-hint">
          如果填寫，將使用您輸入的日文；如果未填寫，將自動轉換例句
        </small>
      </div>

      {editingWord && (
        <div className="form-group">
          <label htmlFor="exampleRomaji">例句羅馬拼音（選填，可編輯）</label>
          <input
            type="text"
            id="exampleRomaji"
            name="exampleRomaji"
            value={formData.exampleRomaji}
            onChange={handleChange}
            placeholder="例如：denshaninoru"
          />
          <small className="form-hint">
            可在音節之間添加空格以便閱讀，例如：densha ni noru
          </small>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="exampleNote">日文例句備注（選填）</label>
        <textarea
          id="exampleNote"
          name="exampleNote"
          value={formData.exampleNote}
          onChange={handleChange}
          placeholder="例如：備注說明"
          rows="2"
        />
      </div>

      <button type="submit" className="submit-btn">
        {editingWord ? '更新單字' : '儲存單字'}
      </button>
    </form>
  );
};

export default WordForm;

