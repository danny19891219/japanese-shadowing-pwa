const {
  useState,
  useEffect,
  useRef
} = React;

// --- 教材資料檔路徑（放置於專案根目錄 data/patterns.json） ---
const PATTERNS_JSON_URL = 'data/patterns.json';

// --- 本地儲存（取代 chrome.storage.local，同步 API + callback 介面以維持相容） ---
const loadStorage = (keys, callback) => {
  const result = {};
  keys.forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw != null) {
      try {
        result[key] = JSON.parse(raw);
      } catch (e) {/* 忽略壞資料 */}
    }
  });
  callback(result);
};
const saveStorage = obj => {
  Object.keys(obj).forEach(key => localStorage.setItem(key, JSON.stringify(obj[key])));
};
function App() {
  // --- 狀態 ---
  const [patterns, setPatterns] = useState([]);
  const [patternsLoadError, setPatternsLoadError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [editingPattern, setEditingPattern] = useState(null);
  const [currentSubstitutions, setCurrentSubstitutions] = useState({});
  const [componentIndices, setComponentIndices] = useState({});
  const [drillMode, setDrillMode] = useState('manual');
  const [isBlind, setIsBlind] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [intervalSeconds, setIntervalSeconds] = useState(3);
  const [loopPlay, setLoopPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userProgress, setUserProgress] = useState({});
  const [activeTab, setActiveTab] = useState('practice');
  // 句型管理分頁：選中的群組
  const [selectedGroupLib, setSelectedGroupLib] = useState(null);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState(null);

  // 新增/編輯表單
  const [newGroup, setNewGroup] = useState('Chapter 03');
  const [newTemplate, setNewTemplate] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newLevel, setNewLevel] = useState('N3');
  const [newComponentsRaw, setNewComponentsRaw] = useState('{\n  "名詞": [\n    { "kanji": "宿題", "kana": "しゅくだい", "meaning": "作業" }\n  ]\n}');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [customModal, setCustomModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // --- Refs（解決 stale closure）---
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const wavePhase = useRef(0);
  const speedRef = useRef(speed);
  const intervalSecondsRef = useRef(intervalSeconds);
  const selectedVoiceRef = useRef(selectedVoice);
  const currentSubstitutionsRef = useRef(currentSubstitutions);
  const selectedPatternRef = useRef(selectedPattern);
  const drillModeRef = useRef(drillMode);
  const loopPlayRef = useRef(loopPlay);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    intervalSecondsRef.current = intervalSeconds;
  }, [intervalSeconds]);
  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);
  useEffect(() => {
    currentSubstitutionsRef.current = currentSubstitutions;
  }, [currentSubstitutions]);
  useEffect(() => {
    selectedPatternRef.current = selectedPattern;
  }, [selectedPattern]);
  useEffect(() => {
    drillModeRef.current = drillMode;
  }, [drillMode]);
  useEffect(() => {
    loopPlayRef.current = loopPlay;
  }, [loopPlay]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // --- 教材資料載入：優先讀本機儲存（使用者曾編輯過），否則讀 data/patterns.json ---
  useEffect(() => {
    loadStorage(['patterns', 'progress'], result => {
      if (result.progress) setUserProgress(result.progress);
      if (result.patterns && result.patterns.length > 0) {
        setPatterns(result.patterns);
        return;
      }
      fetch(PATTERNS_JSON_URL).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }).then(data => {
        const items = Array.isArray(data) ? data : [data];
        const withIds = items.map((item, i) => ({
          id: item.id || `p_file_${i}_${Math.random().toString(36).substr(2, 6)}`,
          group: item.group || 'Chapter 03',
          level: item.level || 'N3',
          template: item.template,
          translation: item.translation || '',
          components: item.components
        }));
        setPatterns(withIds);
      }).catch(err => setPatternsLoadError(err.message));
    });
  }, []);

  // --- 語音包載入 ---
  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const ja = all.filter(v => v.lang.startsWith('ja') || v.lang.includes('JP'));
      setVoices(ja);
      if (ja.length > 0) {
        const google = ja.find(v => v.name.includes('Google') || v.name.includes('日本語'));
        const female = ja.find(v => {
          const n = v.name.toLowerCase();
          return n.includes('nanami') || n.includes('kyoko') || n.includes('haruka') || n.includes('female');
        });
        setSelectedVoice(google || female || ja[0]);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  // --- 切換句型時重設代換槽 ---
  useEffect(() => {
    if (selectedPattern && selectedPattern.components) {
      const defaultSubs = {};
      const defaultIndices = {};
      Object.keys(selectedPattern.components).forEach(key => {
        const list = selectedPattern.components[key];
        if (list && list.length > 0) {
          defaultSubs[key] = list[0];
          defaultIndices[key] = 0;
        }
      });
      setCurrentSubstitutions(defaultSubs);
      setComponentIndices(defaultIndices);
    }
    stopAllPlayback();
  }, [selectedPattern]);

  // 句型管理分頁：開啟時自動選第一個群組
  useEffect(() => {
    if (activeTab === 'library') {
      const groups = Array.from(new Set(patterns.map(p => p.group))).sort();
      if (groups.length > 0 && !selectedGroupLib) setSelectedGroupLib(groups[0]);
    }
  }, [activeTab]);

  // --- Canvas 音波 ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const {
        width,
        height
      } = canvas;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      const waveCount = isPlaying ? 3 : 1;
      const amplitude = isPlaying ? 25 : 3;
      const frequency = isPlaying ? 0.045 : 0.02;
      const speedFactor = isPlaying ? 0.22 : 0.03;
      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.7 - i * 0.25})`;
        ctx.lineWidth = i === 0 ? 3 : 1.5;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * frequency + wavePhase.current + i * 1.5) * amplitude * Math.sin(x * Math.PI / width);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      wavePhase.current += speedFactor;
      animationFrameId.current = requestAnimationFrame(render);
    };
    render();
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying]);

  // --- 工具 ---
  const triggerAlert = (title, message) => setCustomModal({
    show: true,
    title,
    message,
    onConfirm: null
  });
  const triggerConfirm = (title, message, onConfirm) => setCustomModal({
    show: true,
    title,
    message,
    onConfirm
  });

  // conjugations 值支援兩種格式（向下相容）：
  //   舊格式：string "泳がない"
  //   新格式：{ text: "泳がない", kana: "およがない" }
  const getConjValue = raw => {
    if (!raw) return {
      text: '',
      kana: ''
    };
    if (typeof raw === 'string') return {
      text: raw,
      kana: ''
    };
    return {
      text: raw.text || '',
      kana: raw.kana || ''
    };
  };
  const generateVoiceReading = (template, substitutions) => {
    if (!template) return "";
    let s = template;
    Object.keys(substitutions).forEach(key => {
      const item = substitutions[key];
      s = s.replace(new RegExp(`\\[${key}(_([^\\]]+))?\\]`, 'g'), (_, p1, conj) => {
        if (conj && item.conjugations && item.conjugations[conj]) {
          const {
            text,
            kana
          } = getConjValue(item.conjugations[conj]);
          return kana || text; // 優先讀假名；無假名時讀漢字（TTS 引擎自行處理）
        }
        return item.kana || item.kanji;
      });
    });
    return s;
  };
  const generateFullTranslation = (tmpl, substitutions) => {
    if (!tmpl) return "";
    let s = tmpl;
    Object.keys(substitutions).forEach(key => {
      const item = substitutions[key];
      s = s.replace(new RegExp(`\\[${key}(_([^\\]]+))?\\]`, 'g'), () => item.meaning || item.kanji || '');
    });
    return s;
  };

  // --- TTS（支援 drill 串接模式）---
  // isDrillAuto=true 時：語音結束後等待 intervalSeconds，再自動進入下一句
  const speakSentence = (textToSpeak, isDrillAuto = false) => {
    if (!('speechSynthesis' in window)) {
      triggerAlert("語音引擎異常", "您的瀏覽器不支援 Web Speech API。");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (selectedVoiceRef.current) utterance.voice = selectedVoiceRef.current;
    utterance.lang = 'ja-JP';
    utterance.rate = speedRef.current;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      if (isDrillAuto && isPlayingRef.current && drillModeRef.current !== 'manual') {
        // 語音確實唸完後，等待間隔秒數，再切換下一句
        setTimeout(() => {
          if (isPlayingRef.current) triggerSubstitutionDrill();
        }, intervalSecondsRef.current * 1000);
      } else if (!isDrillAuto && loopPlayRef.current && drillModeRef.current === 'manual') {
        setTimeout(() => speakSentence(textToSpeak, false), 800);
      } else if (!isDrillAuto) {
        setIsPlaying(false);
      }
    };
    utterance.onerror = e => {
      // 'interrupted' 是手動停止，不需要改狀態（stopAllPlayback 已處理）
      if (e.error !== 'interrupted') setIsPlaying(false);
    };
    window.speechSynthesis.speak(utterance);
  };
  const stopAllPlayback = () => {
    isPlayingRef.current = false; // 立即更新 ref，避免 setTimeout 中的 stale closure
    setIsPlaying(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };
  const playVoiceTest = () => speakSentence("シャドーイングを練習しましょう！");

  // --- 代換邏輯 ---
  const triggerSubstitutionDrill = () => {
    const pattern = selectedPatternRef.current;
    if (!pattern || !pattern.components) return;
    const keys = Object.keys(pattern.components);
    setComponentIndices(prevIndices => {
      const nextIndices = {
        ...prevIndices
      };
      const nextSubs = {
        ...currentSubstitutionsRef.current
      };
      if (drillModeRef.current === 'vertical') {
        const pk = keys[0];
        if (pk) {
          const list = pattern.components[pk];
          const nextIdx = ((prevIndices[pk] ?? 0) + 1) % list.length;
          nextIndices[pk] = nextIdx;
          nextSubs[pk] = list[nextIdx];
        }
      } else if (drillModeRef.current === 'matrix') {
        keys.forEach(key => {
          const list = pattern.components[key];
          const nextIdx = ((prevIndices[key] ?? 0) + 1) % list.length;
          nextIndices[key] = nextIdx;
          nextSubs[key] = list[nextIdx];
        });
      }
      setCurrentSubstitutions(nextSubs);
      speakSentence(generateVoiceReading(pattern.template, nextSubs), true);
      return nextIndices;
    });
  };
  const quickNextCombination = () => {
    if (!selectedPattern || !selectedPattern.components) return;
    const keys = Object.keys(selectedPattern.components);
    setComponentIndices(prevIndices => {
      const nextIndices = {
        ...prevIndices
      };
      const nextSubs = {
        ...currentSubstitutionsRef.current
      };
      keys.forEach(key => {
        const list = selectedPattern.components[key];
        const nextIdx = ((prevIndices[key] ?? 0) + 1) % list.length;
        nextIndices[key] = nextIdx;
        nextSubs[key] = list[nextIdx];
      });
      setCurrentSubstitutions(nextSubs);
      speakSentence(generateVoiceReading(selectedPattern.template, nextSubs), false);
      return nextIndices;
    });
  };

  // --- 句型 CRUD ---
  const savePatterns = newPatterns => {
    setPatterns(newPatterns);
    saveStorage({
      patterns: newPatterns
    });
  };
  const resetForm = () => {
    setNewTemplate('');
    setNewTranslation('');
    setNewGroup('Chapter 03');
    setNewComponentsRaw('{\n  "名詞": [\n    { "kanji": "宿題", "kana": "しゅくだい", "meaning": "作業" }\n  ]\n}');
    setEditingPattern(null);
  };
  const handleCreateOrUpdatePattern = e => {
    e.preventDefault();
    try {
      const parsedComponents = JSON.parse(newComponentsRaw);
      const patternData = {
        id: editingPattern ? editingPattern.id : `p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        group: newGroup,
        level: newLevel,
        template: newTemplate,
        translation: newTranslation,
        components: parsedComponents
      };
      let updated;
      if (editingPattern) {
        updated = patterns.map(p => p.id === editingPattern.id ? patternData : p);
        triggerAlert("修改成功", "教材句型已更新！");
      } else {
        updated = [...patterns, patternData];
        // 新增後自動切換到該群組顯示
        setSelectedGroupLib(newGroup);
        triggerAlert("建立成功", "已成功建立全新教材卡！");
      }
      savePatterns(updated);
      resetForm();
    } catch (err) {
      triggerAlert("格式錯誤", "Components 欄位必須是正確的 JSON 格式。");
    }
  };
  const exportGroup = groupName => {
    const data = patterns.filter(p => p.group === groupName).map(({
      id,
      ...rest
    }) => rest); // 匯出時不含 id，方便重新匯入

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadowing-${groupName.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const startEditingPattern = pattern => {
    setEditingPattern(pattern);
    setNewGroup(pattern.group || 'Chapter 03');
    setNewTemplate(pattern.template);
    setNewTranslation(pattern.translation);
    setNewLevel(pattern.level || 'N3');
    setNewComponentsRaw(JSON.stringify(pattern.components, null, 2));
    setActiveTab('library');
  };
  const handleDeletePattern = id => {
    triggerConfirm("確定刪除？", "此操作將永久移除此句型。", () => {
      const updated = patterns.filter(p => p.id !== id);
      savePatterns(updated);
      if (selectedPattern && selectedPattern.id === id) setSelectedPattern(null);
      triggerAlert("刪除成功", "教材已移除。");
    });
  };
  const handleJsonImport = () => {
    setImportError(null);
    try {
      const data = JSON.parse(importJsonText);
      const items = Array.isArray(data) ? data : [data];
      const newItems = items.map(item => {
        if (!item.template || !item.components) throw new Error("缺少必要 template 或 components 欄位。");
        return {
          id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          group: item.group || "Chapter 03",
          level: item.level || "N3",
          template: item.template,
          translation: item.translation || "",
          components: item.components
        };
      });
      savePatterns([...patterns, ...newItems]);
      setImportJsonText('');
      triggerAlert("匯入成功", `已成功匯入 ${newItems.length} 個句型！`);
    } catch (err) {
      setImportError(err.message || "不合法的 JSON 結構。");
    }
  };

  // --- 進度 ---
  const toggleProgressMastered = patternId => {
    const next = {
      ...userProgress
    };
    if (next[patternId]) delete next[patternId];else next[patternId] = {
      masteredAt: new Date().toISOString()
    };
    setUserProgress(next);
    saveStorage({
      progress: next
    });
  };

  // --- Ruby 振假名渲染（字級用 clamp() 依螢幕寬度縮放，避免手機窄螢幕爆版）---
  const renderJapaneseRuby = (text, substitutions) => {
    if (!text) return null;
    const parts = [];
    let lastIndex = 0;
    const regex = /\[([^\]]+)\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: text.substring(lastIndex, match.index)
        });
      }
      const [slotBaseName, conjugationType] = match[1].split('_');
      parts.push({
        type: 'slot',
        name: slotBaseName,
        conjugation: conjugationType,
        fullMatch: match[0]
      });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push({
      type: 'text',
      value: text.substring(lastIndex)
    });
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px 0',
        lineHeight: 2.2,
        paddingTop: '12px',
        paddingBottom: '6px'
      }
    }, parts.map((part, index) => {
      if (part.type === 'text') {
        return /*#__PURE__*/React.createElement("span", {
          key: index,
          style: {
            fontSize: 'clamp(1.35rem, 6.5vw, 2.5rem)',
            fontWeight: 700,
            color: '#1e293b',
            padding: '0 2px'
          }
        }, part.value);
      }
      const activeItem = substitutions[part.name];
      if (!activeItem) {
        return /*#__PURE__*/React.createElement("span", {
          key: index,
          style: {
            margin: '0 6px',
            padding: '2px 10px',
            background: '#f0f9ff',
            color: '#38bdf8',
            fontSize: '1.1rem',
            border: '1px dashed #7dd3fc',
            borderRadius: '6px'
          }
        }, part.fullMatch);
      }
      let wordKanji = activeItem.kanji;
      let wordKana = activeItem.kana;
      if (part.conjugation && activeItem.conjugations && activeItem.conjugations[part.conjugation]) {
        const conj = getConjValue(activeItem.conjugations[part.conjugation]);
        wordKanji = conj.text;
        wordKana = conj.kana; // 有 kana 就顯示振假名，沒有就不顯示
      }
      return /*#__PURE__*/React.createElement("span", {
        key: index,
        style: {
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 4px',
          padding: '6px 12px',
          background: '#fff',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(56,189,248,0.12)',
          cursor: 'default'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'block',
          textAlign: 'center',
          lineHeight: 1
        }
      }, /*#__PURE__*/React.createElement("ruby", {
        style: {
          fontSize: 'clamp(1.35rem, 6.5vw, 2.5rem)',
          fontWeight: 800,
          color: '#0284c7',
          rubyPosition: 'over'
        }
      }, wordKanji, wordKana && /*#__PURE__*/React.createElement("rt", {
        style: {
          fontSize: '0.4em',
          letterSpacing: '0.08em',
          color: '#38bdf8',
          fontWeight: 500,
          paddingBottom: '2px'
        }
      }, wordKana))), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '0.68rem',
          color: '#0ea5e9',
          marginTop: '4px',
          opacity: 0.85,
          fontWeight: 700
        }
      }, activeItem.meaning));
    }));
  };
  const groupList = Array.from(new Set(patterns.map(p => p.group))).sort();
  const filteredPatterns = patterns.filter(p => p.group === selectedGroup);
  const NAV_TABS = [['practice', '🚀', '練習室'], ['library', '📚', '教材'], ['import', '📥', '匯入']];

  // ==================== 渲染 ====================
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col min-h-[100dvh] font-sans"
  }, /*#__PURE__*/React.createElement("header", {
    className: "border-b border-sky-100 bg-white/90 backdrop-blur sticky top-0 z-40 px-4 py-3 flex items-center gap-3 shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-400 flex items-center justify-center text-white font-black text-lg shadow-lg"
  }, "\u3042"), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-base font-bold tracking-wide text-slate-800 truncate"
  }, "\u65E5\u8A9E Shadowing \u53E5\u578B\u4EE3\u63DB"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-400 truncate"
  }, patterns.length, " \u500B\u53E5\u578B \xB7 \u719F\u7DF4 ", Object.keys(userProgress).length, " \u500B"))), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 w-full max-w-2xl mx-auto px-3 py-4 pb-28"
  }, activeTab === 'practice' && /*#__PURE__*/React.createElement("div", {
    className: "w-full flex flex-col gap-4"
  }, !selectedGroup ? /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-extrabold text-slate-800"
  }, "\uD83D\uDCD6 \u9078\u64C7\u7279\u8A13\u55AE\u5143"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 mt-1"
  }, "\u9EDE\u64CA\u4E0B\u65B9\u7AE0\u7BC0\u9032\u884C Shadowing \u53E3\u8A9E\u905E\u9032\u4EE3\u63DB\u8A13\u7DF4\u3002")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-3"
  }, groupList.map(groupName => {
    const count = patterns.filter(p => p.group === groupName).length;
    const masteredCount = patterns.filter(p => p.group === groupName && userProgress[p.id]).length;
    const pct = count > 0 ? Math.round(masteredCount / count * 100) : 0;
    return /*#__PURE__*/React.createElement("button", {
      key: groupName,
      onClick: () => {
        setSelectedGroup(groupName);
        const first = patterns.find(p => p.group === groupName);
        if (first) setSelectedPattern(first);
      },
      className: "text-left bg-white active:bg-sky-50 border border-sky-100 active:border-sky-300 p-4 rounded-2xl transition-colors"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between mb-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-xs bg-sky-100 text-sky-600 px-2.5 py-1 rounded-lg border border-sky-200 font-bold font-mono"
    }, groupName), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-500 font-bold"
    }, masteredCount, "/", count, " \u719F\u7DF4")), /*#__PURE__*/React.createElement("div", {
      className: "w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full bg-gradient-to-r from-sky-400 to-blue-400",
      style: {
        width: `${pct}%`
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-sky-500 text-xs font-bold"
    }, /*#__PURE__*/React.createElement("span", null, "\u7ACB\u5373\u958B\u59CB\u7279\u8A13"), /*#__PURE__*/React.createElement("span", null, "\u2192")));
  }), groupList.length === 0 && /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-400 text-center py-8 col-span-full"
  }, patternsLoadError ? `讀取 ${PATTERNS_JSON_URL} 失敗（${patternsLoadError}），請確認檔案是否存在。` : `尚無教材，請確認 ${PATTERNS_JSON_URL} 是否已放入資料。`))) : /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between bg-white px-3 py-2.5 rounded-2xl border border-sky-100 shadow-sm"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      stopAllPlayback();
      setSelectedGroup(null);
      setSelectedPattern(null);
    },
    className: "flex items-center gap-1.5 text-xs font-bold text-slate-500 active:text-sky-600 py-1"
  }, "\u2190 \u7AE0\u7BC0\u5927\u5EF3"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-black text-sky-600 font-mono bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-100"
  }, selectedGroup), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400 font-bold font-mono"
  }, filteredPatterns.findIndex(p => p.id === selectedPattern?.id) + 1, "/", filteredPatterns.length))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3"
  }, filteredPatterns.map((item, idx) => /*#__PURE__*/React.createElement("button", {
    key: item.id,
    onClick: () => {
      stopAllPlayback();
      setSelectedPattern(item);
    },
    className: `px-3.5 py-2 text-xs font-bold rounded-xl border shrink-0 transition flex items-center gap-1.5 ${selectedPattern?.id === item.id ? 'bg-gradient-to-r from-sky-400 to-blue-500 border-sky-400 text-white shadow-md' : 'bg-white border-sky-100 text-slate-500'}`
  }, userProgress[item.id] && /*#__PURE__*/React.createElement("span", {
    className: "w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
  }), /*#__PURE__*/React.createElement("span", null, "\u53E5\u578B ", idx + 1)))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-sky-100 rounded-3xl p-4 flex flex-col gap-4 shadow-lg"
  }, selectedPattern ? /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 border-b border-sky-50 pb-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-sky-400 animate-ping"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-sky-600 font-bold uppercase tracking-widest font-mono"
  }, drillMode === 'manual' ? '🎯 手動自由代換' : drillMode === 'vertical' ? '🔄 縱向循序代換中' : '🔀 橫向交叉循序中')), /*#__PURE__*/React.createElement("div", {
    className: "bg-sky-50/30 rounded-2xl border border-sky-100 p-4 flex flex-col items-center justify-center min-h-[160px] shadow-inner"
  }, isBlind ? /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center gap-3 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center border border-sky-200 text-sky-400"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-6 h-6",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2,
    d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-sky-500 text-xs font-bold"
  }, "\u76F2\u807D\u8DDF\u8B80\u6A21\u5F0F\uFF08\u5B57\u5E55\u5DF2\u96B1\u85CF\uFF09"), /*#__PURE__*/React.createElement("p", {
    className: "text-xl font-extrabold text-slate-700"
  }, generateFullTranslation(selectedPattern.translation, currentSubstitutions))) : /*#__PURE__*/React.createElement("div", {
    className: "text-center w-full"
  }, renderJapaneseRuby(selectedPattern.template, currentSubstitutions), /*#__PURE__*/React.createElement("div", {
    className: "h-px bg-sky-100 w-1/3 mx-auto my-2.5"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-600 text-sm font-bold font-mono leading-relaxed"
  }, generateFullTranslation(selectedPattern.translation, currentSubstitutions))), /*#__PURE__*/React.createElement("div", {
    className: "w-full h-12 mt-4 overflow-hidden rounded-xl bg-white border border-sky-100"
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    width: 600,
    height: 48,
    className: "w-full h-full"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, isPlaying ? /*#__PURE__*/React.createElement("button", {
    onClick: stopAllPlayback,
    className: "flex-1 py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 bg-red-500 active:bg-red-600 text-white shadow-lg"
  }, "\u25A0 \u505C\u6B62\u64AD\u653E") : /*#__PURE__*/React.createElement("button", {
    onClick: () => speakSentence(generateVoiceReading(selectedPattern.template, currentSubstitutions), false),
    className: "flex-1 py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg"
  }, "\u25B6 \u55AE\u53E5\u767C\u97F3"), /*#__PURE__*/React.createElement("button", {
    onClick: quickNextCombination,
    className: "shrink-0 px-5 py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-600 active:bg-sky-100 shadow-sm"
  }, "\u4E0B\u4E00\u7D44 \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setLoopPlay(!loopPlay),
    className: `py-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-0.5 transition ${loopPlay ? 'bg-sky-100 border-sky-300 text-sky-600' : 'bg-white border-sky-100 text-slate-500'}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base"
  }, "\uD83D\uDD01"), "\u55AE\u53E5\u5FAA\u74B0 ", loopPlay ? 'ON' : 'OFF'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsBlind(!isBlind),
    className: `py-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-0.5 transition ${isBlind ? 'bg-sky-100 border-sky-300 text-sky-600' : 'bg-white border-sky-100 text-slate-500'}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-base"
  }, "\uD83D\uDE48"), "\u76F2\u807D ", isBlind ? 'ON' : 'OFF')), /*#__PURE__*/React.createElement("details", {
    className: "bg-sky-50/20 rounded-2xl border border-sky-100 overflow-hidden"
  }, /*#__PURE__*/React.createElement("summary", {
    className: "px-4 py-3 text-xs font-extrabold text-slate-500 cursor-pointer select-none"
  }, "\u2699\uFE0F \u64AD\u653E\u8A2D\u5B9A\uFF08\u901F\u5EA6\u30FB\u9593\u9694\u30FB\u8A9E\u97F3\uFF09"), /*#__PURE__*/React.createElement("div", {
    className: "px-4 pb-4 flex flex-col gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-500 font-bold"
  }, "\u8DDF\u8B80\u901F\u5EA6 (", speed, "x)"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-mono text-sky-500 font-extrabold"
  }, speed === 1.0 ? "標準" : speed < 1.0 ? "慢速精聽" : "快速特訓")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0.5",
    max: "1.5",
    step: "0.1",
    value: speed,
    onChange: e => setSpeed(parseFloat(e.target.value)),
    className: "w-full accent-sky-400 h-2 rounded-lg cursor-pointer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mt-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-500 font-bold"
  }, "\u53E5\u9593\u9593\u9694 (", intervalSeconds, "s)"), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-mono text-sky-400"
  }, "\u8A9E\u97F3\u5538\u5B8C\u5F8C\u7B49\u5F85")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "1",
    max: "10",
    step: "1",
    value: intervalSeconds,
    onChange: e => setIntervalSeconds(parseInt(e.target.value)),
    className: "w-full accent-sky-400 h-2 rounded-lg cursor-pointer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-slate-400 font-bold"
  }, "\u65E5\u6587\u8A9E\u97F3\u5305"), /*#__PURE__*/React.createElement("button", {
    onClick: playVoiceTest,
    className: "text-xs text-sky-500 font-extrabold"
  }, "\uD83D\uDD0A \u8A9E\u97F3\u6E2C\u8A66")), /*#__PURE__*/React.createElement("select", {
    value: selectedVoice?.name || '',
    onChange: e => {
      const v = voices.find(v => v.name === e.target.value);
      if (v) setSelectedVoice(v);
    },
    className: "w-full bg-white border border-sky-100 rounded-lg px-2 py-2 text-sm text-slate-500 focus:outline-none font-mono shadow-sm"
  }, voices.map((v, i) => /*#__PURE__*/React.createElement("option", {
    key: i,
    value: v.name
  }, "\uD83D\uDC67 ", v.name, " (", v.lang, ")")))))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-2.5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-xs text-slate-400 font-extrabold tracking-wider"
  }, "\u9078\u64C7\u4EE3\u63DB\u7279\u8A13\u6A21\u5F0F"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-2"
  }, [{
    mode: 'manual',
    icon: '🎯',
    title: '手動自由代換',
    desc: '點選下方單字確認語句配對'
  }, {
    mode: 'vertical',
    icon: '🔄',
    title: '縱向遞進代換',
    desc: '語音唸完 + 間隔秒數後自動切換主槽'
  }, {
    mode: 'matrix',
    icon: '🔀',
    title: '橫向交叉遞進',
    desc: '語音唸完 + 間隔秒數後所有槽同步跳格'
  }].map(({
    mode,
    icon,
    title,
    desc
  }) => /*#__PURE__*/React.createElement("button", {
    key: mode,
    onClick: () => {
      setDrillMode(mode);
      if (mode === 'manual') {
        stopAllPlayback();
      } else {
        isPlayingRef.current = true;
        setIsPlaying(true);
        triggerSubstitutionDrill();
      }
    },
    className: `p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${drillMode === mode ? 'bg-white border-sky-400 text-slate-700 shadow-md' : 'bg-sky-50/30 border-sky-100 text-slate-500'}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl shrink-0"
  }, icon), /*#__PURE__*/React.createElement("span", {
    className: "flex flex-col"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-sm"
  }, title), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-slate-400"
  }, desc)))))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-4 border-t border-sky-100 pt-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-extrabold text-slate-600"
  }, "\uD83E\uDDE9 \u4EE3\u63DB\u5B57\u5361\u5EAB"), Object.keys(selectedPattern.components).map(categoryName => {
    const list = selectedPattern.components[categoryName];
    const activeItem = currentSubstitutions[categoryName];
    return /*#__PURE__*/React.createElement("div", {
      key: categoryName,
      className: "flex flex-col gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-extrabold text-sky-600 uppercase tracking-widest"
    }, categoryName, " \u69FD"), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2 overflow-x-auto pb-1 -mx-3 px-3"
    }, list.map((item, i) => {
      const isActive = activeItem?.kanji === item.kanji;
      return /*#__PURE__*/React.createElement("button", {
        key: i,
        onClick: () => {
          setComponentIndices(prev => ({
            ...prev,
            [categoryName]: i
          }));
          const newSubs = {
            ...currentSubstitutions,
            [categoryName]: item
          };
          setCurrentSubstitutions(newSubs);
          if (drillMode === 'manual') {
            speakSentence(generateVoiceReading(selectedPattern.template, newSubs), false);
          }
        },
        className: `shrink-0 text-left px-3.5 py-2 rounded-xl text-xs font-bold transition flex flex-col gap-0.5 border min-w-[92px] ${isActive ? 'bg-sky-500 border-sky-400 text-white shadow-sm' : 'bg-white border-sky-100 text-slate-600'}`
      }, /*#__PURE__*/React.createElement("span", {
        className: "font-mono"
      }, item.kanji), /*#__PURE__*/React.createElement("span", {
        className: `text-[10px] ${isActive ? 'text-sky-100' : 'text-slate-400'}`
      }, item.meaning));
    })));
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 border-t border-sky-100 pt-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => toggleProgressMastered(selectedPattern.id),
    className: `flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${userProgress[selectedPattern.id] ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-sky-50/50 border border-sky-100 text-slate-500'}`
  }, "\u2713 ", userProgress[selectedPattern.id] ? "已熟練！" : "標記為已熟練"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      stopAllPlayback();
      const idx = filteredPatterns.findIndex(p => p.id === selectedPattern.id);
      setSelectedPattern(filteredPatterns[idx < filteredPatterns.length - 1 ? idx + 1 : 0]);
    },
    className: "flex-1 bg-gradient-to-r from-sky-400 to-blue-500 px-3 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow"
  }, /*#__PURE__*/React.createElement("span", null, "\u4E0B\u4E00\u984C"), /*#__PURE__*/React.createElement("span", null, "\u2192")))) : /*#__PURE__*/React.createElement("div", {
    className: "text-center py-12 text-slate-400 font-bold"
  }, "\u672C\u55AE\u5143\u7121\u53EF\u7528\u6559\u6750\u53E5\u578B\u3002")))), activeTab === 'library' && /*#__PURE__*/React.createElement("div", {
    className: "w-full flex flex-col gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full bg-white border border-sky-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-extrabold text-slate-800 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", null, editingPattern ? '📝 編輯句型' : '➕ 建立新教材卡'), editingPattern && /*#__PURE__*/React.createElement("button", {
    onClick: resetForm,
    className: "text-xs text-slate-400 font-bold"
  }, "\u53D6\u6D88\u7DE8\u8F2F")), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleCreateOrUpdatePattern,
    className: "flex flex-col gap-4 text-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 font-bold mb-1.5"
  }, "\u55AE\u5143\u7FA4\u7D44\uFF08\u9078\u64C7\u65E2\u6709\u6216\u8F38\u5165\u65B0\u540D\u7A31\uFF09"), /*#__PURE__*/React.createElement("input", {
    list: "group-datalist",
    value: newGroup,
    onChange: e => setNewGroup(e.target.value),
    placeholder: "e.g. Chapter 05",
    className: "w-full bg-slate-50 border border-sky-100 rounded-lg px-3 py-2.5 text-base text-slate-700 focus:outline-none focus:border-sky-400 font-bold font-mono",
    required: true
  }), /*#__PURE__*/React.createElement("datalist", {
    id: "group-datalist"
  }, groupList.map(g => /*#__PURE__*/React.createElement("option", {
    key: g,
    value: g
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 font-bold mb-1.5"
  }, "\u65E5\u6AA2\u96E3\u5EA6"), /*#__PURE__*/React.createElement("select", {
    value: newLevel,
    onChange: e => setNewLevel(e.target.value),
    className: "w-full bg-slate-50 border border-sky-100 rounded-lg px-3 py-2.5 text-base text-slate-700 focus:outline-none focus:border-sky-400 font-bold"
  }, ['N5', 'N4', 'N3', 'N2', 'N1'].map(l => /*#__PURE__*/React.createElement("option", {
    key: l,
    value: l
  }, l)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 font-bold mb-1.5"
  }, "\u53E5\u578B\u6A21\u677F"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "\u3042\u307E\u308A [\u5C0D\u8C61] \u3068 [\u52D5\u8A5E_\u306A\u3044\u5F62]\u3002",
    value: newTemplate,
    onChange: e => setNewTemplate(e.target.value),
    className: "w-full bg-slate-50 border border-sky-100 rounded-lg px-3 py-2.5 text-base text-slate-700 focus:outline-none focus:border-sky-400 font-bold font-mono",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 font-bold mb-1.5"
  }, "\u4E2D\u6587\u7FFB\u8B6F"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "\u4E0D\u592A\u8DDF [\u5C0D\u8C61] \u4E00\u8D77 [\u52D5\u8A5E]\u3002",
    value: newTranslation,
    onChange: e => setNewTranslation(e.target.value),
    className: "w-full bg-slate-50 border border-sky-100 rounded-lg px-3 py-2.5 text-base text-slate-700 focus:outline-none focus:border-sky-400 font-bold font-mono",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 font-bold mb-1.5"
  }, "\u4EE3\u63DB\u5143\u4EF6\u5EAB JSON"), /*#__PURE__*/React.createElement("textarea", {
    rows: "6",
    value: newComponentsRaw,
    onChange: e => setNewComponentsRaw(e.target.value),
    className: "w-full bg-slate-50 border border-sky-100 rounded-lg p-3 text-sm text-slate-600 focus:outline-none focus:border-sky-400 font-mono",
    required: true
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "w-full py-3 bg-gradient-to-r from-sky-400 to-blue-500 font-bold text-white rounded-xl shadow"
  }, editingPattern ? '儲存更新' : '建立教材句型卡'))), /*#__PURE__*/React.createElement("div", {
    className: "w-full bg-white border border-sky-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between gap-2"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-extrabold text-slate-800"
  }, "\uD83D\uDCDA \u672C\u5730\u6559\u6750\u5EAB (", patterns.length, ")"), selectedGroupLib && patterns.filter(p => p.group === selectedGroupLib).length > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => exportGroup(selectedGroupLib),
    className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 shrink-0"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "w-3.5 h-3.5",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2,
    d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
  })), "\u532F\u51FA")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 border-b border-sky-50"
  }, groupList.map(g => /*#__PURE__*/React.createElement("button", {
    key: g,
    onClick: () => setSelectedGroupLib(g),
    className: `px-3 py-1.5 rounded-xl text-xs font-bold border transition shrink-0 ${selectedGroupLib === g ? 'bg-sky-500 text-white border-sky-500 shadow' : 'bg-sky-50 text-sky-600 border-sky-200'}`
  }, g, /*#__PURE__*/React.createElement("span", {
    className: "ml-1.5 text-xs opacity-70"
  }, "(", patterns.filter(p => p.group === g).length, ")"))), groupList.length === 0 && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400 italic"
  }, "\u5C1A\u7121\u7FA4\u7D44\uFF0C\u8ACB\u5148\u5EFA\u7ACB\u6559\u6750\u5361\u3002")), selectedGroupLib ? /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-3"
  }, patterns.filter(p => p.group === selectedGroupLib).length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-400 text-center py-8"
  }, "\u6B64\u7FA4\u7D44\u76EE\u524D\u7121\u53E5\u578B\u3002") : patterns.filter(p => p.group === selectedGroupLib).map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "p-3.5 bg-sky-50/10 border border-sky-100 rounded-xl flex flex-col gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold"
  }, item.level), userProgress[item.id] && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded"
  }, "\u2713 \u719F\u7DF4")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => startEditingPattern(item),
    className: "text-xs text-sky-600 bg-sky-50 px-2.5 py-1.5 rounded-lg font-bold"
  }, "\u7DE8\u8F2F"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDeletePattern(item.id),
    className: "text-xs text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg font-bold"
  }, "\u522A\u9664"))), /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-bold text-slate-700 font-mono"
  }, item.template), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, item.translation)))) : /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-400 text-center py-8"
  }, "\u8ACB\u5F9E\u4E0A\u65B9\u9078\u64C7\u4E00\u500B\u55AE\u5143\u7FA4\u7D44\u3002"))), activeTab === 'import' && /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-sky-100 rounded-3xl p-4 shadow-sm flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-extrabold text-slate-800"
  }, "\uD83D\uDCE5 JSON \u6279\u6B21\u532F\u5165"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 leading-relaxed"
  }, "\u8CBC\u4E0A\u6559\u6750 JSON \u9663\u5217\uFF08\u53EF\u7701\u7565 id\uFF09\uFF0C\u532F\u5165\u5F8C\u81EA\u52D5\u5132\u5B58\u81F3\u672C\u6A5F\uFF08localStorage\uFF09\u3002"), /*#__PURE__*/React.createElement("textarea", {
    rows: "10",
    placeholder: '[\n  {\n    "group": "Chapter 03",\n    "level": "N3",\n    "template": "一緒に [動詞_意向形]。",\n    "translation": "一起...吧。",\n    "components": {\n      "動詞": [\n        {\n          "kanji": "泳ぐ",\n          "kana": "およぐ",\n          "meaning": "游泳",\n          "conjugations": {\n            "意向形": { "text": "泳ごう", "kana": "およごう" }\n          }\n        }\n      ]\n    }\n  }\n]',
    value: importJsonText,
    onChange: e => setImportJsonText(e.target.value),
    className: "w-full bg-slate-50 border border-sky-100 rounded-xl p-3 text-sm text-slate-600 focus:outline-none focus:border-sky-400 font-mono shadow-inner"
  }), importError && /*#__PURE__*/React.createElement("div", {
    className: "bg-red-50 border border-red-200 text-red-500 text-xs p-3 rounded-lg font-mono"
  }, "\u274C ", importError), /*#__PURE__*/React.createElement("button", {
    onClick: handleJsonImport,
    disabled: !importJsonText,
    className: "w-full py-3 bg-gradient-to-r from-sky-400 to-blue-500 disabled:opacity-50 font-bold text-sm text-white rounded-xl shadow"
  }, "\u89E3\u6790\u4E26\u5132\u5B58\u81F3\u672C\u6A5F"))), /*#__PURE__*/React.createElement("nav", {
    className: "fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-sky-100 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-2xl mx-auto grid grid-cols-3"
  }, NAV_TABS.map(([tab, icon, label]) => /*#__PURE__*/React.createElement("button", {
    key: tab,
    onClick: () => {
      setActiveTab(tab);
      if (tab === 'library') setEditingPattern(null);
    },
    className: `flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold transition ${activeTab === tab ? 'text-sky-500' : 'text-slate-400'}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl leading-none"
  }, icon), label)))), customModal.show && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-sky-100 rounded-2xl max-w-md w-full p-5 shadow-2xl"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-bold text-slate-800 mb-2"
  }, customModal.title), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500 text-sm mb-6 leading-relaxed"
  }, customModal.message), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-end gap-3 text-sm font-bold"
  }, customModal.onConfirm ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCustomModal({
      show: false,
      title: '',
      message: '',
      onConfirm: null
    }),
    className: "px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl"
  }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      customModal.onConfirm();
      setCustomModal({
        show: false,
        title: '',
        message: '',
        onConfirm: null
      });
    },
    className: "px-4 py-2.5 bg-sky-500 text-white rounded-xl"
  }, "\u78BA\u8A8D")) : /*#__PURE__*/React.createElement("button", {
    onClick: () => setCustomModal({
      show: false,
      title: '',
      message: '',
      onConfirm: null
    }),
    className: "px-5 py-2.5 bg-sky-500 text-white rounded-xl"
  }, "\u78BA\u8A8D")))));
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(/*#__PURE__*/React.createElement(App, null));
