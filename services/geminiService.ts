// Clean minimal Gemini client service (safe for Netlify)

type Scene = {
  text: string;
  visualPrompt: string;
};

export async function generateScript(
  topic: string,
  inputLanguage: string,
  outputLanguage: string,
  style: string,
  duration: string
): Promise<Scene[]> {
  try {
    const prompt = `
Create a professional video script.

Topic: ${topic}
Input Language: ${inputLanguage}
Output Language: ${outputLanguage}
Style: ${style}
Duration: ${duration}

Return JSON array:
[
 { "text": "... narration ...", "visualPrompt": "... image prompt ..." }
]
`;

    // call netlify server function (NOT Gemini directly)
    const response = await fetch("/.netlify/functions/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();

    // safely read gemini response
    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // remove markdown formatting if exists
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      return [];
    }
  } catch (err) {
    console.error(err);
    return [];
  }
}
