import { useMemo, useRef, useState, useEffect } from "react";

const ROLE_CONFIG = {
  friend: {
    id: "friend",
    name: "網友",
    emoji: "😊",
    avatarBg: "linear-gradient(135deg,#667eea,#764ba2)",
    tag: "Marvel迷",
    desc: "練習：正當地完結對話",
    opening: "你有冇睇過marvel D戲？",
    topic: "RDJ / Marvel",
    moodLine: {
      neutral: "幾想繼續傾",
      engaged: "開始投入",
      clingy: "有少少痴住你",
      accepting: "開始肯放你走",
    }
  },
  colleague: {
    id: "colleague",
    name: "同事 Tom",
    emoji: "👔",
    avatarBg: "linear-gradient(135deg,#f093fb,#f5576c)",
    tag: "新同事",
    desc: "練習：正當地開啟對話",
    opening: "Hi i am Tom!你晏晝係咪話有野想問？",
    topic: "假日活動 / 邀約",
    moodLine: {
      neutral: "保持禮貌距離",
      engaged: "開始願意聽你講",
      clingy: "開始有少少壓力",
      accepting: "準備禮貌收尾",
    }
  }
};

const PHRASES = {
  friend: {
    moodLead: {
      neutral: ["哈哈", "係喎", "其實", "講真"],
      engaged: ["我真係幾有感覺", "你咁講我即刻有畫面", "其實我都幾認同", "講到呢度我有啲興奮"],
      clingy: ["你而家咁講我更加想傾落去", "我仲有少少唔捨得停", "你都勾起我繼續講嘅興致"],
      accepting: ["好啦", "收到", "明白嘅", "OK呀"],
    },
    topicRef: {
      marvel: [
        "RDJ真係好難取代",
        "Iron Man個角色真係同佢綁死咗",
        "佢啲訪問都好有魅力",
        "Endgame嗰份重量真係仲記得",
      ],
      user: [
        "你頭先提過Marvel",
        "你啱啱都講到RDJ",
        "你之前個講法幾有意思",
        "你嗰句都幾反映你點睇",
      ],
      vague: [
        "我仲想知多啲你點諗",
        "呢個話題其實仲可以講落去",
        "我覺得你仲有後話",
        "你應該唔止得呢一句感受",
      ],
    },
    ask: {
      marvel: [
        "你最buy佢邊種魅力？",
        "你係鍾意佢做Tony Stark定本人多啲？",
        "你最記得佢邊一幕？",
      ],
      continue: [
        "你可唔可以講多少少？",
        "你想唔想再講深少少？",
        "咁你其實最想講邊 part？",
      ],
      closing: [
        "不過如果你要去忙，我都明白。",
        "如果你真係想收尾，我都唔阻你。",
        "你想停我都會尊重你。",
      ],
    },
    reaction: {
      short: [
        "你呢句好短喎😂",
        "你收得有啲快喎",
        "我感覺你仲未完全打開話匣子",
      ],
      positive: [
        "你呢個回法幾自然",
        "你咁接都幾舒服",
        "你個語氣都幾有親切感",
      ],
      closing: [
        "我feel到你想慢慢收尾",
        "你似乎想禮貌完結",
        "你呢句開始有收線感覺",
      ],
    },
  },
  colleague: {
    moodLead: {
      neutral: ["嗯", "OK", "我明", "好呀"],
      engaged: ["你咁講我會易接啲", "呢個方向都算自然", "至少我明你想熟啲"],
      clingy: ["你而家有少少太進取", "我開始感到少少壓力", "你再推前一步我會有啲尷尬"],
      accepting: ["好啦", "收到", "明白", "可以呀"],
    },
    topicRef: {
      invite: [
        "你似乎係想約我假日出嚟",
        "你而家個方向好明顯係邀約",
        "我聽得出你想將關係拉近少少",
      ],
      user: [
        "你頭先個講法都算直接",
        "你啱啱個語氣比之前自然咗",
        "你前一句其實鋪得幾順",
      ],
      vague: [
        "但我仲想聽清楚你想做咩活動",
        "不過你未完全講到重點",
        "你可以再具體少少",
      ],
    },
    ask: {
      soft: [
        "你係想輕鬆啲定正式啲約？",
        "你想表達熟絡，定純粹約活動？",
        "你係想自然啲開個頭？",
      ],
      reject: [
        "不過你講嗰類活動未必啱我。",
        "但嗰種行程我真係唔算有興趣。",
        "如果係你提議嗰個方向，我應該唔會 join。",
      ],
      closing: [
        "如果你想講到呢度停，都可以。",
        "你想收返個尾，其實都幾自然。",
        "今日去到呢度都OK。",
      ],
    },
    reaction: {
      short: [
        "你講得有啲短，我未必易接。",
        "呢句太短，對方會比較難回。",
        "你可以再補多一兩個資訊。",
      ],
      positive: [
        "呢句禮貌度唔錯。",
        "你呢個切入都算自然。",
        "至少聽落唔會太突兀。",
      ],
      closing: [
        "我感覺你開始準備收尾。",
        "你而家個語氣係收線模式。",
        "呢句有少少完結意味。",
      ],
    },
  }
};

