import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Play, 
  Pause, 
  Download, 
  Languages, 
  User, 
  RefreshCw, 
  Volume2, 
  Wand2,
  Check
} from 'lucide-react';
import { Button } from '../components/Button';
import { LANGUAGES, VOICE_OPTIONS, Voice } from '../types';
import * as gemini from '../services/geminiService';
import { useToast } from '../components/ToastProvider';

interface VoiceGeneratorProps {
  onBack: () => void;
}

export const VoiceGenerator: React.FC<VoiceGeneratorProps> = ({ onBack }) => {
  // Form State
  const [text, setText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedGender, setSelectedGender] = useState<'All' | 'Male' | 'Female'>('All');
  const [selectedVoiceId, setSelectedVoiceId] = useState('Kore');
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  
  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const toast = useToast();

  // Filter voices
  const filteredVoices = VOICE_OPTIONS.filter(v => 
    selectedGender === 'All' || v.gender === selectedGender
  );

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.addEventListener('timeupdate', () => setCurrentTime(audioRef.current?.currentTime || 0));
        audioRef.current.addEventListener('loadedmetadata', () => setDuration(audioRef.current?.duration || 0));
        audioRef.current.addEventListener('ended', () => setIsPlaying(false));
    }
  }, [generatedAudioUrl]);

  const handleGenerate = async () => {
    if (!text) return;
    setIsGenerating(true);
    setGeneratedAudioUrl(null);
    try {
        // We use the Gemini Service which simulates the high-quality TTS 
        // In a real Edge TTS implementation, this would call the Python backend
        const audioData = await gemini.generateSpeech(text, selectedVoiceId);
        setGeneratedAudioUrl(audioData);
        toast.success("Voice generated successfully.");
    } catch (e) {
        console.error("Generation failed", e);
        toast.error("Failed to generate audio. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
        audioRef.current.pause();
    } else {
        audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (!generatedAudioUrl) return;
    const link = document.createElement('a');
    link.href = generatedAudioUrl;
    link.download = `voice_generation_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audio downloaded.");
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-dark-700 bg-dark-800 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
                <Mic className="mr-3 text-brand-500" /> Voice Generation Lab
            </h1>
            <p className="text-gray-400 text-sm mt-1">Convert text to lifelike speech using advanced AI voices.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Panel: Controls */}
        <div className="w-full lg:w-1/3 bg-dark-800 p-6 border-r border-dark-700 overflow-y-auto space-y-8">
            
            {/* Language Selector */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                    <Languages size={16} className="mr-2" /> Language
                </label>
                <select 
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 outline-none"
                >
                    {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                </select>
            </div>

            {/* Gender Filter */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                    <User size={16} className="mr-2" /> Voice Gender
                </label>
                <div className="flex bg-dark-900 p-1 rounded-lg border border-dark-600">
                    {['All', 'Male', 'Female'].map((g) => (
                        <button
                            key={g}
                            onClick={() => setSelectedGender(g as any)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                selectedGender === g 
                                ? 'bg-brand-600 text-white shadow' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {/* Voice Grid */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                    <Volume2 size={16} className="mr-2" /> Select Voice
                </label>
                <div className="grid grid-cols-1 gap-3">
                    {filteredVoices.map((voice) => (
                        <div 
                            key={voice.id}
                            onClick={() => setSelectedVoiceId(voice.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center space-x-4 ${
                                selectedVoiceId === voice.id
                                ? 'bg-brand-500/10 border-brand-500 ring-1 ring-brand-500'
                                : 'bg-dark-900 border-dark-600 hover:border-brand-500/50'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                selectedVoiceId === voice.id ? 'bg-brand-500' : 'bg-dark-700'
                            }`}>
                                {voice.name[0]}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-white">{voice.name}</h3>
                                    {selectedVoiceId === voice.id && <Check size={16} className="text-brand-400" />}
                                </div>
                                <p className="text-xs text-gray-400">{voice.gender} • {voice.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Panel: Input & Output */}
        <div className="flex-1 p-6 lg:p-10 flex flex-col bg-dark-900 relative">
            
            {/* Text Input */}
            <div className="flex-1 flex flex-col mb-6">
                <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-400">Script Text</label>
                    <span className="text-xs text-gray-500">{text.length} characters</span>
                </div>
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter your text here to convert it to speech..."
                    className="flex-1 w-full bg-dark-800 border border-dark-700 rounded-xl p-6 text-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-500 outline-none resize-none leading-relaxed"
                />
            </div>

            {/* Action Bar */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 flex items-center space-x-4 shadow-xl">
                
                <Button 
                    onClick={handleGenerate} 
                    isLoading={isGenerating}
                    disabled={!text}
                    size="lg"
                    className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 border-none px-8"
                    leftIcon={<Wand2 size={18} fill="currentColor" />}
                >
                    {isGenerating ? 'Generating Audio...' : 'Generate Voice'}
                </Button>

                {/* Audio Controls (Visible after generation) */}
                {generatedAudioUrl && (
                    <div className="flex-1 flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="h-12 w-px bg-dark-600 mx-2"></div>
                        
                        <button 
                            onClick={togglePlay}
                            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                        </button>

                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                            <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden relative">
                                <div 
                                    className="absolute top-0 left-0 h-full bg-brand-500" 
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <Button variant="secondary" onClick={handleDownload} leftIcon={<Download size={18} />}>
                            Download MP3
                        </Button>

                        <audio ref={audioRef} src={generatedAudioUrl} className="hidden" />
                    </div>
                )}
            </div>
            
        </div>
      </div>
    </div>
  );
};