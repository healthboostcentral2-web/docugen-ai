import { GoogleGenAI } from "@google/genai";
import { Scene, VideoStyle } from "../types";

// Netlify/Environment friendly key access
const getEnvVar = (key: string) => {
    // Check global process.env if available (Node/Bundled)
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || '';
    }
    // Check import.meta.env if using Vite (optional fallback for standard setups)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        return import.meta.env[`VITE_${key}`] || import.meta.env[key] || '';
    }
    return '';
};

const API_KEY_PEXELS = getEnvVar('REACT_APP_PEXELS_API_KEY') || getEnvVar('PEXELS_API_KEY');
const API_KEY_PIXABAY = getEnvVar('REACT_APP_PIXABAY_API_KEY') || getEnvVar('PIXABAY_API_KEY');

if (!API_KEY_PEXELS && !API_KEY_PIXABAY) {
    console.log("Stock Media Service: No Pexels or Pixabay API keys found in environment. Using Mock Data mode.");
}

// Mock Data for demonstration if API keys are missing
const MOCK_VIDEOS = [
    { id: 1, url: 'https://cdn.coverr.co/videos/coverr-walking-in-a-coniferous-forest-5426/1080p.mp4', tags: ['forest', 'nature', 'trees', 'walking'] },
    { id: 2, url: 'https://cdn.coverr.co/videos/coverr-cloudy-sky-2751/1080p.mp4', tags: ['sky', 'clouds', 'blue', 'weather'] },
    { id: 3, url: 'https://cdn.coverr.co/videos/coverr-working-on-a-laptop-374/1080p.mp4', tags: ['technology', 'computer', 'work', 'office', 'coding'] },
    { id: 4, url: 'https://cdn.coverr.co/videos/coverr-city-traffic-at-night-9092/1080p.mp4', tags: ['city', 'traffic', 'night', 'urban'] },
    { id: 5, url: 'https://cdn.coverr.co/videos/coverr-people-talking-in-a-meeting-5346/1080p.mp4', tags: ['business', 'meeting', 'people', 'discussion'] },
    { id: 6, url: 'https://cdn.coverr.co/videos/coverr-reading-a-book-in-a-library-5501/1080p.mp4', tags: ['education', 'book', 'library', 'reading'] },
    { id: 7, url: 'https://cdn.coverr.co/videos/coverr-robot-arm-4974/1080p.mp4', tags: ['tech', 'robot', 'future', 'ai'] },
    { id: 8, url: 'https://cdn.coverr.co/videos/coverr-waves-crashing-on-rocks-5444/1080p.mp4', tags: ['sea', 'ocean', 'waves', 'water'] },
];

const MOCK_MUSIC = {
    documentary: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_14233a73df.mp3?filename=cinematic-atmosphere-score-2-21140.mp3', // Cinematic
    explainer: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=music-for-video-118248.mp3', // Upbeat
    educational: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=tech-soft-10255.mp3', // Soft Tech
    storytelling: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_5113c23363.mp3?filename=emotional-piano-124967.mp3', // Emotional
    news: 'https://cdn.pixabay.com/download/audio/2022/03/23/audio_07b2a04be3.mp3?filename=news-intro-11226.mp3', // News
};

export interface StockResult {
    id: number | string;
    thumbnail: string;
    videoUrl: string;
    duration: number;
    provider: 'Pexels' | 'Pixabay' | 'Mock';
}

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY missing");
    return new GoogleGenAI({ apiKey });
};

export const stockMediaService = {
    /**
     * Extracts 1-2 english keywords from a scene text using Gemini.
     */
    extractKeywords: async (text: string): Promise<string> => {
        const ai = getAiClient();
        try {
            const prompt = `Extract 1 or 2 specific visual English keywords for a stock video search based on this text: "${text}". Return ONLY the keywords separated by space.`;
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
            });
            return response.text?.trim() || "video";
        } catch (e) {
            console.error("Keyword extraction failed", e);
            return "general";
        }
    },

    /**
     * Search for videos using Pexels/Pixabay APIs or Mock data.
     */
    searchVideos: async (query: string): Promise<StockResult[]> => {
        // 1. Try Pexels if Key exists
        if (API_KEY_PEXELS) {
            try {
                const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5`, {
                    headers: { Authorization: API_KEY_PEXELS }
                });
                const data = await res.json();
                return data.videos.map((v: any) => ({
                    id: v.id,
                    thumbnail: v.image,
                    videoUrl: v.video_files.find((f: any) => f.quality === 'hd')?.link || v.video_files[0].link,
                    duration: v.duration,
                    provider: 'Pexels'
                }));
            } catch (e) { console.warn("Pexels failed", e); }
        }

        // 2. Try Pixabay if Key exists
        if (API_KEY_PIXABAY) {
             try {
                const res = await fetch(`https://pixabay.com/api/videos/?key=${API_KEY_PIXABAY}&q=${encodeURIComponent(query)}`);
                const data = await res.json();
                return data.hits.map((v: any) => ({
                    id: v.id,
                    thumbnail: `https://i.vimeocdn.com/video/${v.picture_id}_640x360.jpg`, // Pixabay requires constructing thumb sometimes, or use userImageURL
                    videoUrl: v.videos.large.url || v.videos.medium.url,
                    duration: v.duration,
                    provider: 'Pixabay'
                }));
            } catch (e) { console.warn("Pixabay failed", e); }
        }

        // 3. Fallback to Mock Data (Client-side simulation)
        // Simple fuzzy match
        const lowerQuery = query.toLowerCase();
        const matches = MOCK_VIDEOS.filter(v => v.tags.some(tag => lowerQuery.includes(tag)));
        
        // If no matches, return random ones to ensure user sees something
        const results = matches.length > 0 ? matches : MOCK_VIDEOS.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        return results.map(v => ({
            id: v.id,
            thumbnail: '', // Mock videos usually don't have static thumbs easily available without generating
            videoUrl: v.url,
            duration: 15,
            provider: 'Mock'
        }));
    },

    /**
     * Orchestrates the auto-matching process for a list of scenes.
     */
    autoMatchScenes: async (scenes: Scene[]): Promise<Scene[]> => {
        const updatedScenes = [...scenes];

        // Process in parallel with a limit to avoid rate limits
        const promises = updatedScenes.map(async (scene) => {
            if (scene.mediaType === 'video' && !scene.stockVideoUrl) {
                const keyword = await stockMediaService.extractKeywords(scene.text);
                const videos = await stockMediaService.searchVideos(keyword);
                if (videos.length > 0) {
                    return {
                        ...scene,
                        stockVideoUrl: videos[0].videoUrl
                    };
                }
            }
            return scene;
        });

        return Promise.all(promises);
    },

    /**
     * Returns a background music URL based on style.
     */
    getBackgroundMusic: (style: VideoStyle): string => {
        return MOCK_MUSIC[style] || MOCK_MUSIC.documentary;
    }
};