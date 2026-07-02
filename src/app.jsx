const { useState, useEffect, useRef } = React;

// --- 預設內建教材題庫 ---
const DEFAULT_PATTERNS = [
  {
    id: "p_default_001",
    group: "Chapter 03",
    level: "N3",
    template: "あまり [動詞_ない形]。",
    translation: "不太 [動詞]。",
    components: {
      "動詞": [
        { "kanji": "泳ぐ", "kana": "およぐ", "meaning": "游泳", "conjugations": { "ない形": { "text": "泳がない", "kana": "およがない" }, "意向形": { "text": "泳ごう", "kana": "およごう" } } },
        { "kanji": "遊ぶ", "kana": "あそぶ", "meaning": "玩樂", "conjugations": { "ない形": { "text": "遊ばない", "kana": "あそばない" }, "意向形": { "text": "遊ぼう", "kana": "あそぼう" } } },
        { "kanji": "走る", "kana": "はしる", "meaning": "跑步", "conjugations": { "ない形": { "text": "走らない", "kana": "はしらない" }, "意向形": { "text": "走ろう", "kana": "はしろう" } } },
        { "kanji": "絵本を読む", "kana": "えほんをよむ", "meaning": "讀繪本", "conjugations": { "ない形": { "text": "絵本を読まない", "kana": "えほんをよまない" }, "意向形": { "text": "絵本を読もう", "kana": "えほんをよもう" } } }
      ]
    }
  },
  {
    id: "p_default_002",
    group: "Chapter 03",
    level: "N3",
    template: "あまり [對象] と [動詞_ない形]。",
    translation: "不太跟 [對象] 一起 [動詞]。",
    components: {
      "對象": [
        { "kanji": "彼ら", "kana": "かれら", "meaning": "他們" },
        { "kanji": "彼女", "kana": "かのじょ", "meaning": "她" },
        { "kanji": "彼女たち", "kana": "かのじょたち", "meaning": "她們" },
        { "kanji": "子供たち", "kana": "こどもたち", "meaning": "孩子們" }
      ],
      "動詞": [
        { "kanji": "泳ぐ", "kana": "およぐ", "meaning": "游泳", "conjugations": { "ない形": { "text": "泳がない", "kana": "およがない" }, "意向形": { "text": "泳ごう", "kana": "およごう" } } },
        { "kanji": "遊ぶ", "kana": "あそぶ", "meaning": "玩樂", "conjugations": { "ない形": { "text": "遊ばない", "kana": "あそばない" }, "意向形": { "text": "遊ぼう", "kana": "あそぼう" } } },
        { "kanji": "走る", "kana": "はしる", "meaning": "跑步", "conjugations": { "ない形": { "text": "走らない", "kana": "はしらない" }, "意向形": { "text": "走ろう", "kana": "はしろう" } } },
        { "kanji": "絵本を読む", "kana": "えほんをよむ", "meaning": "讀繪本", "conjugations": { "ない形": { "text": "絵本を読まない", "kana": "えほんをよまない" }, "意向形": { "text": "絵本を読もう", "kana": "えほんをよもう" } } }
      ]
    }
  },
  {
    id: "p_default_003",
    group: "Chapter 03",
    level: "N3",
    template: "[時間] は、あまり [對象] と [動詞_ない形]。",
    translation: "[時間] 不太跟 [對象] 一起 [動詞]。",
    components: {
      "時間": [
        { "kanji": "最近", "kana": "さいきん", "meaning": "最近" },
        { "kanji": "今週", "kana": "こんしゅう", "meaning": "這禮拜" },
        { "kanji": "今月", "kana": "こんげつ", "meaning": "這個月" },
        { "kanji": "今年", "kana": "ことし", "meaning": "今年" }
      ],
      "對象": [
        { "kanji": "彼ら", "kana": "かれら", "meaning": "他們" },
        { "kanji": "彼女", "kana": "かのじょ", "meaning": "她" },
        { "kanji": "彼女たち", "kana": "かのじょたち", "meaning": "她們" },
        { "kanji": "子供と絵本", "kana": "こどもとえほん", "meaning": "孩子與繪本" }
      ],
      "動詞": [
        { "kanji": "泳ぐ", "kana": "およぐ", "meaning": "游泳", "conjugations": { "ない形": { "text": "泳がない", "kana": "およがない" }, "意向形": { "text": "泳ごう", "kana": "およごう" } } },
        { "kanji": "遊ぶ", "kana": "あそぶ", "meaning": "玩樂", "conjugations": { "ない形": { "text": "遊ばない", "kana": "あそばない" }, "意向形": { "text": "遊ぼう", "kana": "あそぼう" } } },
        { "kanji": "走る", "kana": "はしる", "meaning": "跑步", "conjugations": { "ない形": { "text": "走らない", "kana": "はしらない" }, "意向形": { "text": "走ろう", "kana": "はしろう" } } },
        { "kanji": "読む", "kana": "よむ", "meaning": "讀", "conjugations": { "ない形": { "text": "読まない", "kana": "よまない" }, "意向形": { "text": "読もう", "kana": "よもう" } } }
      ]
    }
  },
  {
    id: "p_default_004",
    group: "Chapter 03",
    level: "N3",
    template: "[時間] は、[對象] と 一緒に [動詞_意向形]。",
    translation: "[時間] 跟 [對象] 一起 [動詞] 吧。",
    components: {
      "時間": [
        { "kanji": "次", "kana": "つぎ", "meaning": "下次" },
        { "kanji": "来週", "kana": "らいしゅう", "meaning": "下禮拜" },
        { "kanji": "来月", "kana": "らいげつ", "meaning": "下個月" },
        { "kanji": "来年", "kana": "らいねん", "meaning": "明年" }
      ],
      "對象": [
        { "kanji": "私たち", "kana": "わたしたち", "meaning": "我們" },
        { "kanji": "僕ら", "kana": "ぼくら", "meaning": "我們(男稱)" },
        { "kanji": "子供たち", "kana": "こどもたち", "meaning": "孩子們" }
      ],
      "動詞": [
        { "kanji": "泳ぐ", "kana": "およぐ", "meaning": "游泳", "conjugations": { "ない形": { "text": "泳がない", "kana": "およがない" }, "意向形": { "text": "泳ごう", "kana": "およごう" } } },
        { "kanji": "遊ぶ", "kana": "あそぶ", "meaning": "玩樂", "conjugations": { "ない形": { "text": "遊ばない", "kana": "あそばない" }, "意向形": { "text": "遊ぼう", "kana": "あそぼう" } } },
        { "kanji": "走る", "kana": "はしる", "meaning": "跑步", "conjugations": { "ない形": { "text": "走らない", "kana": "はしらない" }, "意向形": { "text": "走ろう", "kana": "はしろう" } } }
      ]
    }
  },
  {
    id: "p_default_005",
    group: "Chapter 04",
    level: "N3",
    template: "[事物] が [形容詞] そうですね。",
    translation: "[事物] 看起來很 [形容詞] 呢。",
    components: {
      "事物": [
        { "kanji": "このリンゴ", "kana": "このりんご", "meaning": "這顆蘋果" },
        { "kanji": "彼女の料理", "kana": "かのじょのりょうり", "meaning": "她的料理" },
        { "kanji": "あの映画", "kana": "あのえいが", "meaning": "那部電影" }
      ],
      "形容詞": [
        { "kanji": "美味しい", "kana": "おいしい", "meaning": "好吃" },
        { "kanji": "面白い", "kana": "おもしろい", "meaning": "有趣" },
        { "kanji": "楽しい", "kana": "たのしい", "meaning": "開心" }
      ]
    }
  }
];

