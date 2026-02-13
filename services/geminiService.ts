/**
 * CLIENT SIDE GEMINI CALL
 * Browser -> Netlify Function -> Google Gemini
 * Direct API key exposure বন্ধ করার জন্য
 */

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

    // IMPORTANT PART
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

    const data = await response.json();

    // Gemini response safe parsing
    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "[]";

    let parsed: Scene[] = [];

    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("JSON parse failed:", raw);
      return [];
    }

    return parsed;

  } catch (error) {
    console.error("Gemini request failed:", error);
    return [];
  }
}  try {
    const data = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    return `data:audio/mp3;base64,${base64Audio}`;

  } catch (error) {
    console.error("Speech generation failed:", error);
    throw error;
  }
};

/**
 * Generates an image for a scene using Gemini Image Generation.
 * @param prompt The image description
 * @param aspectRatio Supported values: "1:1", "3:4", "4:3", "9:16", "16:9". Default "16:9"
 */
export const generateSceneImage = async (prompt: string, aspectRatio: string = "16:9"): Promise<string> => {
  const ai = getClient();

  try {
    const data = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      }
    });

    for (const part of data.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

function getToneDescription(style: VideoStyle): string {
  switch(style) {
    case 'documentary': return "Serious, informative, cinematic, objective";
    case 'explainer': return "Upbeat, clear, simple, direct";
    case 'educational': return "Academic, slow-paced, detailed";
    case 'storytelling': return "Emotional, dramatic, narrative arc";
    case 'news': return "Urgent, formal, professional broadcast style";
    default: return "Professional";
  }
}
