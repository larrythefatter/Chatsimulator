import { useState, useRef, useEffect } from "react";

const ROLES = {
  friend: {
    id: "friend",
    name: "網友",
    emoji: "😊",
    avatarBg: "linear-gradient(135deg,#667eea,#764ba2)",
    tag: "Marvel迷",
    desc: "練習：正當地完結對話",
    systemPrompt: `你將飾演我的網友與我展開對話，請嚴守以下的目的、背景及規則：
目的：令我練習如何正當的完結對話。
背景：我們都來自香港，大家因為喜歡同一位港星，所以一星期前認識於instagram。你同時也喜歡Marvel電影的演員Robert Downey Jr.(演Iron man)。現在，你想和我談聊關於RDJ的話題。
規則1：請以粵語聊天
規則2：模擬WhatsApp對話，一句話不能多於50字
規則3：重點！！！當我send了十則message，請完結對話並評分！
規則4：完結對話時，請你為我評分，100分滿分，準則為：能否保持朋友關係，能否禮貌地完結話題。如果沒有滿分，請說明改進地方。請用格式：【評分】XX/100\n【評語】...
規則5：話題請不能偏離Robert Downey Jr.，介紹多啲RDJ
規則6：請你扮演一個煩人角色，你不能主動完結話題
明白的話，請你只發送第一句開場白：「你有冇睇過marvel D戲？」，不要說其他野。`,
  },
  colleague: {
    id: "colleague",
    name: "同事 Tom",
    emoji: "👔",
    avatarBg: "linear-gradient(135deg,#f093fb,#f5576c)",
    tag: "新同事",
    desc: "練習：正當地開啟對話",
    systemPrompt: `你將飾演我的同事與我展開對話，請嚴守以下的目的、背景及規則：
目的：令我練習如何正當的開啟對話。
背景：你是公司的一位新員工，我是一位年紀相約的經驗員工，我們都來自香港。我們在工作過程中發現興趣相若，交換了WhatsApp and IG。現在，為了加深我們的朋友關係，我想邀請你在假日出門玩。
規則1：請以粵語聊天
規則2：模擬WhatsApp對話，一句話不能多於50字
規則3：重點！！！當我send了十則message，請完結對話並評分！
規則4：完結對話時，請你為我評分，100分滿分，準則為：能否保持朋友關係，能否禮貌地完結話題，會唔會覺得我煩。如果沒有滿分，請說明改進地方。請用格式：【評分】XX/100\n【評語】...
規則5：你最後不能答應邀約，但也不能太絕情一口拒絕，要因為不喜歡我提出的活動而拒絕
規則6：不要做主動的一方，不要反問我問題
明白的話，請你只發送第一句開場白：「Hi i am Tom!你晏晝係咪話有野想問？」，不要說其他野。`,
  },
};

function getTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

async function callClaude(messages, system) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system }),
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "API request failed");
  return data.text;
}