function pick(arr, avoid) {
  const base = Array.isArray(arr) && arr.length ? arr : ["嗯"];
  const filtered = base.filter((x) => x !== avoid);
  const source = filtered.length ? filtered : base;
  return source[Math.floor(Math.random() * source.length)];
}

function normalize(text) {
  return (text || "").trim().toLowerCase();
}

function extractKeywords(text) {
  const t = normalize(text);
  const keywords = [];
  if (/marvel|復仇者|avengers/.test(t)) keywords.push("marvel");
  if (/rdj|robert downey|iron man|ironman|tony/.test(t)) keywords.push("rdj");
  if (/endgame/.test(t)) keywords.push("endgame");
  if (/型|魅力|正|勁|鍾意|喜欢|喜歡/.test(t)) keywords.push("positive");
  if (/bye|下次|再傾|唔阻你|去忙|我要走|我要訓/.test(t)) keywords.push("closing");
  if (/出街|睇戲|食飯|飲嘢|行街|一齊|約/.test(t)) keywords.push("invite");
  return [...new Set(keywords)];
}

function analyzeMessage(text) {
  const t = normalize(text);
  return {
    text,
    polite: /唔該|麻煩|多謝|thanks|thank you|唔好意思|如果你得閒|可唔可以/.test(t),
    closes: /bye|下次|唔阻你|再傾|遲啲再講|我要走|我要訓|去忙先/.test(t),
    invites: /出街|玩|睇戲|行街|食飯|飲嘢|一齊|約/.test(t),
    greeting: /hello|hi|你好|哈囉|hey/.test(t),
    marvel: /marvel|rdj|iron man|ironman|tony|復仇者|avengers/.test(t),
    positive: /好型|鍾意|钟意|喜歡|正|勁|有魅力|鍾意/.test(t),
    question: /\?|？/.test(text || ""),
    short: t.length <= 4,
    long: t.length >= 20,
    keywords: extractKeywords(text),
  };
}

function detectIntent(role, analysis) {
  if (analysis.greeting) return "greeting";
  if (analysis.closes) return "closing";
  if (analysis.invites) return "invite";
  if (analysis.marvel) return "topic";
  if (analysis.positive) return "praise";
  if (analysis.short) return "short";
  return "general";
}

function updateMemory(memory, analysis, text) {
  const next = { ...memory };
  next.turn += 1;
  next.lastUserText = text;
  next.recentAnalyses = [...next.recentAnalyses, analysis].slice(-5);

  if (analysis.closes) next.userTriedToClose += 1;
  if (analysis.invites) next.userInviteCount += 1;
  if (analysis.polite) next.politeCount += 1;
  if (analysis.short) next.shortCount += 1;
  if (analysis.marvel) next.marvelCount += 1;
  if (analysis.greeting) next.greetingCount += 1;

  analysis.keywords.forEach((k) => {
    next.keywords[k] = (next.keywords[k] || 0) + 1;
  });

  const positiveSignals =
    (analysis.polite ? 1 : 0) +
    (analysis.marvel ? 1 : 0) +
    (analysis.positive ? 1 : 0) +
    (analysis.long ? 1 : 0);

  const coldSignals = (analysis.short ? 1 : 0) + (analysis.closes ? 1 : 0);

  next.warmth = Math.max(0, Math.min(10, next.warmth + positiveSignals - coldSignals));

  return next;
}

