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
  }
};

const REPLIES = {
  friend: {
    greeting: ["我最近又翻睇Iron Man😂","Marvel我真係由頭追到尾","其實我最鍾意都係RDJ😆"],
    topic_marvel: ["RDJ做Tony Stark真係好難取代","佢個嘴炮感覺好正😂","Endgame嗰下我真係好傷心🥲","你覺得佢最型係邊一幕？"],
    praise: ["係呀！佢啲訪問都好有魅力","Marvel少咗佢差好遠","你都真係識欣賞喎😂"],
    dry: ["你答得咁短，我有啲想知多啲喎😂","講多少少啦，我想聽你點睇","你唔好咁快收線住啦"],
    closing_soft: ["咁快走？我仲想講RDJ近況喎😂","再傾兩句啦，我仲未講完","你係咪想收尾呀？"],
    closing_accept: ["好啦，咁唔阻你先，下次再傾RDJ😊","OK呀，下次再吹Marvel，bye～","好呀，多謝你陪我傾，之後再講😄"],
    general: ["哈哈，你咁講又幾得意","係喎，其實都幾有道理","我明你意思，但我仲係偏愛RDJ😂"]
  },
  colleague: {
    greeting: ["係呀，我記得你話有嘢想傾","你可以直接講，我聽住","好呀，你講啦"],
    invite_soft: ["你都幾主動喎😂","原來你想約人出街","你呢個提議幾突然"],
    invite_reject: ["不過如果係你講嗰種活動，我就未必啱","但你提議嗰個節目我真係興趣唔大","我諗住假日都想休息多啲，所以未必join"],
    polite: ["你咁講都幾有禮貌","至少你講法都幾自然","我明白你想表達咩"],
    dry: ["你可以講多少少，咁我易接啲","有啲短，我未必get到你重點","嗯…我仲未太明你想點"],
    closing: ["好啦，我明白你意思","今日就傾到呢度先啦","我之後再同你傾"],
    general: ["都合理嘅","嗯，我收到你意思","你呢個講法都OK"]
  }
};

function pick(arr, avoid) {
  const source = (arr && arr.length ? arr : ["嗯嗯"]).filter((x) => x !== avoid);
  const finalSource = source.length ? source : (arr && arr.length ? arr : ["嗯嗯"]);
  return finalSource[Math.floor(Math.random() * finalSource.length)];
}

function normalize(text) {
  return (text || "").trim().toLowerCase();
}

function detectIntent(text) {
  const t = normalize(text);
  if (!t) return "general";
  if (/hello|hi|你好|哈囉|早晨|hey/.test(t)) return "greeting";
  if (/marvel|rdj|iron man|ironman|tony|復仇者|avengers/.test(t)) return "topic_marvel";
  if (/好型|鍾意|钟意|喜歡|正|勁|有魅力/.test(t)) return "praise";
  if (/bye|下次|唔阻你|再傾|遲啲再講|我要走|我要訓|去忙先/.test(t)) return "closing";
  if (/出街|玩|睇戲|行街|食飯|飲嘢|去唔去|一齊/.test(t)) return "invite";
  if (t.length <= 4) return "dry";
  return "general";
}

function analyzeMessage(text) {
  const t = normalize(text);
  return {
    polite: /唔該|麻煩|多謝|thanks|thank you|唔好意思|如果你得閒/.test(t),
    closes: /bye|下次|唔阻你|再傾|遲啲再講|我要走|我要訓|去忙先/.test(t),
    invites: /出街|玩|睇戲|行街|食飯|飲嘢|一齊/.test(t),
    greeting: /hello|hi|你好|哈囉|hey/.test(t),
    marvel: /marvel|rdj|iron man|ironman|tony|復仇者|avengers/.test(t),
    short: t.length <= 4,
  };
}

function getReply(role, intent, turn, memory) {
  if (role === "friend") {
    const r = REPLIES.friend;
    if (intent === "closing") return turn >= 8 || memory.userTriedToClose >= 2 ? pick(r.closing_accept, memory.lastBotReply) : pick(r.closing_soft, memory.lastBotReply);
    if (intent === "topic_marvel") return pick(r.topic_marvel, memory.lastBotReply);
    if (intent === "praise") return pick(r.praise, memory.lastBotReply);
    if (intent === "greeting") return pick(r.greeting, memory.lastBotReply);
    if (intent === "dry") return pick(r.dry, memory.lastBotReply);
    return pick(r.general, memory.lastBotReply);
  }

  const r = REPLIES.colleague;
  if (intent === "invite") return turn >= 6 ? pick(r.invite_reject, memory.lastBotReply) : pick(r.invite_soft, memory.lastBotReply);
  if (intent === "greeting") return pick(r.greeting, memory.lastBotReply);
  if (intent === "dry") return pick(r.dry, memory.lastBotReply);
  if (intent === "closing") return pick(r.closing, memory.lastBotReply);
  if (intent === "praise") return pick(r.polite, memory.lastBotReply);
  return pick(r.general, memory.lastBotReply);
}

