import React, { useState, useEffect, useRef } from 'react';
import { 
  Smile, 
  Upload, 
  Mic, 
  Play, 
  Pause, 
  Download, 
  Video as VideoIcon, 
  Wand2, 
  CheckCircle2, 
  ChevronRight,
  User,
  Sparkles,
  Layout,
  Camera,
  X,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/Button';
import { Avatar, VOICE_OPTIONS, AvatarGeneration } from '../types';
import { avatarService } from '../services/avatarService';
import * as gemini from '../services/geminiService';
import { useToast } from '../components/ToastProvider';

interface AvatarStudioProps {
  onBack: () => void;
}

export const AvatarStudio: React.FC<AvatarStudioProps> = ({ onBack }) => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [scriptText, setScriptText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null); // For preview before video
  
  // Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [legalConfirmed, setLegalConfirmed] = useState(false);
  const [creationMode, setCreationMode] = useState<'upload' | 'camera' | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  
  // Video Player & Camera Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toast = useToast();

  useEffect(() => {
    const load = async () => {
        const data = await avatarService.getAvatars();
        setAvatars(data);
        if (data.length > 0) setSelectedAvatar(data[0]);
    };
    load();
  }, []);

  // --- Modal & Camera Logic ---

  const openCreationModal = () => {
      setIsModalOpen(true);
      setLegalConfirmed(false);
      setCreationMode(null);
      stopCamera();
  };

  const closeCreationModal = () => {
      setIsModalOpen(false);
      stopCamera();
  };

  const startCamera = async () => {
      if (!legalConfirmed) {
          toast.error("Please confirm legal ownership first.");
          return;
      }
      setCreationMode('camera');
      setIsCameraActive(true);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (cameraVideoRef.current) {
              cameraVideoRef.current.srcObject = stream;
          }
      } catch (e) {
          console.error("Camera failed", e);
          toast.error("Could not access camera. Please allow permissions.");
          setIsCameraActive(false);
      }
  };

  const stopCamera = () => {
      if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
          const stream = cameraVideoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          cameraVideoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
  };

  const handleCapturePhoto = async () => {
      if (!cameraVideoRef.current) return;
      
      const canvas = document.createElement('canvas');
      canvas.width = cameraVideoRef.current.videoWidth;
      canvas.height = cameraVideoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.drawImage(cameraVideoRef.current, 0, 0);
          canvas.toBlob(async (blob) => {
              if (blob) {
                  await processNewAvatar(blob);
              }
          }, 'image/jpeg');
      }
      stopCamera();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          await processNewAvatar(e.target.files[0]);
      }
  };

  const processNewAvatar = async (fileOrBlob: File | Blob) => {
      if (!legalConfirmed) {
          toast.error("Please confirm legal ownership first.");
          return;
      }

      if (fileOrBlob.size > 10 * 1024 * 1024) { // 10MB limit
          toast.error("File is too large (Max 10MB).");
          return;
      }

      setIsProcessingUpload(true);
      try {
          const newAvatar = await avatarService.createUserAvatar(fileOrBlob);
          setAvatars(prev => [...prev, newAvatar]);
          setSelectedAvatar(newAvatar);
          toast.success("Avatar created successfully!");
          closeCreationModal();
      } catch (e) {
          toast.error("Failed to process avatar image.");
      } finally {
          setIsProcessingUpload(false);
      }
  };

  // --- Generation Logic ---

  const handleGenerate = async () => {
    if (!selectedAvatar || !scriptText) return;
    setIsGenerating(true);
    setGeneratedVideoUrl(null);
    setGeneratedAudioUrl(null);

    try {
        // 1. Generate Audio (Real AI)
        const audioUrl = await gemini.generateSpeech(scriptText, selectedVoice);
        setGeneratedAudioUrl(audioUrl);

        // 2. Generate Video (Mocked Wav2Lip)
        const videoUrl = await avatarService.generateTalkingAvatar(selectedAvatar.id, scriptText, selectedVoice);
        setGeneratedVideoUrl(videoUrl);
        toast.success("Avatar video generated!");
    } catch (e) {
        console.error(e);
        toast.error("Generation failed. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 relative">
      {/* Header */}
      <div className="h-16 border-b border-dark-700 bg-dark-800 flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center">
            <div className="w-8 h-8 rounded bg-purple-600/20 text-purple-500 flex items-center justify-center mr-3">
                <Smile size={18} />
            </div>
            <div>
                <h1 className="text-lg font-bold text-white">Avatar Studio</h1>
                <p className="text-xs text-gray-500">Create talking digital humans with AI</p>
            </div>
        </div>
        <div className="flex space-x-3">
            <Button variant="ghost" onClick={onBack}>Back to Dashboard</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Configuration */}
        <div className="w-full md:w-[450px] bg-dark-800 border-r border-dark-700 flex flex-col overflow-y-auto">
            
            {/* 1. Avatar Selection */}
            <div className="p-6 border-b border-dark-700">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center">
                    <User size={14} className="mr-2" /> Select Avatar
                </h2>
                
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {/* Add New Slot */}
                    <div 
                        onClick={openCreationModal}
                        className="aspect-square rounded-xl border-2 border-dashed border-dark-600 bg-dark-900/50 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-dark-900 text-gray-500 hover:text-purple-400 transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center mb-2">
                             <Upload size={14} />
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wide">Create New</span>
                    </div>

                    {/* Existing Avatars */}
                    {avatars.map(av => (
                        <div 
                            key={av.id}
                            onClick={() => setSelectedAvatar(av)}
                            className={`aspect-square rounded-xl overflow-hidden cursor-pointer relative group border-2 transition-all ${
                                selectedAvatar?.id === av.id ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-transparent hover:border-gray-500'
                            }`}
                        >
                            <img src={av.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={av.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                <span className="text-xs text-white font-medium truncate">{av.name}</span>
                            </div>
                            {selectedAvatar?.id === av.id && (
                                <div className="absolute top-1 right-1 bg-purple-500 rounded-full p-0.5">
                                    <CheckCircle2 size={12} className="text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Script & Voice */}
            <div className="p-6 flex-1">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center">
                    <Mic size={14} className="mr-2" /> Script & Voice
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 mb-1.5 block">Avatar Voice</label>
                        <select 
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            {VOICE_OPTIONS.map(v => (
                                <option key={v.id} value={v.id}>{v.name} ({v.gender}) - {v.description}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                         <label className="text-xs text-gray-500 mb-1.5 block">Script</label>
                         <textarea 
                            value={scriptText}
                            onChange={(e) => setScriptText(e.target.value)}
                            className="w-full h-40 bg-dark-900 border border-dark-600 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none leading-relaxed placeholder-gray-600"
                            placeholder="Type what you want your avatar to say..."
                         />
                         <div className="text-right text-xs text-gray-500 mt-1">
                             {scriptText.length} characters
                         </div>
                    </div>

                    <Button 
                        onClick={handleGenerate} 
                        isLoading={isGenerating}
                        disabled={!scriptText || !selectedAvatar}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-none"
                        leftIcon={<Sparkles size={16} fill="currentColor" />}
                    >
                        {isGenerating ? 'Synthesizing Video...' : 'Generate Talking Avatar'}
                    </Button>
                </div>
            </div>
        </div>

        {/* Right: Preview Area */}
        <div className="flex-1 bg-black flex items-center justify-center p-8 relative">
            <div className="max-w-4xl w-full">
                {generatedVideoUrl ? (
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-dark-700 aspect-video bg-dark-900 group">
                        <video 
                            ref={videoRef}
                            src={generatedVideoUrl}
                            className="w-full h-full object-cover"
                            onEnded={() => setIsPlaying(false)}
                            loop
                        />
                         {/* We play the real generated TTS audio over the mock video to create the illusion */}
                        {generatedAudioUrl && isPlaying && (
                            <audio src={generatedAudioUrl} autoPlay onEnded={() => { setIsPlaying(false); videoRef.current?.pause(); }} />
                        )}
                        
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] group-hover:bg-black/40 transition-all">
                                <button 
                                    onClick={togglePlay}
                                    className="w-20 h-20 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-transform transform hover:scale-105"
                                >
                                    <Play size={32} className="text-white fill-current ml-2" />
                                </button>
                            </div>
                        )}

                        <div className="absolute bottom-6 right-6 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button size="sm" onClick={() => {
                                 const a = document.createElement('a');
                                 a.href = generatedVideoUrl;
                                 a.download = 'avatar_video.mp4';
                                 a.click();
                             }} leftIcon={<Download size={14} />}>Download</Button>
                        </div>
                    </div>
                ) : (
                    // Placeholder State
                    <div className="text-center">
                        <div className="relative inline-block mb-6">
                            {selectedAvatar ? (
                                <div className="w-64 h-64 rounded-full border-4 border-dark-700 overflow-hidden shadow-2xl mx-auto relative">
                                    <img src={selectedAvatar.imageUrl} className="w-full h-full object-cover opacity-50 grayscale" alt="" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-dark-900/80 backdrop-blur p-3 rounded-full border border-dark-600">
                                            <VideoIcon size={32} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-48 h-48 bg-dark-800 rounded-full flex items-center justify-center border-2 border-dashed border-dark-700 mx-auto">
                                    <Layout size={48} className="text-gray-600" />
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">
                            {selectedAvatar ? `Ready to animate ${selectedAvatar.name}` : 'Select an avatar to start'}
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Enter your script on the left and click Generate to see the magic happen.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
                      <h3 className="font-bold text-white flex items-center">
                          <User size={18} className="mr-2 text-purple-500" /> Create Custom Avatar
                      </h3>
                      <button onClick={closeCreationModal} className="text-gray-400 hover:text-white">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="p-6">
                      {/* Safety Check */}
                      <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                          <div className="flex items-start">
                              <AlertTriangle className="text-yellow-500 mr-3 flex-shrink-0" size={20} />
                              <div>
                                  <h4 className="text-sm font-semibold text-yellow-500 mb-1">Mandatory Legal Confirmation</h4>
                                  <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                                      To prevent misuse, you must confirm ownership rights before uploading or capturing any media.
                                  </p>
                                  <label className="flex items-start cursor-pointer group">
                                      <input 
                                        type="checkbox" 
                                        checked={legalConfirmed}
                                        onChange={(e) => setLegalConfirmed(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-dark-700"
                                      />
                                      <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">
                                          I confirm that this media belongs to me or I have full legal permission from the person shown.
                                      </span>
                                  </label>
                              </div>
                          </div>
                      </div>

                      {/* Content Area */}
                      {!isCameraActive ? (
                        <div className={`grid grid-cols-2 gap-4 ${!legalConfirmed ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                             {/* Camera Option */}
                            <div 
                                onClick={startCamera}
                                className="h-40 bg-dark-900 border border-dark-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-dark-900/80 transition-all"
                            >
                                <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center mb-3">
                                    <Camera size={24} className="text-white" />
                                </div>
                                <span className="text-sm font-medium text-white">Live Camera</span>
                                <span className="text-xs text-gray-500 mt-1">Take a photo</span>
                            </div>

                            {/* Upload Option */}
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="h-40 bg-dark-900 border border-dark-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-dark-900/80 transition-all"
                            >
                                <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center mb-3">
                                    <Upload size={24} className="text-white" />
                                </div>
                                <span className="text-sm font-medium text-white">Upload File</span>
                                <span className="text-xs text-gray-500 mt-1">Photo or Video</span>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </div>
                      ) : (
                          // Camera View
                          <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-dark-600">
                              <video 
                                ref={cameraVideoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover transform scale-x-[-1]" 
                              />
                              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                                  <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => {
                                        stopCamera();
                                        setCreationMode(null);
                                    }}
                                  >
                                      Cancel
                                  </Button>
                                  <Button 
                                    onClick={handleCapturePhoto}
                                    leftIcon={<Camera size={16} />}
                                  >
                                      Capture Photo
                                  </Button>
                              </div>
                          </div>
                      )}
                      
                      {isProcessingUpload && (
                          <div className="mt-4 text-center text-sm text-purple-400 animate-pulse">
                              Processing your avatar...
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};