function getMood(role, memory) {
  if (role === "friend") {
    if (memory.userTriedToClose >= 2 || memory.turn >= Math.max(4, memory.maxTurns - 2)) return "accepting";
    if (memory.warmth >= 7) return "engaged";
    if (memory.turn >= 4 && memory.userTriedToClose === 0) return "clingy";
    return "neutral";
  }

  if (memory.userInviteCount >= 2 || memory.warmth <= 2) return "clingy";
  if (memory.turn >= Math.max(4, memory.maxTurns - 2)) return "accepting";
  if (memory.warmth >= 6) return "engaged";
  return "neutral";
}

function maybeReferUser(role, memory) {
  const userText = memory.lastUserText || "";
  if (!userText) return "";
  if (role === "friend") {
    if (memory.keywords.rdj || memory.keywords.marvel) return pick(PHRASES.friend.topicRef.user, memory.lastReference);
    return pick(PHRASES.friend.topicRef.vague, memory.lastReference);
  }
  if (memory.keywords.invite) return pick(PHRASES.colleague.topicRef.invite, memory.lastReference);
  return pick(PHRASES.colleague.topicRef.user, memory.lastReference);
}

function composeFriendReply(intent, memory) {
  const mood = getMood("friend", memory);
  const lead = pick(PHRASES.friend.moodLead[mood], memory.lastLead);
  const reactionPool =
    intent === "short"
      ? PHRASES.friend.reaction.short
      : intent === "closing"
      ? PHRASES.friend.reaction.closing
      : memory.warmth >= 5
      ? PHRASES.friend.reaction.positive
      : PHRASES.friend.reaction.short;

  const reaction = pick(reactionPool, memory.lastReaction);

  let reference = "";
  if (memory.keywords.rdj || memory.keywords.marvel || intent === "topic" || intent === "praise") {
    reference = pick(PHRASES.friend.topicRef.marvel, memory.lastReference);
  } else {
    reference = maybeReferUser("friend", memory);
  }

  let ending = "";
  if (intent === "closing") {
    ending =
      mood === "accepting"
        ? pick(PHRASES.friend.ask.closing, memory.lastEnding)
        : pick(PHRASES.friend.ask.continue, memory.lastEnding);
  } else if (intent === "topic" || intent === "praise") {
    ending = pick(PHRASES.friend.ask.marvel, memory.lastEnding);
  } else {
    ending = pick(PHRASES.friend.ask.continue, memory.lastEnding);
  }

  if (memory.turn % 5 === 0 && mood !== "accepting") {
    reference = `${reference}，${pick(["我覺得你應該仲有嘢想講", "你似乎仲未講晒", "我估你未完"], memory.lastReference)}`;
  }

  if (memory.turn > 2 && intent === "general" && Math.random() < 0.25) {
    reaction = pick(["我可能get錯少少，但", "如果我冇理解錯，", "我可能誤會你意思，不過"], memory.lastReaction);
  }

  memory.lastLead = lead;
  memory.lastReaction = reaction;
  memory.lastReference = reference;
  memory.lastEnding = ending;

  return `${lead}，${reaction}。${reference}。${ending}`;
}

