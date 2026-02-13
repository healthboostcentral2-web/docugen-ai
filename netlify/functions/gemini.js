export async function handler(event) {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No body provided" })
      };
    }

    const body = JSON.parse(event.body);

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    const text = await res.text();

    // Google sometimes returns empty
    if (!text || text.trim() === "") {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Empty response from Gemini" })
      };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid JSON from Gemini", raw: text })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
