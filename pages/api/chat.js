export default async function handler(req, res) {
  const { messages, system } = req.body;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct", // 免費模型
        messages: [
          { role: "system", content: system },
          ...messages
        ]
      })
    });

    const data = await response.json();

    const text = data?.choices?.[0]?.message?.content || "⚠️ 無回應";
    res.status(200).json({ text });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