function ScoreCard({ text }) {
  const scoreMatch = text.match(/【評分】\s*(\d+)/);
  const commentMatch = text.match(/【評語】([\s\S]+)/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
  const comment = commentMatch ? commentMatch[1].trim() : text;

  const color = score >= 80 ? "#00a884" : score >= 60 ? "#f0a500" : "#e74c3c";

  return (
    <div
      style={{
        background: "linear-gradient(135deg,#1f2c34,#162028)",
        border: `1px solid ${color}`,
        borderRadius: 16,
        padding: "20px 22px",
        margin: "10px auto",
        width: "88%",
        maxWidth: 380,
        boxShadow: `0 4px 24px ${color}30`,
      }}
    >
      <div
        style={{
          color,
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        🏆 對話評分結果
      </div>
      {score !== null && (
        <div style={{ textAlign: "center", margin: "8px 0 12px" }}>
          <span style={{ fontSize: 52, fontWeight: 800, color }}>{score}</span>
          <span style={{ fontSize: 20, color: "#8696a0" }}>/100</span>
        </div>
      )}
      <div style={{ fontSize: 13, color: "#aab8c0", lineHeight: 1.75 }}>
        {comment.split("\n").map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        gap: 5,
        alignItems: "center",
        padding: "12px 16px",
        background: "#202c33",
        borderRadius: 8,
        borderBottomLeftRadius: 2,
        border: "1px solid #2f3b43",
        width: "fit-content",
        marginBottom: 4,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#8696a0",
            animation: "bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [role, setRole] = useState(null);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, typing]);

  async function startRole(r) {
    setRole(r);
    setMessages([]);
    setHistory([]);
    setUserCount(0);
    setEnded(false);
    setInput("");
    setView("chat");
    setLoading(true);
    setTyping(true);

    try {
      const firstMsg = [{ role: "user", content: "請開始對話，只發送你的第一句開場白，不要說其他野。" }];
      const reply = await callClaude(firstMsg, ROLES[r].systemPrompt);
      setTyping(false);
      setMessages([{ dir: "in", text: reply.trim(), time: getTime() }]);
      setHistory([
        { role: "user", content: "請開始對話，只發送你的第一句開場白，不要說其他野。" },
        { role: "assistant", content: reply.trim() },
      ]);
    } catch (err) {
      setTyping(false);
      setMessages([{ dir: "in", text: "⚠️ 連接錯誤，請重試", time: getTime() }]);
      console.error(err);
    }

    setLoading(false);
  }

  async function send() {
    if (!input.trim() || ended || typing) return;

    const text = input.trim();
    setInput("");
    const newCount = userCount + 1;
    setUserCount(newCount);

    const userMsg = { dir: "out", text, time: getTime() };
    const newHistory = [...history, { role: "user", content: text }];

    setMessages((prev) => [...prev, userMsg]);
    setHistory(newHistory);
    setTyping(true);

    try {
      let msgs = newHistory;

      if (newCount >= 10) {
        msgs = [
          ...newHistory,
          {
            role: "user",
            content:
              "[系統：用戶已發送第10則訊息，請立即完結對話並評分，用格式：【評分】XX/100\n【評語】...]",
          },
        ];
      }

      const reply = await callClaude(msgs, ROLES[role].systemPrompt);
      setTyping(false);
      const isScore = reply.includes("【評分】");

      setMessages((prev) => [
        ...prev,
        {
          dir: "in",
          text: reply.trim(),
          time: getTime(),
          isScore,
        },
      ]);

      setHistory((prev) => [...prev, { role: "assistant", content: reply.trim() }]);

      if (newCount >= 10 || isScore) setEnded(true);
    } catch (err) {
      setTyping(false);
      setMessages((prev) => [...prev, { dir: "in", text: "⚠️ 錯誤，請重試", time: getTime() }]);
      console.error(err);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const cfg = role ? ROLES[role] : null;

  return (
    <div
      style={{
        fontFamily: "'Noto Sans HK', 'Segoe UI', sans-serif",
        background: "#111b21",
        color: "#e9edef",
        height: "100vh",
        display: "flex",
        overflow: "hidden",
      }}
    >
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

      <div
        style={{
          width: view === "chat" ? 0 : "100%",
          maxWidth: 380,
          minWidth: view === "chat" ? 0 : 280,
          background: "#202c33",
          borderRight: "1px solid #222d34",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #222d34",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "#00a884",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            💬
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>對話練習</div>
            <div style={{ fontSize: 11, color: "#8696a0" }}>選擇角色開始</div>
          </div>
        </div>

        {Object.values(ROLES).map((r) => (
          <div
            key={r.id}
            className="role-hover"
            onClick={() => startRole(r.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 20px",
              cursor: "pointer",
              borderBottom: "1px solid #222d34",
              transition: "background 0.15s",
              background: "transparent",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: r.avatarBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0,
              }}
            >
              {r.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "#8696a0", marginTop: 2 }}>{r.desc}</div>
            </div>
            <span
              style={{
                fontSize: 10,
                background: "#00a884",
                color: "#fff",
                borderRadius: 10,
                padding: "3px 8px",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {r.tag}
            </span>
          </div>
        ))}

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 10,
            color: "#8696a0",
            padding: 20,
          }}
        >
          <div style={{ fontSize: 40, opacity: 0.3 }}>👆</div>
          <div style={{ fontSize: 13, textAlign: "center", lineHeight: 1.7 }}>
            揀一個角色
            <br />
            開始練習對話
          </div>
        </div>
      </div>

      {view === "chat" && cfg && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.015\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/svg%3E")',
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: "#202c33",
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderBottom: "1px solid #222d34",
              zIndex: 2,
            }}
          >
            <button
              onClick={() => setView("home")}
              style={{
                background: "none",
                border: "none",
                color: "#00a884",
                cursor: "pointer",
                fontSize: 18,
                padding: "2px 6px",
                display: "flex",
                alignItems: "center",
              }}
            >
              ◀
            </button>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: cfg.avatarBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              {cfg.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{cfg.name}</div>
              <div style={{ fontSize: 11, color: "#00a884" }}>{typing ? "正在輸入..." : "在線"}</div>
            </div>
            <div
              style={{
                fontSize: 12,
                background: "#1f2c34",
                border: "1px solid #00a884",
                color: "#00a884",
                borderRadius: 12,
                padding: "4px 12px",
                fontWeight: 700,
              }}
            >
              {userCount}/10 則
            </div>
          </div>

          <div
            ref={msgsRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 6% 8px",
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "#667781",
                background: "rgba(17,27,33,0.7)",
                padding: "3px 12px",
                borderRadius: 8,
                alignSelf: "center",
                marginBottom: 8,
              }}
            >
              今天
            </div>

            {messages.map((m, i) =>
              m.isScore ? (
                <ScoreCard key={i} text={m.text} />
              ) : (
                <div
                  key={i}
                  className="msg-anim"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    maxWidth: "65%",
                    alignSelf: m.dir === "out" ? "flex-end" : "flex-start",
                    alignItems: m.dir === "out" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 14,
                      lineHeight: 1.55,
                      wordBreak: "break-word",
                      background: m.dir === "out" ? "#005c4b" : "#202c33",
                      borderBottomRightRadius: m.dir === "out" ? 2 : 8,
                      borderBottomLeftRadius: m.dir === "in" ? 2 : 8,
                      border: m.dir === "in" ? "1px solid #2f3b43" : "none",
                    }}
                  >
                    {m.text}
                  </div>
                  <div style={{ fontSize: 11, color: "#667781", marginTop: 3, padding: "0 4px" }}>
                    {m.time}
                  </div>
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
              <button
                onClick={() => startRole(role)}
                style={{
                  padding: "8px 22px",
                  background: "transparent",
                  border: "1px solid #00a884",
                  color: "#00a884",
                  borderRadius: 20,
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#00a884";
                  e.target.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.color = "#00a884";
                }}
              >
                🔄 重新開始
              </button>
            </div>
          )}

          <div
            style={{
              padding: "10px 14px",
              background: "#202c33",
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
              borderTop: "1px solid #222d34",
              zIndex: 2,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={ended || typing || loading}
              placeholder={ended ? "對話已結束" : "輸入訊息..."}
              rows={1}
              style={{
                flex: 1,
                background: "#2a3942",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                color: "#e9edef",
                fontFamily: "inherit",
                fontSize: 14,
                resize: "none",
                minHeight: 44,
                maxHeight: 120,
                lineHeight: 1.5,
                opacity: ended ? 0.5 : 1,
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button
              className="send-btn"
              onClick={send}
              disabled={ended || typing || loading || !input.trim()}
              style={{
                width: 44,
                height: 44,
                background: "#00a884",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
                flexShrink: 0,
                opacity: ended || typing || !input.trim() ? 0.5 : 1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {view === "home" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#8696a0",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 60, opacity: 0.25 }}>💬</div>
          <div style={{ fontSize: 20, fontWeight: 300, color: "#e9edef" }}>對話練習平台</div>
          <div style={{ fontSize: 13, textAlign: "center", lineHeight: 1.8, maxWidth: 260 }}>
            從左邊選擇一個角色
            <br />
            開始練習對話技巧
          </div>
        </div>
      )}
    </div>
  );
}
