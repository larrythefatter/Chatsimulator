export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, system } = req.body || {};

    if (!Array.isArray(messages) || !system) {
      return res.status(400).json({ error: "Missing messages or system prompt" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          ...messages
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status || 500).json({
        error: data?.error?.message || "OpenAI API error"
      });
    }

    const text = data?.choices?.[0]?.message?.content || "";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
