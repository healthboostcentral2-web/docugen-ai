import React, { useState, useRef, useEffect } from 'react';
import { 
  Captions, 
  Upload, 
  Play, 
  Pause, 
  Download, 
  FileText, 
  Clock, 
  Film,
  X,
  CheckCircle2,
  Wand2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/Button';
import { Subtitle } from '../types';
import { subtitleService } from '../services/subtitleService';
import { useToast } from '../components/ToastProvider';

interface SubtitleGeneratorProps {
  onBack: () => void;
}

export const SubtitleGenerator: React.FC<SubtitleGeneratorProps> = ({ onBack }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const toast = useToast();

  // Cleanup object URLs on unmount or when url changes
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error("File is too large. Please upload a video under 100MB.");
        return;
      }
      
      // Clean up previous URL if exists
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setSubtitles([]); // Reset subtitles on new video
      toast.success("Video uploaded successfully.");
    }
  };

  const handleGenerateSubtitles = async () => {
    if (!videoFile) return;
    setIsGenerating(true);
    try {
        const generated = await subtitleService.transcribeVideo(videoFile);
        setSubtitles(generated);
        toast.success("Subtitles generated successfully!");
    } catch (e) {
        console.error(e);
        toast.error("Failed to generate subtitles. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDownloadSRT = () => {
    const srtContent = subtitleService.generateSRT(subtitles);
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subtitles_${Date.now()}.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("SRT file downloaded.");
  };

  const togglePlay = () => {
    if (videoRef.current) {
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Get current subtitle to display overlay
  const currentSubtitle = subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime);

  // --- Render ---

  return (
    <div className="flex flex-col h-full bg-dark-900">
      {/* Header */}
      <div className="h-16 border-b border-dark-700 bg-dark-800 flex items-center justify-between px-6">
        <div className="flex items-center">
            <div className="w-8 h-8 rounded bg-blue-600/20 text-blue-500 flex items-center justify-center mr-3">
                <Captions size={18} />
            </div>
            <div>
                <h1 className="text-lg font-bold text-white">Subtitle Studio</h1>
                <p className="text-xs text-gray-500">Powered by Vosk Engine (Offline Mode)</p>
            </div>
        </div>
        <div className="flex space-x-3">
            <Button variant="ghost" onClick={onBack}>Cancel</Button>
            {subtitles.length > 0 && (
                 <Button onClick={handleDownloadSRT} leftIcon={<Download size={16} />}>
                    Download .SRT
                 </Button>
            )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Video Preview */}
        <div className="flex-1 bg-black flex flex-col items-center justify-center relative p-8">
            {!videoUrl ? (
                <div className="border-2 border-dashed border-dark-600 rounded-2xl p-12 text-center bg-dark-800/50 hover:bg-dark-800 hover:border-blue-500/50 transition-all">
                    <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">Upload Video</h3>
                    <p className="text-gray-400 mb-6">Drag & drop or click to upload MP4, MOV, or WEBM<br/><span className="text-xs text-gray-600">(Max 100MB)</span></p>
                    <input 
                        type="file" 
                        accept="video/*" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        id="video-upload"
                    />
                    <label htmlFor="video-upload">
                        <Button as="span" className="cursor-pointer" variant="primary">
                            Select File
                        </Button>
                    </label>
                </div>
            ) : (
                <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-dark-800 group">
                    <video 
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-contain"
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                        onEnded={() => setIsPlaying(false)}
                    />
                    
                    {/* Subtitle Overlay */}
                    {currentSubtitle && (
                        <div className="absolute bottom-12 left-0 right-0 text-center px-8 pointer-events-none">
                            <span className="bg-black/60 text-white px-3 py-1.5 rounded text-lg backdrop-blur-sm shadow-md inline-block">
                                {currentSubtitle.text}
                            </span>
                        </div>
                    )}

                    {/* Controls Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={togglePlay}
                            className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur flex items-center justify-center text-white transition-all transform hover:scale-110"
                         >
                             {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                         </button>
                    </div>

                    <button 
                        onClick={() => { setVideoUrl(null); setVideoFile(null); }}
                        className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>

        {/* Right: Sidebar Editor */}
        <div className="w-96 bg-dark-800 border-l border-dark-700 flex flex-col">
            {videoFile ? (
                <>
                    <div className="p-6 border-b border-dark-700">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Transcription</h2>
                        
                        {subtitles.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Wand2 size={24} />
                                </div>
                                <p className="text-white font-medium mb-1">Ready to transcribe</p>
                                <p className="text-xs text-gray-500 mb-6">Using Vosk Speech-to-Text Engine</p>
                                <Button 
                                    onClick={handleGenerateSubtitles} 
                                    isLoading={isGenerating}
                                    className="w-full"
                                >
                                    {isGenerating ? 'Analyzing Audio...' : 'Generate Subtitles'}
                                </Button>
                                {isGenerating && (
                                    <div className="mt-4 w-full bg-dark-700 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-blue-500 h-full animate-pulse w-2/3 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                <div className="flex items-center text-green-400 text-sm">
                                    <CheckCircle2 size={16} className="mr-2" />
                                    <span>Sync Complete</span>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => setSubtitles([])} className="text-xs h-6 px-2">
                                    Reset
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Subtitle List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {subtitles.map((sub, idx) => (
                            <div 
                                key={sub.id} 
                                className={`p-3 rounded-lg border text-sm transition-all cursor-pointer ${
                                    currentTime >= sub.startTime && currentTime <= sub.endTime
                                    ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500'
                                    : 'bg-dark-900 border-dark-700 hover:border-dark-600'
                                }`}
                                onClick={() => {
                                    if(videoRef.current) {
                                        videoRef.current.currentTime = sub.startTime;
                                        setCurrentTime(sub.startTime);
                                    }
                                }}
                            >
                                <div className="flex justify-between text-xs text-gray-500 mb-1 font-mono">
                                    <span>{new Date(sub.startTime * 1000).toISOString().substr(14, 5)}</span>
                                    <span>{new Date(sub.endTime * 1000).toISOString().substr(14, 5)}</span>
                                </div>
                                <textarea 
                                    className="w-full bg-transparent border-none text-gray-200 p-0 focus:ring-0 resize-none text-sm"
                                    value={sub.text}
                                    rows={2}
                                    onChange={(e) => {
                                        const newSubs = [...subtitles];
                                        newSubs[idx].text = e.target.value;
                                        setSubtitles(newSubs);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                    <Film size={48} className="mb-4 opacity-20" />
                    <p>Upload a video to start generating subtitles.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};