function composeColleagueReply(intent, memory) {
  const mood = getMood("colleague", memory);
  const lead = pick(PHRASES.colleague.moodLead[mood], memory.lastLead);
  const reactionPool =
    intent === "short"
      ? PHRASES.colleague.reaction.short
      : intent === "closing"
      ? PHRASES.colleague.reaction.closing
      : PHRASES.colleague.reaction.positive;

  const reaction = pick(reactionPool, memory.lastReaction);
  let reference = maybeReferUser("colleague", memory);

  let ending = "";
  if (intent === "invite") {
    ending =
      memory.turn >= Math.max(4, Math.floor(memory.maxTurns * 0.6))
        ? pick(PHRASES.colleague.ask.reject, memory.lastEnding)
        : pick(PHRASES.colleague.ask.soft, memory.lastEnding);
  } else if (intent === "closing") {
    ending = pick(PHRASES.colleague.ask.closing, memory.lastEnding);
  } else {
    ending = pick(PHRASES.colleague.ask.soft, memory.lastEnding);
  }

  if (memory.userInviteCount >= 2 && mood === "clingy") {
    reference = "我明白你真係想拉近距離";
  }

  if (memory.turn > 2 && intent === "general" && Math.random() < 0.2) {
    reference = pick(["你前一句其實鋪得唔差", "你而家開始有啲自然", "至少我聽得出你有鋪排"], memory.lastReference);
  }

  memory.lastLead = lead;
  memory.lastReaction = reaction;
  memory.lastReference = reference;
  memory.lastEnding = ending;

  return `${lead}，${reaction}。${reference}。${ending}`;
}

function getBotReply(role, text, memory) {
  const analysis = analyzeMessage(text);
  const intent = detectIntent(role, analysis);
  const nextMemory = updateMemory(memory, analysis, text);

  const reply =
    role === "friend"
      ? composeFriendReply(intent, nextMemory)
      : composeColleagueReply(intent, nextMemory);

  nextMemory.lastBotReply = reply;
  nextMemory.lastIntent = intent;

  return { reply, memory: nextMemory, analysis, intent };
}

function scoreFriend(history, maxTurns) {
  let score = 100;
  const notes = [];
  const userTexts = history.filter((m) => m.dir === "out").map((m) => m.text);
  const analyses = userTexts.map(analyzeMessage);

  const politeCount = analyses.filter((a) => a.polite).length;
  const closeCount = analyses.filter((a) => a.closes).length;
  const marvelCount = analyses.filter((a) => a.marvel).length;
  const shortCount = analyses.filter((a) => a.short).length;
  const longCount = analyses.filter((a) => a.long).length;

  if (marvelCount === 0) { score -= 18; notes.push("你幾乎冇接住RDJ / Marvel話題。"); }
  if (closeCount === 0) { score -= 24; notes.push("你未有清楚而禮貌地完結對話。"); }
  if (politeCount === 0) { score -= 14; notes.push("語氣可以再客氣少少。"); }
  if (shortCount >= Math.max(3, Math.floor(maxTurns / 3))) { score -= 12; notes.push("有幾次回覆太短，令對話難延續。"); }
  if (longCount >= 2) { notes.push("你有幾次肯展開講，呢點幾加分。"); }
  if (closeCount >= 1 && politeCount >= 1) { notes.push("你有兼顧禮貌同保持朋友關係。"); }

  score = Math.max(45, Math.min(100, score));
  if (!notes.length) notes.push("你成功自然接話，同時都收得幾得體。");
  return `【評分】${score}/100\n【評語】${notes.join("")}`;
}

function scoreColleague(history, maxTurns) {
  let score = 100;
  const notes = [];
  const userTexts = history.filter((m) => m.dir === "out").map((m) => m.text);
  const analyses = userTexts.map(analyzeMessage);

  const politeCount = analyses.filter((a) => a.polite).length;
  const inviteCount = analyses.filter((a) => a.invites).length;
  const greetingCount = analyses.filter((a) => a.greeting).length;
  const shortCount = analyses.filter((a) => a.short).length;
  const closeCount = analyses.filter((a) => a.closes).length;

  if (greetingCount === 0) { score -= 10; notes.push("開場可以再自然啲。"); }
  if (inviteCount === 0) { score -= 22; notes.push("你未有明確提出邀約。"); }
  if (politeCount === 0) { score -= 16; notes.push("邀約時語氣可以再有禮貌啲。"); }
  if (shortCount >= Math.max(3, Math.floor(maxTurns / 3))) { score -= 10; notes.push("有幾次表達太短，對方會比較難接。"); }
  if (closeCount >= 1) { notes.push("你有顧及收尾，唔算太突兀。"); }
  if (inviteCount >= 1 && politeCount >= 1) { notes.push("你有用較自然方式推進關係。"); }

  score = Math.max(45, Math.min(100, score));
  if (!notes.length) notes.push("你開場自然，邀約亦算得體。");
  return `【評分】${score}/100\n【評語】${notes.join("")}`;
}

