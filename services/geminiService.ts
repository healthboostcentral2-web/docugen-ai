import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Scene, VideoStyle, VideoDuration } from "../types";

// Initialize Gemini Client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Critical: API_KEY is missing. Please set 'API_KEY' in your Netlify Site Settings > Build & Deploy > Environment.");
    throw new Error("API_KEY environment variable is missing. Check Netlify configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Helper to clean JSON string from Markdown code blocks
 */
const cleanJsonString = (str: string): string => {
  if (!str) return "[]";
  // Remove ```json and ``` wrapping if present
  let cleaned = str.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  return cleaned;
};

/**
 * Generates a structured video script based on topic, style, and duration.
 * Supports cross-language generation (Topic in Language A -> Script in Language B).
 */
export const generateScript = async (
  topic: string, 
  inputLanguage: string,
  outputLanguage: string, 
  style: VideoStyle, 
  duration: VideoDuration
): Promise<Scene[]> => {
  const ai = getClient();
  
  let sceneCount = 5;
  let detailLevel = "concise";

  // Configuration for different duration targets
  // Short: ~1 min (5 scenes)
  // Medium: ~5 min (12 scenes)
  // Long: ~20-30 min (30 scenes + detailed narration)
  if (duration === 'medium') {
      sceneCount = 12;
      detailLevel = "moderately detailed";
  }
  if (duration === 'long') {
      sceneCount = 30;
      detailLevel = "extremely comprehensive, deep-dive documentary style";
  }

  const prompt = `
    Task: Create a professional video script.
    Topic: "${topic}" (The topic is provided in ${inputLanguage}).
    Target Output Language: ${outputLanguage} (The script text MUST be in this language).
    Style: ${style} (Tone: ${getToneDescription(style)}).
    Target Length: ${duration} (Approx ${sceneCount} scenes).
    Detail Level: ${detailLevel}.

    Structure the response as a JSON array of scenes. 
    Each scene must have:
    - "text": The narration text in ${outputLanguage}. Ensure the narration flows naturally between scenes. For 'long' duration, ensure paragraphs are substantial.
    - "visualPrompt": A detailed, high-quality image generation prompt to visually represent this scene. NOTE: The visual prompt should be in ENGLISH for best image generation results, regardless of the video language. Include camera angles and lighting styles suited for a ${style} video.
    
    Limit strictly to ${sceneCount} scenes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              visualPrompt: { type: Type.STRING }
            },
            required: ["text", "visualPrompt"]
          }
        }
      }
    });

    const cleanedText = cleanJsonString(response.text || "[]");
    const rawScenes = JSON.parse(cleanedText);
    
    return rawScenes.map((s: any, index: number) => ({
      id: `scene-${Date.now()}-${index}`,
      text: s.text,
      visualPrompt: s.visualPrompt,
      duration: Math.max(3, s.text.split(' ').length / 2.5), // Estimate duration based on word count
      isGeneratingImage: false,
      isGeneratingAudio: false,
      mediaType: 'image', // Default to image
    }));

  } catch (error) {
    console.error("Script generation failed:", error);
    throw error;
  }
};

/**
 * Parses manually entered text into scenes and translates if necessary.
 */
export const parseManualScript = async (
    fullText: string,
    inputLanguage: string,
    outputLanguage: string
): Promise<Scene[]> => {
    const ai = getClient();

    const prompt = `
        Task: Refine the following raw script into a structured JSON array of scenes for a video.
        
        Input Text: "${fullText}" (Provided in ${inputLanguage}).
        Target Language: ${outputLanguage}.
        
        Instructions:
        1. If Input Language is different from Target Language, TRANSLATE the narration text to ${outputLanguage}.
        2. Chunk the text into logical visual scenes.
        3. Do not change the core meaning, just structure and translate if needed.
        
        For each scene, provide:
        - "text": The narration text chunk (in ${outputLanguage}).
        - "visualPrompt": A corresponding image generation prompt (in English).
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            visualPrompt: { type: Type.STRING }
                        },
                        required: ["text", "visualPrompt"]
                    }
                }
            }
        });
        
        const cleanedText = cleanJsonString(response.text || "[]");
        const rawScenes = JSON.parse(cleanedText);

        return rawScenes.map((s: any, index: number) => ({
            id: `scene-manual-${Date.now()}-${index}`,
            text: s.text,
            visualPrompt: s.visualPrompt,
            duration: Math.max(3, s.text.split(' ').length / 2.5),
            isGeneratingImage: false,
            isGeneratingAudio: false,
            mediaType: 'image',
        }));

    } catch (e) {
        console.warn("AI parsing failed", e);
        // Fallback is tricky with translation, so we just return the original text split
        const chunks = fullText.split(/\n+/).filter(t => t.trim().length > 0);
        return chunks.map((text, index) => ({
            id: `scene-manual-fallback-${index}`,
            text: text.trim(),
            visualPrompt: `Visual representation of: ${text.substring(0, 50)}...`,
            duration: Math.max(3, text.split(' ').length / 2.5),
            isGeneratingImage: false,
            isGeneratingAudio: false,
            mediaType: 'image',
        }));
    }
};

/**
 * Generates audio for a specific text using Gemini TTS.
 */
export const generateSpeech = async (text: string, voice: string = 'Kore'): Promise<string> => {
  const ai = getClient();
  
  try {
    const response = await ai.models.generateContent({
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

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
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
    const response = await ai.models.generateContent({
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

    for (const part of response.candidates?.[0]?.content?.parts || []) {
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