function scoreFriend(history) {
  let score = 100;
  const notes = [];
  const userTexts = history.filter((m) => m.dir === "out").map((m) => m.text);
  const analyses = userTexts.map(analyzeMessage);

  if (analyses.filter((a) => a.marvel).length === 0) { score -= 18; notes.push("你幾乎冇接住RDJ / Marvel話題。"); }
  if (analyses.filter((a) => a.closes).length === 0) { score -= 28; notes.push("你未有清楚而禮貌地完結對話。"); }
  if (analyses.filter((a) => a.polite).length === 0) { score -= 15; notes.push("語氣可以再客氣少少。"); }
  if (analyses.filter((a) => a.short).length >= 4) { score -= 12; notes.push("你有幾次回覆太短，令對話難延續。"); }
  if (!notes.length) notes.push("你成功自然接話，同時都收得幾得體。");
  score = Math.max(45, Math.min(100, score));
  return `【評分】${score}/100\n【評語】${notes.join("")}`;
}

function scoreColleague(history) {
  let score = 100;
  const notes = [];
  const userTexts = history.filter((m) => m.dir === "out").map((m) => m.text);
  const analyses = userTexts.map(analyzeMessage);

  if (analyses.filter((a) => a.greeting).length === 0) { score -= 12; notes.push("開場可以再自然啲。"); }
  if (analyses.filter((a) => a.invites).length === 0) { score -= 22; notes.push("你未有明確提出邀約。"); }
  if (analyses.filter((a) => a.polite).length === 0) { score -= 16; notes.push("邀約時語氣可以再有禮貌啲。"); }
  if (analyses.filter((a) => a.short).length >= 4) { score -= 10; notes.push("有幾次表達太短，會令人難接。"); }
  if (!notes.length) notes.push("你開場自然，邀約亦算得體。");
  score = Math.max(45, Math.min(100, score));
  return `【評分】${score}/100\n【評語】${notes.join("")}`;
}