function getScore(role, history, maxTurns) {
  return role === "friend" ? scoreFriend(history, maxTurns) : scoreColleague(history, maxTurns);
}

function getTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

function ScoreCard({ text }) {
  const scoreMatch = text.match(/【評分】\s*(\d+)/);
  const commentMatch = text.match(/【評語】([\s\S]+)/);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
  const comment = commentMatch ? commentMatch[1].trim() : text;
  const color = score >= 80 ? "#00a884" : score >= 60 ? "#f0a500" : "#e74c3c";

  return (
    <div style={{ background: "linear-gradient(135deg,#1f2c34,#162028)", border: `1px solid ${color}`, borderRadius: 16, padding: "20px 22px", margin: "10px auto", width: "88%", maxWidth: 380, boxShadow: `0 4px 24px ${color}30` }}>
      <div style={{ color, fontWeight: 700, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>🏆 對話評分結果</div>
      {score !== null && (
        <div style={{ textAlign: "center", margin: "8px 0 12px" }}>
          <span style={{ fontSize: 52, fontWeight: 800, color }}>{score}</span>
          <span style={{ fontSize: 20, color: "#8696a0" }}>/100</span>
        </div>
      )}
      <div style={{ fontSize: 13, color: "#aab8c0", lineHeight: 1.75 }}>
        {comment.split("\n").map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 16px", background: "#202c33", borderRadius: 8, borderBottomLeftRadius: 2, border: "1px solid #2f3b43", width: "fit-content", marginBottom: 4 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#8696a0", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

function SettingChip({ label, value, onMinus, onPlus }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1f2c34", border: "1px solid #2f3b43", borderRadius: 20, padding: "6px 8px" }}>
      <span style={{ fontSize: 12, color: "#aab8c0" }}>{label}</span>
      <button onClick={onMinus} style={{ width: 24, height: 24, borderRadius: "50%", border: "none", background: "#2a3942", color: "#fff", cursor: "pointer" }}>－</button>
      <span style={{ minWidth: 18, textAlign: "center", fontWeight: 700 }}>{value}</span>
      <button onClick={onPlus} style={{ width: 24, height: 24, borderRadius: "50%", border: "none", background: "#00a884", color: "#fff", cursor: "pointer" }}>＋</button>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [role, setRole] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [ended, setEnded] = useState(false);
  const [maxTurns, setMaxTurns] = useState(10);
  const msgsRef = useRef(null);

  const memoryRef = useRef({
    turn: 0,
    maxTurns: 10,
    warmth: 4,
    userTriedToClose: 0,
    userInviteCount: 0,
    politeCount: 0,
    shortCount: 0,
    marvelCount: 0,
    greetingCount: 0,
    recentAnalyses: [],
    keywords: {},
    lastUserText: "",
    lastBotReply: "",
    lastLead: "",
    lastReaction: "",
    lastReference: "",
    lastEnding: "",
    lastIntent: "",
  });

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, typing]);

  const cfg = useMemo(() => (role ? ROLE_CONFIG[role] : null), [role]);

  function resetMemory(turnLimit) {
    memoryRef.current = {
      turn: 0,
      maxTurns: turnLimit,
      warmth: 4,
      userTriedToClose: 0,
      userInviteCount: 0,
      politeCount: 0,
      shortCount: 0,
      marvelCount: 0,
      greetingCount: 0,
      recentAnalyses: [],
      keywords: {},
      lastUserText: "",
      lastBotReply: "",
      lastLead: "",
      lastReaction: "",
      lastReference: "",
      lastEnding: "",
      lastIntent: "",
    };
  }

  function startRole(r) {
    const opening = ROLE_CONFIG[r].opening;
    resetMemory(maxTurns);
    memoryRef.current.lastBotReply = opening;
    setRole(r);
    setMessages([{ dir: "in", text: opening, time: getTime() }]);
    setUserCount(0);
    setInput("");
    setEnded(false);
    setView("chat");
  }

  function send() {
    if (!input.trim() || ended || typing) return;
    const text = input.trim();
    const userMsg = { dir: "out", text, time: getTime() };
    const newCount = userCount + 1;
    const historyAfterUser = [...messages, userMsg];

    setMessages(historyAfterUser);
    setUserCount(newCount);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      if (newCount >= maxTurns) {
        const scoreText = getScore(role, historyAfterUser, maxTurns);
        setTyping(false);
        setMessages((prev) => [...prev, { dir: "in", text: scoreText, time: getTime(), isScore: true }]);
        setEnded(true);
        return;
      }

      const { reply, memory } = getBotReply(role, text, memoryRef.current);
      memoryRef.current = memory;
      setTyping(false);
      setMessages((prev) => [...prev, { dir: "in", text: reply, time: getTime() }]);
    }, 500);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function adjustTurns(delta) {
    setMaxTurns((prev) => Math.max(6, Math.min(20, prev + delta)));
  }

  return (
    <div style={{ fontFamily: "'Noto Sans HK', 'Segoe UI', sans-serif", background: "#111b21", color: "#e9edef", height: "100vh", display: "flex", overflow: "hidden" }}>
      <style>{`
        html, body, #__next { margin: 0; padding: 0; height: 100%; }
        * { box-sizing: border-box; }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .msg-anim { animation: fadeUp 0.22s ease; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a3942; border-radius: 2px; }
        textarea:focus { outline: none; }
        .role-hover:hover { background: #2a3942 !important; }
        .send-btn:hover { background: #00cf9d !important; }
      `}</style>

      <div style={{ width: view === "chat" ? 0 : "100%", maxWidth: 400, minWidth: view === "chat" ? 0 : 300, background: "#202c33", borderRight: "1px solid #222d34", display: "flex", flexDirection: "column", overflow: "hidden", transition: "all 0.2s", flexShrink: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #222d34", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "#00a884", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>對話情境訓練器</div>
            <div style={{ fontSize: 11, color: "#8696a0" }}>擬真 AI 版</div>
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderBottom: "1px solid #222d34", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, color: "#8696a0" }}>對話上限可喺 app 內調整</div>
          <SettingChip label="對話上限" value={maxTurns} onMinus={() => adjustTurns(-1)} onPlus={() => adjustTurns(1)} />
          <div style={{ fontSize: 11, color: "#667781" }}>可設定 6–20 句，評分會跟設定自動調整。</div>
        </div>

        {Object.values(ROLE_CONFIG).map((r) => (
          <div key={r.id} className="role-hover" onClick={() => startRole(r.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", cursor: "pointer", borderBottom: "1px solid #222d34", transition: "background 0.15s" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: r.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              {r.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "#8696a0", marginTop: 2 }}>{r.desc}</div>
            </div>
            <span style={{ fontSize: 10, background: "#00a884", color: "#fff", borderRadius: 10, padding: "3px 8px", fontWeight: 700, whiteSpace: "nowrap" }}>{r.tag}</span>
          </div>
        ))}

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "#8696a0", padding: 20 }}>
          <div style={{ fontSize: 40, opacity: 0.3 }}>👆</div>
          <div style={{ fontSize: 13, textAlign: "center", lineHeight: 1.7 }}>
            揀一個角色
            <br />
            開始練習對話
          </div>
        </div>
      </div>

      {view === "chat" && cfg && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", backgroundImage:  "none"}}>
          <div style={{ padding: "10px 16px", background: "#202c33", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #222d34", zIndex: 2 }}>
            <button onClick={() => setView("home")} style={{ background: "none", border: "none", color: "#00a884", cursor: "pointer", fontSize: 18, padding: "2px 6px", display: "flex", alignItems: "center" }}>◀</button>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: cfg.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{cfg.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{cfg.name}</div>
              <div style={{ fontSize: 11, color: "#00a884" }}>
                {typing ? "正在輸入..." : `${cfg.topic}｜${cfg.moodLine[getMood(role, memoryRef.current)]}`}
              </div>
            </div>
            <div style={{ fontSize: 12, background: "#1f2c34", border: "1px solid #00a884", color: "#00a884", borderRadius: 12, padding: "4px 12px", fontWeight: 700 }}>
              {userCount}/{maxTurns} 則
            </div>
          </div>

          <div ref={msgsRef} style={{ flex: 1, overflowY: "auto", padding: "16px 6% 8px", display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ textAlign: "center", fontSize: 11, color: "#667781", background: "rgba(17,27,33,0.7)", padding: "3px 12px", borderRadius: 8, alignSelf: "center", marginBottom: 8 }}>
              今天
            </div>

            {messages.map((m, i) =>
              m.isScore ? (
                <ScoreCard key={i} text={m.text} />
              ) : (
                <div key={i} className="msg-anim" style={{ display: "flex", flexDirection: "column", maxWidth: "72%", alignSelf: m.dir === "out" ? "flex-end" : "flex-start", alignItems: m.dir === "out" ? "flex-end" : "flex-start" }}>
                  <div style={{ padding: "8px 12px", borderRadius: 8, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word", background: m.dir === "out" ? "#005c4b" : "#202c33", borderBottomRightRadius: m.dir === "out" ? 2 : 8, borderBottomLeftRadius: m.dir === "in" ? 2 : 8, border: m.dir === "in" ? "1px solid #2f3b43" : "none" }}>
                    {m.text}
                  </div>
                  <div style={{ fontSize: 11, color: "#667781", marginTop: 3, padding: "0 4px" }}>{m.time}</div>
                </div>
              )
            )}

            {typing && (
              <div className="msg-anim" style={{ alignSelf: "flex-start" }}>
                <TypingDots />
              </div>
            )}
          </div>

          {ended && (
            <div style={{ textAlign: "center", paddingBottom: 6, zIndex: 2 }}>
              <button onClick={() => startRole(role)} style={{ padding: "8px 22px", background: "transparent", border: "1px solid #00a884", color: "#00a884", borderRadius: 20, cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "all 0.2s" }}>
                🔄 重新開始
              </button>
            </div>
          )}

          <div style={{ padding: "10px 14px", background: "#202c33", display: "flex", gap: 10, alignItems: "flex-end", borderTop: "1px solid #222d34", zIndex: 2 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={ended || typing}
              placeholder={ended ? "對話已結束" : "輸入訊息..."}
              rows={1}
              style={{ flex: 1, background: "#2a3942", border: "none", borderRadius: 10, padding: "10px 14px", color: "#e9edef", fontFamily: "inherit", fontSize: 14, resize: "none", minHeight: 44, maxHeight: 120, lineHeight: 1.5, opacity: ended ? 0.5 : 1 }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button className="send-btn" onClick={send} disabled={ended || typing || !input.trim()} style={{ width: 44, height: 44, background: "#00a884", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s", flexShrink: 0, opacity: ended || typing || !input.trim() ? 0.5 : 1 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {view === "home" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#8696a0", gap: 14 }}>
          <div style={{ fontSize: 60, opacity: 0.25 }}>💬</div>
          <div style={{ fontSize: 20, fontWeight: 300, color: "#e9edef" }}>對話情境訓練器</div>
          <div style={{ fontSize: 13, textAlign: "center", lineHeight: 1.8, maxWidth: 300 }}>
            內建假記憶、情緒弧線、引用式接話
            <br />
            唔使 API 都更似 AI
          </div>
        </div>
      )}
    </div>
  );
}
