export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, system } = req.body || {};

    if (!Array.isArray(messages) || !system) {
      return res.status(400).json({ error: "Missing messages or system prompt" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        system,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(response.status || 500).json({
        error: data?.error?.message || "Anthropic API error"
      });
    }

    const text = (data.content || [])
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error" });
  }
}
