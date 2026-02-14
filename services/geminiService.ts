export type Scene = {
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

  const res = await fetch("/.netlify/functions/gemini", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: prompt
  })
});
  if (!res.ok) throw new Error("API failed");

  const data = await res.json();

  const raw =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return [];
  }
}