// --- 本地儲存（取代 chrome.storage.local，同步 API + callback 介面以維持相容） ---
const loadStorage = (keys, callback) => {
  const result = {};
  keys.forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw != null) {
      try { result[key] = JSON.parse(raw); } catch (e) { /* 忽略壞資料 */ }
    }
  });
  callback(result);
};
const saveStorage = (obj) => {
  Object.keys(obj).forEach(key => localStorage.setItem(key, JSON.stringify(obj[key])));
};

function App() {
  // --- 狀態 ---
  const [patterns, setPatterns] = useState(DEFAULT_PATTERNS);
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
  const [customModal, setCustomModal] = useState({ show: false, title: '', message: '', onConfirm: null });

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

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { intervalSecondsRef.current = intervalSeconds; }, [intervalSeconds]);
  useEffect(() => { selectedVoiceRef.current = selectedVoice; }, [selectedVoice]);
  useEffect(() => { currentSubstitutionsRef.current = currentSubstitutions; }, [currentSubstitutions]);
  useEffect(() => { selectedPatternRef.current = selectedPattern; }, [selectedPattern]);
  useEffect(() => { drillModeRef.current = drillMode; }, [drillMode]);
  useEffect(() => { loopPlayRef.current = loopPlay; }, [loopPlay]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // --- 本地儲存初始載入 ---
  useEffect(() => {
    loadStorage(['patterns', 'progress'], (result) => {
      if (result.patterns && result.patterns.length > 0) setPatterns(result.patterns);
      if (result.progress) setUserProgress(result.progress);
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
      const { width, height } = canvas;

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
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [isPlaying]);

  // --- 工具 ---
  const triggerAlert = (title, message) => setCustomModal({ show: true, title, message, onConfirm: null });
  const triggerConfirm = (title, message, onConfirm) => setCustomModal({ show: true, title, message, onConfirm });

  // conjugations 值支援兩種格式（向下相容）：
  //   舊格式：string "泳がない"
  //   新格式：{ text: "泳がない", kana: "およがない" }
  const getConjValue = (raw) => {
    if (!raw) return { text: '', kana: '' };
    if (typeof raw === 'string') return { text: raw, kana: '' };
    return { text: raw.text || '', kana: raw.kana || '' };
  };

  const generateVoiceReading = (template, substitutions) => {
    if (!template) return "";
    let s = template;
    Object.keys(substitutions).forEach(key => {
      const item = substitutions[key];
      s = s.replace(new RegExp(`\\[${key}(_([^\\]]+))?\\]`, 'g'), (_, p1, conj) => {
        if (conj && item.conjugations && item.conjugations[conj]) {
          const { text, kana } = getConjValue(item.conjugations[conj]);
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

    utterance.onerror = (e) => {
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
      const nextIndices = { ...prevIndices };
      const nextSubs = { ...currentSubstitutionsRef.current };

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
      const nextIndices = { ...prevIndices };
      const nextSubs = { ...currentSubstitutionsRef.current };

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
  const savePatterns = (newPatterns) => {
    setPatterns(newPatterns);
    saveStorage({ patterns: newPatterns });
  };

  const resetForm = () => {
    setNewTemplate('');
    setNewTranslation('');
    setNewGroup('Chapter 03');
    setNewComponentsRaw('{\n  "名詞": [\n    { "kanji": "宿題", "kana": "しゅくだい", "meaning": "作業" }\n  ]\n}');
    setEditingPattern(null);
  };

  const handleCreateOrUpdatePattern = (e) => {
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

  const exportGroup = (groupName) => {
    const data = patterns
      .filter(p => p.group === groupName)
      .map(({ id, ...rest }) => rest); // 匯出時不含 id，方便重新匯入

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadowing-${groupName.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startEditingPattern = (pattern) => {
    setEditingPattern(pattern);
    setNewGroup(pattern.group || 'Chapter 03');
    setNewTemplate(pattern.template);
    setNewTranslation(pattern.translation);
    setNewLevel(pattern.level || 'N3');
    setNewComponentsRaw(JSON.stringify(pattern.components, null, 2));
    setActiveTab('library');
  };

  const handleDeletePattern = (id) => {
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
  const toggleProgressMastered = (patternId) => {
    const next = { ...userProgress };
    if (next[patternId]) delete next[patternId];
    else next[patternId] = { masteredAt: new Date().toISOString() };
    setUserProgress(next);
    saveStorage({ progress: next });
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
        parts.push({ type: 'text', value: text.substring(lastIndex, match.index) });
      }
      const [slotBaseName, conjugationType] = match[1].split('_');
      parts.push({ type: 'slot', name: slotBaseName, conjugation: conjugationType, fullMatch: match[0] });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push({ type: 'text', value: text.substring(lastIndex) });

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '4px 0', lineHeight: 2.2, paddingTop: '12px', paddingBottom: '6px' }}>
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <span key={index} style={{ fontSize: 'clamp(1.35rem, 6.5vw, 2.5rem)', fontWeight: 700, color: '#1e293b', padding: '0 2px' }}>
                {part.value}
              </span>
            );
          }

          const activeItem = substitutions[part.name];
          if (!activeItem) {
            return (
              <span key={index} style={{ margin: '0 6px', padding: '2px 10px', background: '#f0f9ff', color: '#38bdf8', fontSize: '1.1rem', border: '1px dashed #7dd3fc', borderRadius: '6px' }}>
                {part.fullMatch}
              </span>
            );
          }

          let wordKanji = activeItem.kanji;
          let wordKana = activeItem.kana;
          if (part.conjugation && activeItem.conjugations && activeItem.conjugations[part.conjugation]) {
            const conj = getConjValue(activeItem.conjugations[part.conjugation]);
            wordKanji = conj.text;
            wordKana = conj.kana; // 有 kana 就顯示振假名，沒有就不顯示
          }

          return (
            <span
              key={index}
              style={{
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
              }}
            >
              {/* ruby 單獨佔一層，不在 flex-col 裡混排 */}
              <span style={{ display: 'block', textAlign: 'center', lineHeight: 1 }}>
                <ruby style={{ fontSize: 'clamp(1.35rem, 6.5vw, 2.5rem)', fontWeight: 800, color: '#0284c7', rubyPosition: 'over' }}>
                  {wordKanji}
                  {wordKana && (
                    <rt style={{ fontSize: '0.4em', letterSpacing: '0.08em', color: '#38bdf8', fontWeight: 500, paddingBottom: '2px' }}>
                      {wordKana}
                    </rt>
                  )}
                </ruby>
              </span>
              <span style={{ fontSize: '0.68rem', color: '#0ea5e9', marginTop: '4px', opacity: 0.85, fontWeight: 700 }}>
                {activeItem.meaning}
              </span>
            </span>
          );
        })}
      </div>
    );
  };

  const groupList = Array.from(new Set(patterns.map(p => p.group))).sort();
  const filteredPatterns = patterns.filter(p => p.group === selectedGroup);

  const NAV_TABS = [
    ['practice', '🚀', '練習室'],
    ['library', '📚', '教材'],
    ['import', '📥', '匯入']
  ];

  // ==================== 渲染 ====================
  return (
    <div className="flex flex-col min-h-[100dvh] font-sans">

      {/* Header */}
      <header className="border-b border-sky-100 bg-white/90 backdrop-blur sticky top-0 z-40 px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-400 flex items-center justify-center text-white font-black text-lg shadow-lg">
          あ
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-wide text-slate-800 truncate">日語 Shadowing 句型代換</h1>
          <p className="text-[11px] text-slate-400 truncate">
            {patterns.length} 個句型 · 熟練 {Object.keys(userProgress).length} 個
          </p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-3 py-4 pb-28">

        {/* ===== 練習室 ===== */}
        {activeTab === 'practice' && (
          <div className="w-full flex flex-col gap-4">

            {!selectedGroup ? (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">📖 選擇特訓單元</h2>
                  <p className="text-xs text-slate-400 mt-1">點擊下方章節進行 Shadowing 口語遞進代換訓練。</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groupList.map(groupName => {
                    const count = patterns.filter(p => p.group === groupName).length;
                    const masteredCount = patterns.filter(p => p.group === groupName && userProgress[p.id]).length;
                    const pct = count > 0 ? Math.round((masteredCount / count) * 100) : 0;
                    return (
                      <button key={groupName}
                        onClick={() => { setSelectedGroup(groupName); const first = patterns.find(p => p.group === groupName); if (first) setSelectedPattern(first); }}
                        className="text-left bg-white active:bg-sky-50 border border-sky-100 active:border-sky-300 p-4 rounded-2xl transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs bg-sky-100 text-sky-600 px-2.5 py-1 rounded-lg border border-sky-200 font-bold font-mono">{groupName}</span>
                          <span className="text-xs text-slate-500 font-bold">{masteredCount}/{count} 熟練</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-gradient-to-r from-sky-400 to-blue-400" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-sky-500 text-xs font-bold">
                          <span>立即開始特訓</span><span>→</span>
                        </div>
                      </button>
                    );
                  })}
                  {groupList.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-8 col-span-full">尚無教材，請先至「匯入」新增句型。</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">

                {/* 返回列 */}
                <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-2xl border border-sky-100 shadow-sm">
                  <button onClick={() => { stopAllPlayback(); setSelectedGroup(null); setSelectedPattern(null); }}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 active:text-sky-600 py-1">
                    ← 章節大廳
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-sky-600 font-mono bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-100">{selectedGroup}</span>
                    <span className="text-[11px] text-slate-400 font-bold font-mono">
                      {filteredPatterns.findIndex(p => p.id === selectedPattern?.id) + 1}/{filteredPatterns.length}
                    </span>
                  </div>
                </div>

                {/* 句型快速切換 */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3">
                  {filteredPatterns.map((item, idx) => (
                    <button key={item.id}
                      onClick={() => { stopAllPlayback(); setSelectedPattern(item); }}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl border shrink-0 transition flex items-center gap-1.5 ${
                        selectedPattern?.id === item.id
                          ? 'bg-gradient-to-r from-sky-400 to-blue-500 border-sky-400 text-white shadow-md'
                          : 'bg-white border-sky-100 text-slate-500'
                      }`}
                    >
                      {userProgress[item.id] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>}
                      <span>句型 {idx + 1}</span>
                    </button>
                  ))}
                </div>

                {/* 主卡片 */}
                <div className="bg-white border border-sky-100 rounded-3xl p-4 flex flex-col gap-4 shadow-lg">
                  {selectedPattern ? (
                    <div className="flex flex-col gap-4">

                      {/* 模式標頭 */}
                      <div className="flex items-center gap-2 border-b border-sky-50 pb-3">
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                        <p className="text-[11px] text-sky-600 font-bold uppercase tracking-widest font-mono">
                          {drillMode === 'manual' ? '🎯 手動自由代換' :
                           drillMode === 'vertical' ? '🔄 縱向循序代換中' : '🔀 橫向交叉循序中'}
                        </p>
                      </div>

                      {/* 句型看板 */}
                      <div className="bg-sky-50/30 rounded-2xl border border-sky-100 p-4 flex flex-col items-center justify-center min-h-[160px] shadow-inner">
                        {isBlind ? (
                          <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center border border-sky-200 text-sky-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            </div>
                            <p className="text-sky-500 text-xs font-bold">盲聽跟讀模式（字幕已隱藏）</p>
                            <p className="text-xl font-extrabold text-slate-700">
                              {generateFullTranslation(selectedPattern.translation, currentSubstitutions)}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center w-full">
                            {renderJapaneseRuby(selectedPattern.template, currentSubstitutions)}
                            <div className="h-px bg-sky-100 w-1/3 mx-auto my-2.5"></div>
                            <p className="text-slate-600 text-sm font-bold font-mono leading-relaxed">
                              {generateFullTranslation(selectedPattern.translation, currentSubstitutions)}
                            </p>
                          </div>
                        )}

                        {/* 音波 */}
                        <div className="w-full h-12 mt-4 overflow-hidden rounded-xl bg-white border border-sky-100">
                          <canvas ref={canvasRef} width={600} height={48} className="w-full h-full" />
                        </div>
                      </div>

                      {/* 主要播放按鈕 */}
                      {isPlaying ? (
                        <button onClick={stopAllPlayback}
                          className="w-full py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 bg-red-500 active:bg-red-600 text-white shadow-lg">
                          ■ 停止播放
                        </button>
                      ) : (
                        <button onClick={() => speakSentence(generateVoiceReading(selectedPattern.template, currentSubstitutions), false)}
                          className="w-full py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg">
                          ▶ 單句發音
                        </button>
                      )}

                      {/* 快速操作列 */}
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={quickNextCombination}
                          className="py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-600 text-[11px] font-extrabold flex flex-col items-center gap-0.5">
                          <span className="text-base">🎲</span>快速替換
                        </button>
                        <button onClick={() => setLoopPlay(!loopPlay)}
                          className={`py-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-0.5 transition ${loopPlay ? 'bg-sky-100 border-sky-300 text-sky-600' : 'bg-white border-sky-100 text-slate-500'}`}>
                          <span className="text-base">🔁</span>單句循環 {loopPlay ? 'ON' : 'OFF'}
                        </button>
                        <button onClick={() => setIsBlind(!isBlind)}
                          className={`py-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-0.5 transition ${isBlind ? 'bg-sky-100 border-sky-300 text-sky-600' : 'bg-white border-sky-100 text-slate-500'}`}>
                          <span className="text-base">🙈</span>盲聽 {isBlind ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      {/* 播放設定（收合） */}
                      <details className="bg-sky-50/20 rounded-2xl border border-sky-100 overflow-hidden">
                        <summary className="px-4 py-3 text-xs font-extrabold text-slate-500 cursor-pointer select-none">⚙️ 播放設定（速度・間隔・語音）</summary>
                        <div className="px-4 pb-4 flex flex-col gap-3">
                          {/* 速度 */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-bold">跟讀速度 ({speed}x)</span>
                            <span className="text-xs font-mono text-sky-500 font-extrabold">
                              {speed === 1.0 ? "標準" : speed < 1.0 ? "慢速精聽" : "快速特訓"}
                            </span>
                          </div>
                          <input type="range" min="0.5" max="1.5" step="0.1" value={speed}
                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            className="w-full accent-sky-400 h-2 rounded-lg cursor-pointer" />

                          {/* 句間間隔（僅自動模式下有意義） */}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-slate-500 font-bold">句間間隔 ({intervalSeconds}s)</span>
                            <span className="text-[11px] font-mono text-sky-400">語音唸完後等待</span>
                          </div>
                          <input type="range" min="1" max="10" step="1" value={intervalSeconds}
                            onChange={(e) => setIntervalSeconds(parseInt(e.target.value))}
                            className="w-full accent-sky-400 h-2 rounded-lg cursor-pointer" />

                          {/* 語音選擇 */}
                          <div className="mt-1">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-slate-400 font-bold">日文語音包</label>
                              <button onClick={playVoiceTest} className="text-xs text-sky-500 font-extrabold">🔊 語音測試</button>
                            </div>
                            <select value={selectedVoice?.name || ''}
                              onChange={(e) => { const v = voices.find(v => v.name === e.target.value); if (v) setSelectedVoice(v); }}
                              className="w-full bg-white border border-sky-100 rounded-lg px-2 py-2 text-sm text-slate-500 focus:outline-none font-mono shadow-sm">
                              {voices.map((v, i) => <option key={i} value={v.name}>👧 {v.name} ({v.lang})</option>)}
                            </select>
                          </div>
                        </div>
                      </details>

                      {/* 訓練模式 */}
                      <div className="flex flex-col gap-2.5">
                        <h3 className="text-xs text-slate-400 font-extrabold tracking-wider">選擇代換特訓模式</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { mode: 'manual', icon: '🎯', title: '手動自由代換', desc: '點選下方單字確認語句配對' },
                            { mode: 'vertical', icon: '🔄', title: '縱向遞進代換', desc: '語音唸完 + 間隔秒數後自動切換主槽' },
                            { mode: 'matrix', icon: '🔀', title: '橫向交叉遞進', desc: '語音唸完 + 間隔秒數後所有槽同步跳格' }
                          ].map(({ mode, icon, title, desc }) => (
                            <button key={mode}
                              onClick={() => {
                                setDrillMode(mode);
                                if (mode === 'manual') {
                                  stopAllPlayback();
                                } else {
                                  isPlayingRef.current = true;
                                  setIsPlaying(true);
                                  triggerSubstitutionDrill();
                                }
                              }}
                              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                                drillMode === mode ? 'bg-white border-sky-400 text-slate-700 shadow-md' : 'bg-sky-50/30 border-sky-100 text-slate-500'
                              }`}
                            >
                              <span className="text-xl shrink-0">{icon}</span>
                              <span className="flex flex-col">
                                <span className="font-bold text-sm">{title}</span>
                                <span className="text-[11px] text-slate-400">{desc}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 代換字卡庫：橫向滑動 chip（手機友善） */}
                      <div className="flex flex-col gap-4 border-t border-sky-100 pt-4">
                        <h3 className="text-sm font-extrabold text-slate-600">🧩 代換字卡庫</h3>
                        {Object.keys(selectedPattern.components).map((categoryName) => {
                          const list = selectedPattern.components[categoryName];
                          const activeItem = currentSubstitutions[categoryName];
                          return (
                            <div key={categoryName} className="flex flex-col gap-2">
                              <span className="text-[11px] font-extrabold text-sky-600 uppercase tracking-widest">
                                {categoryName} 槽
                              </span>
                              <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3">
                                {list.map((item, i) => {
                                  const isActive = activeItem?.kanji === item.kanji;
                                  return (
                                    <button key={i}
                                      onClick={() => {
                                        setComponentIndices(prev => ({ ...prev, [categoryName]: i }));
                                        const newSubs = { ...currentSubstitutions, [categoryName]: item };
                                        setCurrentSubstitutions(newSubs);
                                        if (drillMode === 'manual') {
                                          speakSentence(generateVoiceReading(selectedPattern.template, newSubs), false);
                                        }
                                      }}
                                      className={`shrink-0 text-left px-3.5 py-2 rounded-xl text-xs font-bold transition flex flex-col gap-0.5 border min-w-[92px] ${
                                        isActive ? 'bg-sky-500 border-sky-400 text-white shadow-sm' : 'bg-white border-sky-100 text-slate-600'
                                      }`}
                                    >
                                      <span className="font-mono">{item.kanji}</span>
                                      <span className={`text-[10px] ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>{item.meaning}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 進度 + 下一題 */}
                      <div className="flex items-center gap-2 border-t border-sky-100 pt-4">
                        <button onClick={() => toggleProgressMastered(selectedPattern.id)}
                          className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                            userProgress[selectedPattern.id] ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-sky-50/50 border border-sky-100 text-slate-500'
                          }`}>
                          ✓ {userProgress[selectedPattern.id] ? "已熟練！" : "標記為已熟練"}
                        </button>
                        <button
                          onClick={() => {
                            stopAllPlayback();
                            const idx = filteredPatterns.findIndex(p => p.id === selectedPattern.id);
                            setSelectedPattern(filteredPatterns[idx < filteredPatterns.length - 1 ? idx + 1 : 0]);
                          }}
                          className="flex-1 bg-gradient-to-r from-sky-400 to-blue-500 px-3 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow">
                          <span>下一題</span><span>→</span>
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 font-bold">本單元無可用教材句型。</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== 句型管理（階層式）===== */}
        {activeTab === 'library' && (
          <div className="w-full flex flex-col gap-6">

            {/* 新增/編輯表單 */}
            <div className="w-full bg-white border border-sky-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
              <h2 className="font-extrabold text-slate-800 flex items-center justify-between">
                <span>{editingPattern ? '📝 編輯句型' : '➕ 建立新教材卡'}</span>
                {editingPattern && (
                  <button onClick={resetForm} className="text-xs text-slate-400 font-bold">取消編輯</button>
                )}
              </h2>

              <form onSubmit={handleCreateOrUpdatePattern} className="flex flex-col gap-4 text-sm">
                {/* 群組：datalist 允許選既有 or 輸入新群組 */}
                <div>
                  <label className="block text-xs text-slate-500 font-bold mb-1.5">單元群組（選擇既有或輸入新名稱）</label>
                  <input list="group-datalist" value={newGroup} onChange={(e) => setNewGroup(e.target.value)}
                    placeholder="e.g. Chapter 05"
                    className="w-full bg-slate-50 border border-sky-100 rounded-lg px-3 py-2.5 text-base text-slate-700 focus:outline-none focus:border-sky-400 font-bold font-mono" required />
                  <datalist id="group-datalist">
                    {groupList.map(g => <option key={g} value={g} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 font-bold mb-1.5">日檢難度</label>
                  <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-sky-100 rounded-lg px-3 py-2.5 text-base text-slate-700 focus:outline-none focus:border-sky-400 font-bold">
                    {['N5', 'N4', 'N3', 'N2', 'N1'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 font-bold mb-1.5">句型模板</label>
                  <input type="text" placeholder="あまり [對象] と [動詞_ない形]。"
                    value={newTemplate} onChange={(e) => setNewTemplate(e.target.value)}
                    className="w-full bg-slate-50 border border-sky-100 rounded-lg px-3 py-2.5 text-base text-slate-700 focus:outline-none focus:border-sky-400 font-bold font-mono" required />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 font-bold mb-1.5">中文翻譯</label>
                  <input type="text" placeholder="不太跟 [對象] 一起 [動詞]。"
                    value={newTranslation} onChange={(e) => setNewTranslation(e.target.value)}
                    className="w-full bg-slate-50 border border-sky-100 rounded-lg px-3 py-2.5 text-base text-slate-700 focus:outline-none focus:border-sky-400 font-bold font-mono" required />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 font-bold mb-1.5">代換元件庫 JSON</label>
                  <textarea rows="6" value={newComponentsRaw} onChange={(e) => setNewComponentsRaw(e.target.value)}
                    className="w-full bg-slate-50 border border-sky-100 rounded-lg p-3 text-sm text-slate-600 focus:outline-none focus:border-sky-400 font-mono" required />
                </div>

                <button type="submit"
                  className="w-full py-3 bg-gradient-to-r from-sky-400 to-blue-500 font-bold text-white rounded-xl shadow">
                  {editingPattern ? '儲存更新' : '建立教材句型卡'}
                </button>
              </form>
            </div>

            {/* 群組選擇 + 句型清單 */}
            <div className="w-full bg-white border border-sky-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-extrabold text-slate-800">📚 本地教材庫 ({patterns.length})</h2>
                {selectedGroupLib && patterns.filter(p => p.group === selectedGroupLib).length > 0 && (
                  <button
                    onClick={() => exportGroup(selectedGroupLib)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    匯出
                  </button>
                )}
              </div>

              {/* 群組 Tab 列：橫向捲動 */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 border-b border-sky-50">
                {groupList.map(g => (
                  <button key={g} onClick={() => setSelectedGroupLib(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition shrink-0 ${
                      selectedGroupLib === g ? 'bg-sky-500 text-white border-sky-500 shadow' : 'bg-sky-50 text-sky-600 border-sky-200'
                    }`}>
                    {g}
                    <span className="ml-1.5 text-xs opacity-70">({patterns.filter(p => p.group === g).length})</span>
                  </button>
                ))}
                {groupList.length === 0 && (
                  <span className="text-xs text-slate-400 italic">尚無群組，請先建立教材卡。</span>
                )}
              </div>

              {/* 選中群組的句型清單 */}
              {selectedGroupLib ? (
                <div className="flex flex-col gap-3">
                  {patterns.filter(p => p.group === selectedGroupLib).length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">此群組目前無句型。</p>
                  ) : (
                    patterns.filter(p => p.group === selectedGroupLib).map((item) => (
                      <div key={item.id} className="p-3.5 bg-sky-50/10 border border-sky-100 rounded-xl flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{item.level}</span>
                            {userProgress[item.id] && (
                              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">✓ 熟練</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => startEditingPattern(item)}
                              className="text-xs text-sky-600 bg-sky-50 px-2.5 py-1.5 rounded-lg font-bold">編輯</button>
                            <button onClick={() => handleDeletePattern(item.id)}
                              className="text-xs text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg font-bold">刪除</button>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-slate-700 font-mono">{item.template}</p>
                        <p className="text-xs text-slate-400">{item.translation}</p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">請從上方選擇一個單元群組。</p>
              )}
            </div>

          </div>
        )}

        {/* ===== 批次匯入 ===== */}
        {activeTab === 'import' && (
          <div className="bg-white border border-sky-100 rounded-3xl p-4 shadow-sm flex flex-col gap-4">
            <h2 className="font-extrabold text-slate-800">📥 JSON 批次匯入</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              貼上教材 JSON 陣列（可省略 id），匯入後自動儲存至本機（localStorage）。
            </p>
            <textarea rows="10"
              placeholder={'[\n  {\n    "group": "Chapter 03",\n    "level": "N3",\n    "template": "一緒に [動詞_意向形]。",\n    "translation": "一起...吧。",\n    "components": {\n      "動詞": [\n        {\n          "kanji": "泳ぐ",\n          "kana": "およぐ",\n          "meaning": "游泳",\n          "conjugations": {\n            "意向形": { "text": "泳ごう", "kana": "およごう" }\n          }\n        }\n      ]\n    }\n  }\n]'}
              value={importJsonText} onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full bg-slate-50 border border-sky-100 rounded-xl p-3 text-sm text-slate-600 focus:outline-none focus:border-sky-400 font-mono shadow-inner" />
            {importError && (
              <div className="bg-red-50 border border-red-200 text-red-500 text-xs p-3 rounded-lg font-mono">❌ {importError}</div>
            )}
            <button onClick={handleJsonImport} disabled={!importJsonText}
              className="w-full py-3 bg-gradient-to-r from-sky-400 to-blue-500 disabled:opacity-50 font-bold text-sm text-white rounded-xl shadow">
              解析並儲存至本機
            </button>
          </div>
        )}

      </main>

      {/* 底部導覽列（手機優先） */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-sky-100 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="max-w-2xl mx-auto grid grid-cols-3">
          {NAV_TABS.map(([tab, icon, label]) => (
            <button key={tab}
              onClick={() => { setActiveTab(tab); if (tab === 'library') setEditingPattern(null); }}
              className={`flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold transition ${
                activeTab === tab ? 'text-sky-500' : 'text-slate-400'
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Modal */}
      {customModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-sky-100 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">{customModal.title}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{customModal.message}</p>
            <div className="flex items-center justify-end gap-3 text-sm font-bold">
              {customModal.onConfirm ? (
                <>
                  <button onClick={() => setCustomModal({ show: false, title: '', message: '', onConfirm: null })}
                    className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl">取消</button>
                  <button onClick={() => { customModal.onConfirm(); setCustomModal({ show: false, title: '', message: '', onConfirm: null }); }}
                    className="px-4 py-2.5 bg-sky-500 text-white rounded-xl">確認</button>
                </>
              ) : (
                <button onClick={() => setCustomModal({ show: false, title: '', message: '', onConfirm: null })}
                  className="px-5 py-2.5 bg-sky-500 text-white rounded-xl">確認</button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