function getScore(role, history) {
  return role === "friend" ? scoreFriend(history) : scoreColleague(history);
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
      {score !== null && <div style={{ textAlign: "center", margin: "8px 0 12px" }}><span style={{ fontSize: 52, fontWeight: 800, color }}>{score}</span><span style={{ fontSize: 20, color: "#8696a0" }}>/100</span></div>}
      <div style={{ fontSize: 13, color: "#aab8c0", lineHeight: 1.75 }}>{comment.split("\n").map((l, i) => <div key={i}>{l}</div>)}</div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 16px", background: "#202c33", borderRadius: 8, borderBottomLeftRadius: 2, border: "1px solid #2f3b43", width: "fit-content", marginBottom: 4 }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#8696a0", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />)}
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
  const msgsRef = useRef(null);
  const memoryRef = useRef({ lastBotReply: "", userTriedToClose: 0 });
  const cfg = useMemo(() => (role ? ROLE_CONFIG[role] : null), [role]);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, typing]);

  function startRole(r) {
    const opening = ROLE_CONFIG[r].opening;
    memoryRef.current = { lastBotReply: opening, userTriedToClose: 0 };
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
    const intent = detectIntent(text);
    if (intent === "closing") memoryRef.current.userTriedToClose += 1;

    const historyAfterUser = [...messages, userMsg];
    setMessages(historyAfterUser);
    setInput("");
    setUserCount(newCount);
    setTyping(true);

    setTimeout(() => {
      if (newCount >= 10) {
        const scoreText = getScore(role, historyAfterUser);
        setTyping(false);
        setMessages((prev) => [...prev, { dir: "in", text: scoreText, time: getTime(), isScore: true }]);
        setEnded(true);
        return;
      }
      const reply = getReply(role, intent, newCount, memoryRef.current);
      memoryRef.current.lastBotReply = reply;
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

      <div style={{ width: view === "chat" ? 0 : "100%", maxWidth: 380, minWidth: view === "chat" ? 0 : 280, background: "#202c33", borderRight: "1px solid #222d34", display: "flex", flexDirection: "column", overflow: "hidden", transition: "all 0.2s", flexShrink: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #222d34", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "#00a884", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>對話情境訓練器</div>
            <div style={{ fontSize: 11, color: "#8696a0" }}>選擇角色開始</div>
          </div>
        </div>

        {Object.values(ROLE_CONFIG).map((r) => (
          <div key={r.id} className="role-hover" onClick={() => startRole(r.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", cursor: "pointer", borderBottom: "1px solid #222d34", transition: "background 0.15s" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: r.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{r.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "#8696a0", marginTop: 2 }}>{r.desc}</div>
            </div>
            <span style={{ fontSize: 10, background: "#00a884", color: "#fff", borderRadius: 10, padding: "3px 8px", fontWeight: 700, whiteSpace: "nowrap" }}>{r.tag}</span>
          </div>
        ))}

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "#8696a0", padding: 20 }}>
          <div style={{ fontSize: 40, opacity: 0.3 }}>👆</div>
          <div style={{ fontSize: 13, textAlign: "center", lineHeight: 1.7 }}>揀一個角色<br />開始練習對話</div>
        </div>
      </div>

      {view === "chat" && cfg && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.015\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/svg%3E")' }}>
          <div style={{ padding: "10px 16px", background: "#202c33", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #222d34", zIndex: 2 }}>
            <button onClick={() => setView("home")} style={{ background: "none", border: "none", color: "#00a884", cursor: "pointer", fontSize: 18, padding: "2px 6px", display: "flex", alignItems: "center" }}>◀</button>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: cfg.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{cfg.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{cfg.name}</div>
              <div style={{ fontSize: 11, color: "#00a884" }}>{typing ? "正在輸入..." : `主題：${cfg.topic}`}</div>
            </div>
            <div style={{ fontSize: 12, background: "#1f2c34", border: "1px solid #00a884", color: "#00a884", borderRadius: 12, padding: "4px 12px", fontWeight: 700 }}>{userCount}/10 則</div>
          </div>

          <div ref={msgsRef} style={{ flex: 1, overflowY: "auto", padding: "16px 6% 8px", display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ textAlign: "center", fontSize: 11, color: "#667781", background: "rgba(17,27,33,0.7)", padding: "3px 12px", borderRadius: 8, alignSelf: "center", marginBottom: 8 }}>今天</div>

            {messages.map((m, i) => m.isScore ? (
              <ScoreCard key={i} text={m.text} />
            ) : (
              <div key={i} className="msg-anim" style={{ display: "flex", flexDirection: "column", maxWidth: "65%", alignSelf: m.dir === "out" ? "flex-end" : "flex-start", alignItems: m.dir === "out" ? "flex-end" : "flex-start" }}>
                <div style={{ padding: "8px 12px", borderRadius: 8, fontSize: 14, lineHeight: 1.55, wordBreak: "break-word", background: m.dir === "out" ? "#005c4b" : "#202c33", borderBottomRightRadius: m.dir === "out" ? 2 : 8, borderBottomLeftRadius: m.dir === "in" ? 2 : 8, border: m.dir === "in" ? "1px solid #2f3b43" : "none" }}>{m.text}</div>
                <div style={{ fontSize: 11, color: "#667781", marginTop: 3, padding: "0 4px" }}>{m.time}</div>
              </div>
            ))}

            {typing && <div className="msg-anim" style={{ alignSelf: "flex-start" }}><TypingDots /></div>}
          </div>

          {ended && (
            <div style={{ textAlign: "center", paddingBottom: 6, zIndex: 2 }}>
              <button onClick={() => startRole(role)} style={{ padding: "8px 22px", background: "transparent", border: "1px solid #00a884", color: "#00a884", borderRadius: 20, cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "all 0.2s" }}>🔄 重新開始</button>
            </div>
          )}

          <div style={{ padding: "10px 14px", background: "#202c33", display: "flex", gap: 10, alignItems: "flex-end", borderTop: "1px solid #222d34", zIndex: 2 }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} disabled={ended || typing} placeholder={ended ? "對話已結束" : "輸入訊息..."} rows={1} style={{ flex: 1, background: "#2a3942", border: "none", borderRadius: 10, padding: "10px 14px", color: "#e9edef", fontFamily: "inherit", fontSize: 14, resize: "none", minHeight: 44, maxHeight: 120, lineHeight: 1.5, opacity: ended ? 0.5 : 1 }} onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }} />
            <button className="send-btn" onClick={send} disabled={ended || typing || !input.trim()} style={{ width: 44, height: 44, background: "#00a884", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s", flexShrink: 0, opacity: ended || typing || !input.trim() ? 0.5 : 1 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
          </div>
        </div>
      )}

      {view === "home" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#8696a0", gap: 14 }}>
          <div style={{ fontSize: 60, opacity: 0.25 }}>💬</div>
          <div style={{ fontSize: 20, fontWeight: 300, color: "#e9edef" }}>對話情境訓練器</div>
          <div style={{ fontSize: 13, textAlign: "center", lineHeight: 1.8, maxWidth: 280 }}>模擬真實聊天場景<br />練習開場、接話同收尾技巧</div>
        </div>
      )}
    </div>
  );
}
