export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type VideoStyle = 'documentary' | 'explainer' | 'educational' | 'storytelling' | 'news';
export type VideoDuration = 'short' | 'medium' | 'long'; // short < 1m, medium 1-5m, long 5-30m

export interface Project {
  id: string;
  userId: string;
  title: string;
  topic: string;
  inputLanguage?: string; // The language of the user input (topic/script)
  language: string; // The target output language
  style: VideoStyle;
  durationLevel: VideoDuration;
  status: 'draft' | 'processing' | 'completed';
  createdAt: string; 
  updatedAt?: string;
  scenes: Scene[];
  script?: string;
  fullAudioUrl?: string;
  backgroundMusicUrl?: string;
}

export interface Scene {
  id: string;
  text: string;
  duration: number; // in seconds
  imageUrl?: string;
  mediaType: 'image' | 'video'; // Type of visual
  stockVideoUrl?: string; // URL if mediaType is video
  audioUrl?: string;
  visualPrompt?: string;
  isGeneratingImage: boolean;
  isGeneratingAudio: boolean;
}

export interface Subtitle {
    id: string;
    startTime: number; // in seconds
    endTime: number; // in seconds
    text: string;
}

export interface Avatar {
    id: string;
    name: string;
    imageUrl: string;
    gender: 'Male' | 'Female';
    style: 'realistic' | 'anime' | '3d';
    previewVideoUrl?: string;
}

export interface AvatarGeneration {
    id: string;
    avatarId: string;
    text: string;
    voiceId: string;
    videoUrl?: string;
    status: 'processing' | 'completed' | 'failed';
    createdAt: string;
}

export interface RenderAssets {
  video1080p: string;
  video720p: string;
  audio: string;
  subtitles: string;
}

export interface RenderJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  logs: string[];
  outputUrl?: string;
  assets?: RenderAssets;
}

export enum AppView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
  MY_PROJECTS = 'MY_PROJECTS',
  AVATAR = 'AVATAR',
  VOICE = 'VOICE',
  SUBTITLES = 'SUBTITLES',
  IMAGE_GENERATOR = 'IMAGE_GENERATOR',
  SETTINGS = 'SETTINGS'
}

export enum GenerationStep {
  SCRIPT = 'SCRIPT',
  AUDIO = 'AUDIO',
  VISUALS = 'VISUALS',
  PREVIEW = 'PREVIEW',
}

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cs', name: 'Czech' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'et', name: 'Estonian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ur', name: 'Urdu' },
  { code: 'fa', name: 'Persian' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'sw', name: 'Swahili' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'tl', name: 'Filipino' },
  { code: 'is', name: 'Icelandic' }
];

export interface Voice {
    id: string;
    name: string;
    gender: 'Male' | 'Female';
    description: string;
}

export const VOICE_NAMES = [
  'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
];

export const VOICE_OPTIONS: Voice[] = [
    { id: 'Puck', name: 'Puck', gender: 'Male', description: 'Deep, resonant, storytelling' },
    { id: 'Charon', name: 'Charon', gender: 'Male', description: 'Authoritative, news, serious' },
    { id: 'Fenrir', name: 'Fenrir', gender: 'Male', description: 'Energetic, fast-paced, explainer' },
    { id: 'Kore', name: 'Kore', gender: 'Female', description: 'Calm, soothing, educational' },
    { id: 'Zephyr', name: 'Zephyr', gender: 'Female', description: 'Bright, friendly, conversational' },
];

export const VIDEO_STYLES: { id: VideoStyle; label: string; description: string }[] = [
  { id: 'documentary', label: 'Documentary', description: 'Cinematic, factual, and immersive storytelling.' },
  { id: 'explainer', label: 'Explainer', description: 'Clear, concise, and focused on breaking down concepts.' },
  { id: 'educational', label: 'Educational', description: 'Academic tone, suitable for lectures and learning.' },
  { id: 'storytelling', label: 'Storytelling', description: 'Narrative-driven, emotional, and engaging.' },
  { id: 'news', label: 'News Report', description: 'Formal, urgent, and information-heavy style.' },
];