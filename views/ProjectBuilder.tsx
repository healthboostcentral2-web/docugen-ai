import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, 
  Type, 
  Image as ImageIcon, 
  Music, 
  Play, 
  Save, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  RefreshCw,
  Download,
  Zap,
  Clock,
  Layout,
  FileText,
  Sparkles,
  Globe,
  Video,
  Search,
  Film,
  Pause,
  Maximize2,
  Loader2,
  Terminal,
  Check,
  AlertTriangle,
  X
} from 'lucide-react';
import { Button } from '../components/Button';
import { LANGUAGES, Scene, VOICE_NAMES, User, Project, VideoStyle, VideoDuration, VIDEO_STYLES, RenderJob } from '../types';
import * as gemini from '../services/geminiService';
import { stockMediaService, StockResult } from '../services/stockMediaService';
import { projectService } from '../services/projectService';
import { videoRenderingService } from '../services/videoRenderingService';
import { useToast } from '../components/ToastProvider';

interface ProjectBuilderProps {
  user: User;
  onBack: () => void;
  existingProject?: Project; // If editing
}

const STEPS = ['Setup & Script', 'Audio', 'Visuals', 'Preview'];

export const ProjectBuilder: React.FC<ProjectBuilderProps> = ({ user, onBack, existingProject }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Input Modes
  const [inputMode, setInputMode] = useState<'topic' | 'script'>('topic');

  // Project State
  const [projectId, setProjectId] = useState<string>(existingProject?.id || '');
  const [topic, setTopic] = useState(existingProject?.topic || '');
  const [manualScript, setManualScript] = useState(existingProject?.script || '');
  
  const [inputLanguage, setInputLanguage] = useState(existingProject?.inputLanguage || 'en');
  const [language, setLanguage] = useState(existingProject?.language || 'en');
  
  const [style, setStyle] = useState<VideoStyle>(existingProject?.style || 'documentary');
  const [duration, setDuration] = useState<VideoDuration>(existingProject?.durationLevel || 'short');
  
  const [scenes, setScenes] = useState<Scene[]>(existingProject?.scenes || []);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [backgroundMusic, setBackgroundMusic] = useState<string | undefined>(existingProject?.backgroundMusicUrl);
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Rendering State
  const [isRenderingModalOpen, setIsRenderingModalOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<RenderJob | null>(null);

  // Stock Search State
  const [activeSearchScene, setActiveSearchScene] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<StockResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingStock, setIsSearchingStock] = useState(false);
  
  // Audio Playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  const toast = useToast();

  // --- Core Actions ---

  const saveProject = async (silent = false) => {
    if ((inputMode === 'topic' && !topic) || (inputMode === 'script' && !manualScript)) return;
    if (!silent) setIsSaving(true);
    
    const projectData: Project = {
        id: projectId || `proj_${Date.now()}`,
        userId: user.id,
        title: inputMode === 'topic' ? topic : 'My Script Video', 
        topic: inputMode === 'topic' ? topic : 'Manual Script',
        inputLanguage,
        language,
        style,
        durationLevel: duration,
        status: currentStep === 3 ? 'completed' : 'draft',
        createdAt: existingProject?.createdAt || new Date().toISOString(),
        scenes,
        script: manualScript,
        backgroundMusicUrl: backgroundMusic
    };

    try {
        const saved = await projectService.saveProject(projectData);
        setProjectId(saved.id);
        setLastSaved(new Date());
        if (!silent) toast.success("Project saved.");
        return saved;
    } catch (e) {
        console.error("Save failed", e);
        toast.error("Failed to save project.");
    } finally {
        if (!silent) setIsSaving(false);
    }
  };

  // --- Rendering Flow ---

  const handleExportVideo = async () => {
    // 1. Save first
    const savedProject = await saveProject(true);
    if (!savedProject) return;

    // 2. Start Render
    setIsRenderingModalOpen(true);
    try {
        const jobId = await videoRenderingService.startRender(savedProject);
        
        // 3. Poll for status
        const poll = setInterval(async () => {
            const job = await videoRenderingService.getJobStatus(jobId);
            setCurrentJob({...job}); // Copy to trigger re-render
            
            if (job.status === 'completed' || job.status === 'failed') {
                clearInterval(poll);
                if (job.status === 'completed') toast.success("Video rendered successfully!");
                else toast.error("Video rendering failed.");
            }
        }, 1000);
    } catch (e) {
        toast.error("Failed to start rendering engine.");
        setIsRenderingModalOpen(false);
    }
  };

  const downloadFile = (url: string, filename: string) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Started download: ${filename}`);
  };

  // --- Automation Flows ---

  const handleFullAutomation = async () => {
    setIsProcessing(true);
    try {
        const inputLangName = LANGUAGES.find(l => l.code === inputLanguage)?.name || 'English';
        const outputLangName = LANGUAGES.find(l => l.code === language)?.name || 'English';

        // 1. Script Generation
        setProcessingStatus('Creating professional script...');
        let generatedScenes: Scene[] = [];
        
        if (inputMode === 'topic') {
            generatedScenes = await gemini.generateScript(topic, inputLangName, outputLangName, style, duration);
        } else {
            generatedScenes = await gemini.parseManualScript(manualScript, inputLangName, outputLangName);
        }
        
        // 2. Music Selection (Auto-select based on style)
        setProcessingStatus('Composing background score...');
        const musicUrl = stockMediaService.getBackgroundMusic(style);
        setBackgroundMusic(musicUrl);
        
        // 3. Parallel Processing: Audio & Visuals
        const scenesToProcess = [...generatedScenes];
        
        // Loop through scenes
        for (let i = 0; i < scenesToProcess.length; i++) {
             const scene = scenesToProcess[i];
             setProcessingStatus(`Production: Scene ${i+1}/${scenesToProcess.length}...`);
             
             // A. Generate Voice
             if (!scene.audioUrl) {
                const audioUrl = await gemini.generateSpeech(scene.text, selectedVoice);
                scene.audioUrl = audioUrl;
                // Estimate better duration from word count now that we have audio text confirmed
                // (Roughly 150 words per minute => 2.5 words per sec)
                scene.duration = Math.max(3, scene.text.split(' ').length / 2.5);
             }

             // B. Generate Visuals (Prefer Stock Video for Docu, else Image)
             scene.mediaType = 'video'; // Default to video for quality feel
             const keyword = await stockMediaService.extractKeywords(scene.text);
             const videos = await stockMediaService.searchVideos(keyword);
             
             if (videos.length > 0) {
                 scene.stockVideoUrl = videos[0].videoUrl;
             } else {
                 // Fallback to AI Image if no good video found
                 scene.mediaType = 'image';
                 const fullPrompt = `${style} style, cinematic 4k: ${scene.visualPrompt}`;
                 const imageUrl = await gemini.generateSceneImage(fullPrompt);
                 scene.imageUrl = imageUrl;
             }
             
             // Update scene in array
             scenesToProcess[i] = scene;
             setScenes([...scenesToProcess]); // Update UI incrementally
             
             // Small delay to prevent rate limits
             await new Promise(r => setTimeout(r, 200)); 
        }

        // Finalize
        setScenes(scenesToProcess);
        setProcessingStatus('Rendering final preview...');
        await saveProject(true);
        setCurrentStep(3); // Jump to Preview
        toast.success("Full generation complete!");

    } catch (e) {
        console.error(e);
        toast.error("An error occurred during automation. Please try again.");
    } finally {
        setIsProcessing(false);
        setProcessingStatus('');
    }
  };

  const handleGenerateScriptOnly = async () => {
    setIsProcessing(true);
    try {
        const inputLangName = LANGUAGES.find(l => l.code === inputLanguage)?.name || 'English';
        const outputLangName = LANGUAGES.find(l => l.code === language)?.name || 'English';

        let generatedScenes: Scene[] = [];
        if (inputMode === 'topic') {
            generatedScenes = await gemini.generateScript(topic, inputLangName, outputLangName, style, duration);
        } else {
            generatedScenes = await gemini.parseManualScript(manualScript, inputLangName, outputLangName);
        }
        setScenes(generatedScenes);
        setTimeout(() => saveProject(true), 100);
        setCurrentStep(1);
        toast.success("Script generated.");
    } catch (e) {
        toast.error("Failed to generate script.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleGenerateAllAudio = async () => {
    const updatedScenes = [...scenes];
    let errors = 0;
    for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        if (!scene.audioUrl) {
            updatedScenes[i].isGeneratingAudio = true;
            setScenes([...updatedScenes]);
            try {
                const audioUrl = await gemini.generateSpeech(scene.text, selectedVoice);
                updatedScenes[i].audioUrl = audioUrl;
            } catch (e) { 
                console.error(e); 
                errors++;
            }
            updatedScenes[i].isGeneratingAudio = false;
            setScenes([...updatedScenes]);
        }
    }
    saveProject(true);
    setCurrentStep(2);
    if(errors > 0) toast.error(`Completed with ${errors} errors.`);
    else toast.success("Audio generated successfully.");
  };

  // --- Visuals Logic ---
  
  const handleAutoMatchStock = async () => {
      // Switch all to video
      const newScenes = scenes.map(s => ({ ...s, mediaType: 'video' as const }));
      setScenes(newScenes);
      
      setIsProcessing(true);
      setProcessingStatus("Matching stock footage to script...");
      
      try {
          const matchedScenes = await stockMediaService.autoMatchScenes(newScenes);
          setScenes(matchedScenes);
          toast.success("Stock footage matched.");
      } catch(e) {
          console.error(e);
          toast.error("Failed to match stock footage.");
      } finally {
          setIsProcessing(false);
          setProcessingStatus('');
      }
  };

  const handleManualStockSearch = async (query: string) => {
      setIsSearchingStock(true);
      try {
          const results = await stockMediaService.searchVideos(query);
          setSearchResults(results);
      } finally {
          setIsSearchingStock(false);
      }
  };

  const handleGenerateAllVisuals = async () => {
     // Switch all to image
     const updatedScenes = scenes.map(s => ({ ...s, mediaType: 'image' as const }));
     let errors = 0;
    for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        if (!scene.imageUrl && scene.visualPrompt) {
            updatedScenes[i].isGeneratingImage = true;
            setScenes([...updatedScenes]);
            try {
                const fullPrompt = `${style} style, cinematic 4k: ${scene.visualPrompt}`;
                const imageUrl = await gemini.generateSceneImage(fullPrompt);
                updatedScenes[i].imageUrl = imageUrl;
            } catch (e) { 
                console.error(e);
                errors++;
            }
            updatedScenes[i].isGeneratingImage = false;
            setScenes([...updatedScenes]);
        }
    }
    saveProject(true);
    setCurrentStep(3);
    if(errors > 0) toast.error(`Completed with ${errors} errors.`);
    else toast.success("Visuals generated successfully.");
  };

  // --- Render Logic (Browser Preview) ---

  useEffect(() => {
    // Reset players on unmount or step change
    return () => {
        if (audioRef.current) { audioRef.current.pause(); }
        if (bgMusicRef.current) { bgMusicRef.current.pause(); }
    };
  }, [currentStep]);

  useEffect(() => {
    // Music Player Logic
    if (bgMusicRef.current) {
        if (isPlaying && backgroundMusic) {
            bgMusicRef.current.volume = 0.2; // Background volume low
            bgMusicRef.current.play().catch(e => console.log("Auto-play blocked", e));
        } else {
            bgMusicRef.current.pause();
        }
    }

    if (currentStep === 3 && isPlaying) {
      const playSequence = async () => {
        for (let i = 0; i < scenes.length; i++) {
          if (!isPlaying) break;
          // Ensure scene exists (safety check)
          if (!scenes[i]) break; 
          
          setCurrentSceneIndex(i);
          const scene = scenes[i];
          
          if (scene.audioUrl) {
            const audio = new Audio(scene.audioUrl);
            audioRef.current = audio;
            await new Promise<void>((resolve) => {
              audio.onended = () => resolve();
              audio.play().catch(() => resolve()); // Robust play handling
            });
          } else {
             await new Promise(r => setTimeout(r, (scene.duration || 3) * 1000));
          }
        }
        setIsPlaying(false);
        setCurrentSceneIndex(0);
      };
      playSequence();
    } else if (!isPlaying && audioRef.current) {
        audioRef.current.pause();
    }
  }, [currentStep, isPlaying, backgroundMusic]);

  // ... (Step 0, 1, 2 render functions unchanged, will just output renderPreview for brevity of change)

  const renderSetupStep = () => (
      <div className="max-w-5xl mx-auto space-y-8 pb-10">
          
          {/* Header */}
          <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-white mb-2">Create New Video</h1>
              <p className="text-gray-400">Transform your ideas into professional videos in minutes.</p>
          </div>

          {/* Input Mode Tabs */}
          <div className="flex justify-center mb-8">
              <div className="bg-dark-800 p-1 rounded-xl flex space-x-1 border border-dark-700">
                  <button 
                    onClick={() => setInputMode('topic')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center ${
                        inputMode === 'topic' 
                        ? 'bg-brand-600 text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-dark-700'
                    }`}
                  >
                      <Wand2 size={16} className="mr-2" />
                      AI Topic to Video
                  </button>
                  <button 
                    onClick={() => setInputMode('script')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center ${
                        inputMode === 'script' 
                        ? 'bg-brand-600 text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-dark-700'
                    }`}
                  >
                      <FileText size={16} className="mr-2" />
                      Script to Video
                  </button>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Input */}
              <div className="lg:col-span-2 space-y-6">
                  <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                      <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                          {inputMode === 'topic' ? '1. What is your video about?' : '1. Enter your script'}
                      </h2>
                      
                      {inputMode === 'topic' ? (
                          <textarea 
                              value={topic}
                              onChange={(e) => setTopic(e.target.value)}
                              className="w-full bg-dark-900 border border-dark-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-brand-500 outline-none h-40 resize-none text-lg placeholder-gray-600"
                              placeholder="e.g. A documentary about the future of space exploration and colonization of Mars..."
                          />
                      ) : (
                          <textarea 
                              value={manualScript}
                              onChange={(e) => setManualScript(e.target.value)}
                              className="w-full bg-dark-900 border border-dark-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-brand-500 outline-none h-64 resize-none text-sm font-mono placeholder-gray-600"
                              placeholder="Paste your full script here..."
                          />
                      )}
                  </div>

                  {/* Style Selection */}
                  <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                      <h2 className="text-xl font-semibold text-white mb-4">2. Choose a Style</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {VIDEO_STYLES.map((s) => (
                              <div 
                                key={s.id}
                                onClick={() => setStyle(s.id)}
                                className={`cursor-pointer border rounded-lg p-3 transition-all ${
                                    style === s.id 
                                    ? 'bg-brand-500/10 border-brand-500 ring-1 ring-brand-500' 
                                    : 'bg-dark-900/50 border-dark-700 hover:border-brand-500/50 hover:bg-dark-700'
                                }`}
                              >
                                  <div className="font-medium text-white mb-1">{s.label}</div>
                                  <div className="text-xs text-gray-500 leading-tight">{s.description}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Right Column: Settings */}
              <div className="space-y-6">
                   <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 space-y-6 sticky top-6">
                        <h2 className="text-xl font-semibold text-white flex items-center">
                            <Globe size={18} className="mr-2 text-brand-400" />
                            Global Settings
                        </h2>
                        
                        {/* Language Settings */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Input Language</label>
                                <select 
                                    value={inputLanguage}
                                    onChange={(e) => setInputLanguage(e.target.value)}
                                    className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                >
                                    {LANGUAGES.map(l => (
                                        <option key={l.code} value={l.code}>{l.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Language of your topic or script.</p>
                            </div>

                            <div className="relative">
                                <div className="absolute left-1/2 -top-3 -ml-3 bg-dark-800 p-1 rounded-full border border-dark-600 z-10">
                                    <ChevronRight size={14} className="text-gray-500 rotate-90" />
                                </div>
                                <div className="border-t border-dark-700 mb-3"></div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2 text-brand-400">Target Video Language</label>
                                <select 
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full bg-dark-900 border border-brand-500/30 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                >
                                    {LANGUAGES.map(l => (
                                        <option key={l.code} value={l.code}>{l.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Language for voiceover and subtitles.</p>
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="pt-2 border-t border-dark-700">
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex justify-between mt-4">
                                <span>Target Duration</span>
                                <span className="text-brand-400 text-xs uppercase">{duration}</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'short', label: '< 1 min' },
                                    { id: 'medium', label: '1 - 5 min' },
                                    { id: 'long', label: 'Up to 30m' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setDuration(opt.id as VideoDuration)}
                                        className={`py-2 rounded-lg text-xs font-medium border ${
                                            duration === opt.id
                                            ? 'bg-brand-500 text-white border-brand-500'
                                            : 'bg-dark-900 border-dark-700 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                         {/* Actions */}
                        <div className="pt-4 space-y-3">
                            <Button 
                                onClick={handleFullAutomation}
                                isLoading={isProcessing}
                                disabled={(!topic && inputMode === 'topic') || (!manualScript && inputMode === 'script')}
                                className="w-full py-4 text-base bg-gradient-to-r from-brand-600 to-brand-400 hover:from-brand-500 hover:to-brand-300 border-none shadow-xl shadow-brand-900/30"
                                leftIcon={<Sparkles size={18} fill="currentColor" />}
                            >
                                {isProcessing ? 'Production in Progress...' : 'GENERATE FULL DOCUMENTARY'}
                            </Button>
                            
                            <Button 
                                variant="secondary"
                                onClick={handleGenerateScriptOnly}
                                disabled={isProcessing || (!topic && inputMode === 'topic') || (!manualScript && inputMode === 'script')}
                                className="w-full"
                            >
                                Generate Script Only
                            </Button>
                        </div>

                        {isProcessing && (
                            <div className="bg-dark-900/50 rounded-lg p-3 text-center border border-dark-700 animate-pulse">
                                <p className="text-sm text-brand-400">{processingStatus}</p>
                            </div>
                        )}
                   </div>
              </div>
          </div>
      </div>
  );

  const renderScriptReview = () => (
    <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Review Script & Generate Audio</h2>
            <div className="flex items-center space-x-3">
                <select 
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                    {VOICE_NAMES.map(v => <option key={v} value={v}>{v} (AI Voice)</option>)}
                </select>
                <Button onClick={handleGenerateAllAudio} leftIcon={<Music size={16} />}>
                    Generate Voices
                </Button>
            </div>
        </div>
        <div className="space-y-4">
            {scenes.map((scene, idx) => (
                <div key={scene.id} className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-sm font-bold text-gray-400 flex-shrink-0">
                        {idx + 1}
                    </div>
                    <div className="flex-1">
                        <textarea 
                            className="w-full bg-transparent border-none text-white p-0 focus:ring-0 resize-none h-auto min-h-[60px]"
                            value={scene.text}
                            onChange={(e) => {
                                const newScenes = [...scenes];
                                newScenes[idx].text = e.target.value;
                                setScenes(newScenes);
                            }}
                        />
                        {scene.audioUrl && (
                            <div className="mt-2 flex items-center text-xs text-brand-400">
                                <CheckCircle2 size={12} className="mr-1" /> Audio Ready
                            </div>
                        )}
                        {scene.isGeneratingAudio && (
                                <div className="mt-2 flex items-center text-xs text-yellow-400">
                                <RefreshCw size={12} className="mr-1 animate-spin" /> Generating Voice...
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderVisuals = () => (
    <div className="max-w-7xl mx-auto h-[calc(100vh-200px)] flex gap-6">
        
        {/* Left: Scenes Grid */}
        <div className="flex-1 flex flex-col min-w-0">
             <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold">Visual Studio</h2>
                <div className="flex space-x-2">
                     <Button 
                        variant="secondary"
                        onClick={handleAutoMatchStock} 
                        leftIcon={<Film size={16} />}
                        disabled={isProcessing}
                    >
                        Auto-Match Stock
                    </Button>
                    <Button 
                        onClick={handleGenerateAllVisuals} 
                        leftIcon={<ImageIcon size={16} />}
                        disabled={isProcessing}
                    >
                        Generate All (AI)
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-20">
                {scenes.map((scene, idx) => (
                    <div 
                        key={scene.id} 
                        className={`bg-dark-800 border rounded-lg overflow-hidden flex flex-col transition-all ${
                            activeSearchScene === scene.id ? 'border-brand-500 ring-1 ring-brand-500' : 'border-dark-700'
                        }`}
                    >
                        {/* Preview Area */}
                        <div className="aspect-video bg-black relative flex items-center justify-center group">
                            {scene.mediaType === 'video' && scene.stockVideoUrl ? (
                                <video 
                                    src={scene.stockVideoUrl} 
                                    className="w-full h-full object-cover" 
                                    controls={false}
                                    muted
                                    onMouseOver={(e) => e.currentTarget.play()}
                                    onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                />
                            ) : scene.imageUrl ? (
                                <img src={scene.imageUrl} alt="Scene" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-4">
                                    {scene.isGeneratingImage ? (
                                        <RefreshCw className="animate-spin text-brand-500" />
                                    ) : (
                                        <p className="text-xs text-gray-500 mb-2">No visual selected</p>
                                    )}
                                </div>
                            )}

                            {/* Toggle Type Controls */}
                            <div className="absolute top-2 right-2 flex bg-black/60 backdrop-blur rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    className={`p-1.5 rounded ${scene.mediaType === 'image' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => {
                                        const newScenes = [...scenes];
                                        newScenes[idx].mediaType = 'image';
                                        setScenes(newScenes);
                                    }}
                                >
                                    <ImageIcon size={14} />
                                </button>
                                <button 
                                    className={`p-1.5 rounded ${scene.mediaType === 'video' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => {
                                        const newScenes = [...scenes];
                                        newScenes[idx].mediaType = 'video';
                                        setScenes(newScenes);
                                    }}
                                >
                                    <Video size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-3 border-t border-dark-700 bg-dark-800/50 flex-1 flex flex-col">
                            <p className="text-xs text-gray-400 line-clamp-2 mb-3">Scene {idx+1}: {scene.text}</p>
                            
                            <div className="mt-auto flex justify-between items-center">
                                {scene.mediaType === 'video' ? (
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="w-full text-xs py-1 h-8"
                                        onClick={() => {
                                            setActiveSearchScene(scene.id);
                                            setSearchQuery(''); 
                                            // Pre-fill search with keyword
                                            stockMediaService.extractKeywords(scene.text).then(k => {
                                                setSearchQuery(k);
                                                handleManualStockSearch(k);
                                            });
                                        }}
                                    >
                                        <Search size={12} className="mr-1" /> Search Stock
                                    </Button>
                                ) : (
                                    <Button 
                                        size="sm" 
                                        variant="secondary" 
                                        className="w-full text-xs py-1 h-8"
                                        onClick={() => {
                                            const newScenes = [...scenes];
                                            newScenes[idx].isGeneratingImage = true;
                                            setScenes(newScenes);
                                            gemini.generateSceneImage(`${style} style: ${scene.visualPrompt || scene.text}`).then(url => {
                                                const s = [...scenes];
                                                s[idx].imageUrl = url;
                                                s[idx].isGeneratingImage = false;
                                                setScenes(s);
                                            });
                                        }}
                                    >
                                        <Wand2 size={12} className="mr-1" /> Generate Image
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Right: Stock Search Panel (Overlay or Side) */}
        {activeSearchScene && (
            <div className="w-80 bg-dark-800 border-l border-dark-700 flex flex-col animate-in slide-in-from-right">
                <div className="p-4 border-b border-dark-700 flex justify-between items-center">
                    <h3 className="font-semibold text-white">Stock Library</h3>
                    <button onClick={() => setActiveSearchScene(null)} className="text-gray-400 hover:text-white"><ChevronRight /></button>
                </div>
                
                <div className="p-4">
                    <div className="relative mb-4">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualStockSearch(searchQuery)}
                            className="w-full bg-dark-900 border border-dark-600 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:ring-1 focus:ring-brand-500"
                            placeholder="Search videos..."
                        />
                        <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
                    </div>

                    {isSearchingStock ? (
                         <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-brand-500" /></div>
                    ) : (
                        <div className="space-y-3 overflow-y-auto h-[calc(100vh-350px)]">
                            {searchResults.map((res) => (
                                <div 
                                    key={res.id} 
                                    className="group relative rounded-lg overflow-hidden border border-dark-700 hover:border-brand-500 cursor-pointer"
                                    onClick={() => {
                                        const sceneIdx = scenes.findIndex(s => s.id === activeSearchScene);
                                        if (sceneIdx >= 0) {
                                            const newScenes = [...scenes];
                                            newScenes[sceneIdx].stockVideoUrl = res.videoUrl;
                                            newScenes[sceneIdx].mediaType = 'video';
                                            setScenes(newScenes);
                                            setActiveSearchScene(null);
                                        }
                                    }}
                                >
                                    <video src={res.videoUrl} className="w-full h-24 object-cover" muted onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                                    <div className="absolute bottom-1 right-1 bg-black/70 px-1 rounded text-[10px] text-white">
                                        {res.duration}s
                                    </div>
                                    <div className="absolute top-1 left-1 bg-brand-600/90 px-1.5 rounded text-[10px] text-white font-medium">
                                        {res.provider}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );

  // Step 3: Preview (Updated to handle video)
  const renderPreview = () => (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-full">
        {backgroundMusic && (
             <audio ref={bgMusicRef} src={backgroundMusic} loop />
        )}
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative border border-dark-700 mb-6 group">
            {scenes[currentSceneIndex]?.mediaType === 'video' && scenes[currentSceneIndex]?.stockVideoUrl ? (
                 <video 
                    ref={(el) => {
                        // We manage video element directly for sequencing
                        if (el && isPlaying && currentSceneIndex >= 0) {
                           // Ensure play if visible
                           el.play().catch(() => {});
                        }
                    }}
                    src={scenes[currentSceneIndex].stockVideoUrl} 
                    className="w-full h-full object-cover"
                    loop
                    muted // Muted because we play TTS audio separately
                />
            ) : scenes[currentSceneIndex]?.imageUrl ? (
                <img 
                    src={scenes[currentSceneIndex].imageUrl} 
                    className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${isPlaying ? 'scale-110' : 'scale-100'}`} 
                    alt="Scene"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <p>No Visual Generated for this scene</p>
                </div>
            )}
            
            {/* Auto Subtitle Overlay */}
            <div className="absolute bottom-12 left-0 right-0 text-center px-8">
                <span className="bg-black/60 text-white px-4 py-2 rounded-lg text-lg backdrop-blur-sm shadow-lg inline-block font-medium animate-in slide-in-from-bottom-2 fade-in">
                    {scenes[currentSceneIndex]?.text}
                </span>
            </div>

            {/* Play Button Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <button 
                        onClick={() => setIsPlaying(true)}
                        className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-all transform hover:scale-110 group"
                    >
                        <Play size={40} className="text-white fill-current ml-2 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            )}
        </div>
        <div className="flex items-center space-x-4">
             <Button 
                variant="secondary" 
                onClick={() => { setIsPlaying(!isPlaying); }}
                leftIcon={isPlaying ? <Pause size={18} /> : <Play size={18} />}
            >
                {isPlaying ? 'Pause' : 'Resume'}
            </Button>
            <Button 
                variant="secondary" 
                onClick={() => { setIsPlaying(false); setCurrentSceneIndex(0); }}
            >
                Restart Preview
            </Button>
            <Button 
                variant="primary" 
                onClick={handleExportVideo}
                leftIcon={<Download size={18} />}
                className="bg-brand-600 hover:bg-brand-500 shadow-xl shadow-brand-900/30"
            >
                Export Video (MP4)
            </Button>
        </div>
    </div>
  );

  const renderCurrentStep = () => {
      switch(currentStep) {
          case 0: return renderSetupStep();
          case 1: return renderScriptReview();
          case 2: return renderVisuals();
          case 3: return renderPreview();
          default: return null;
      }
  };

  return (
    <div className="flex flex-col h-screen bg-dark-900 relative">
        {/* Top Navigation Bar */}
        <div className="h-16 border-b border-dark-700 flex items-center justify-between px-6 bg-dark-800 shadow-md z-20">
            <div className="flex items-center">
                <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center mr-6 transition-colors">
                    <ChevronLeft className="mr-1" /> Back
                </button>
                <div className="hidden md:flex space-x-2">
                    {STEPS.map((step, idx) => (
                        <div key={step} className="flex items-center">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                currentStep === idx 
                                    ? 'bg-brand-500 text-white' 
                                    : currentStep > idx 
                                        ? 'bg-brand-900/40 text-brand-400' 
                                        : 'bg-dark-700 text-gray-600'
                            }`}>
                                {idx + 1}. {step}
                            </div>
                            {idx < STEPS.length - 1 && <div className="w-4 h-0.5 bg-dark-700 mx-2" />}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex items-center space-x-3">
                {lastSaved && <span className="text-xs text-gray-500 hidden sm:inline">Saved {lastSaved.toLocaleTimeString()}</span>}
                <Button 
                    size="sm" 
                    variant="outline" 
                    leftIcon={isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                    onClick={() => saveProject()}
                    disabled={isSaving || (inputMode === 'topic' ? !topic : !manualScript)}
                >
                    Save
                </Button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-dark-900 scroll-smooth">
             {/* Background decoration */}
             {currentStep === 0 && (
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-900/10 blur-[100px] rounded-full pointer-events-none" />
             )}
            
            {renderCurrentStep()}
        </div>
        
        {/* Navigation Footer (only for Steps > 0) */}
        {currentStep > 0 && (
            <div className="h-20 border-t border-dark-700 bg-dark-800 flex items-center justify-between px-8 z-20">
                <Button 
                    variant="ghost" 
                    onClick={() => setCurrentStep(p => p - 1)}
                >
                    Previous Step
                </Button>
                
                {currentStep < 3 && (
                    <Button 
                        onClick={() => setCurrentStep(p => p+1)}
                        rightIcon={<ChevronRight size={18} />}
                    >
                        Next Step
                    </Button>
                )}
            </div>
        )}

        {/* Render Engine Modal */}
        {isRenderingModalOpen && currentJob && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-6 animate-in fade-in">
                <div className="w-full max-w-2xl bg-dark-800 border border-dark-600 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                    {/* Header */}
                    <div className="bg-dark-900 p-4 border-b border-dark-700 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <Terminal size={20} className="text-brand-400" />
                            <h3 className="font-mono font-bold text-white">
                                {currentJob.status === 'completed' ? 'Export Center' : 'Rendering Engine'}
                            </h3>
                        </div>
                        {currentJob.status === 'completed' && (
                             <button onClick={() => setIsRenderingModalOpen(false)} className="text-gray-400 hover:text-white">
                                 <X size={20} />
                             </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col overflow-y-auto">
                        
                        {/* Progress Bar (Visible if not complete) */}
                        {currentJob.status !== 'completed' && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                     <span className="text-sm font-medium text-gray-300">{currentJob.currentStep}</span>
                                     <span className="text-sm font-mono text-brand-400">{currentJob.progress}%</span>
                                </div>
                                <div className="w-full bg-dark-700 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-brand-500 transition-all duration-300 ease-out"
                                        style={{ width: `${currentJob.progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {currentJob.status === 'processing' || currentJob.status === 'queued' ? (
                            <div className="flex-1 bg-black rounded-lg p-4 font-mono text-xs text-green-400 overflow-y-auto mb-6 border border-dark-700 shadow-inner min-h-[300px]">
                                {currentJob.logs.map((log, i) => (
                                    <div key={i} className="mb-1 opacity-90 border-l-2 border-transparent hover:border-green-800 pl-2">
                                        {log}
                                    </div>
                                ))}
                                <div className="animate-pulse">_</div>
                            </div>
                        ) : currentJob.status === 'completed' && currentJob.assets ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Check size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Rendering Complete!</h2>
                                    <p className="text-gray-400">Your video is ready for download.</p>
                                </div>

                                {/* Video Player */}
                                <div className="rounded-xl overflow-hidden border border-dark-600 shadow-2xl bg-black aspect-video">
                                    <video controls className="w-full h-full" src={currentJob.assets.video1080p} />
                                </div>

                                {/* Download Options */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-dark-700/50 p-4 rounded-xl border border-dark-600 flex items-center justify-between hover:bg-dark-700 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-brand-500/20 text-brand-400 rounded-lg">
                                                <Film size={20} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">MP4 Video</div>
                                                <div className="text-xs text-gray-500">1080p Full HD</div>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => downloadFile(currentJob.assets!.video1080p, 'video_1080p.mp4')}>
                                            Download
                                        </Button>
                                    </div>

                                     <div className="bg-dark-700/50 p-4 rounded-xl border border-dark-600 flex items-center justify-between hover:bg-dark-700 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                                                <Film size={20} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">MP4 Video</div>
                                                <div className="text-xs text-gray-500">720p HD (Faster)</div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="secondary" onClick={() => downloadFile(currentJob.assets!.video720p, 'video_720p.mp4')}>
                                            Download
                                        </Button>
                                    </div>

                                     <div className="bg-dark-700/50 p-4 rounded-xl border border-dark-600 flex items-center justify-between hover:bg-dark-700 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                                                <Music size={20} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">Audio Only</div>
                                                <div className="text-xs text-gray-500">MP3 Format</div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="secondary" onClick={() => downloadFile(currentJob.assets!.audio, 'audio.mp3')}>
                                            Download
                                        </Button>
                                    </div>

                                     <div className="bg-dark-700/50 p-4 rounded-xl border border-dark-600 flex items-center justify-between hover:bg-dark-700 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
                                                <Type size={20} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">Subtitles</div>
                                                <div className="text-xs text-gray-500">SRT Format</div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="secondary" onClick={() => downloadFile(currentJob.assets!.subtitles, 'subtitles.srt')}>
                                            Download
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-center pt-4">
                                     <Button variant="ghost" onClick={() => setIsRenderingModalOpen(false)}>Close Export Window</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-red-400">
                                <AlertTriangle className="mx-auto mb-2" />
                                <p>Rendering failed. Please try again.</p>
                                <Button variant="secondary" onClick={() => setIsRenderingModalOpen(false)} className="mt-4">Close</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};