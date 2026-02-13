import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Download, 
  Wand2, 
  Maximize, 
  Sparkles, 
  Layout, 
  Palette
} from 'lucide-react';
import { Button } from '../components/Button';
import * as gemini from '../services/geminiService';
import { useToast } from '../components/ToastProvider';

interface ImageGeneratorProps {
  onBack: () => void;
}

const ASPECT_RATIOS = [
  { id: '16:9', label: 'Landscape (16:9)', icon: <div className="w-6 h-3 border-2 border-current rounded-sm"/> },
  { id: '9:16', label: 'Portrait (9:16)', icon: <div className="w-3 h-6 border-2 border-current rounded-sm"/> },
  { id: '1:1', label: 'Square (1:1)', icon: <div className="w-4 h-4 border-2 border-current rounded-sm"/> },
  { id: '4:3', label: 'Standard (4:3)', icon: <div className="w-5 h-4 border-2 border-current rounded-sm"/> },
];

const STYLES = [
  'Photorealistic',
  'Cinematic',
  'Anime',
  '3D Render',
  'Oil Painting',
  'Cyberpunk',
  'Minimalist'
];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedStyle, setSelectedStyle] = useState('Cinematic');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const toast = useToast();

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedImageUrl(null);
    try {
        const fullPrompt = `${selectedStyle} style: ${prompt}`;
        const url = await gemini.generateSceneImage(fullPrompt, selectedRatio);
        setGeneratedImageUrl(url);
        toast.success("Image generated successfully!");
    } catch (e) {
        console.error("Generation failed", e);
        toast.error("Failed to generate image. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `docugen_image_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded.");
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-dark-700 bg-dark-800 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
                <ImageIcon className="mr-3 text-brand-500" /> AI Image Studio
            </h1>
            <p className="text-gray-400 text-sm mt-1">Generate professional images and assets in seconds.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Panel: Controls */}
        <div className="w-full lg:w-1/3 bg-dark-800 p-6 border-r border-dark-700 overflow-y-auto space-y-8">
            
            {/* Prompt */}
            <div className="space-y-3">
                 <label className="text-sm font-medium text-gray-300 flex items-center">
                    <Sparkles size={16} className="mr-2" /> Image Prompt
                </label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your image in detail (e.g., A futuristic city with flying cars at sunset)..."
                    className="w-full h-32 bg-dark-900 border border-dark-600 rounded-lg p-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                    <Layout size={16} className="mr-2" /> Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio.id}
                            onClick={() => setSelectedRatio(ratio.id)}
                            className={`flex items-center p-2 rounded-lg border transition-all ${
                                selectedRatio === ratio.id 
                                ? 'bg-brand-600/20 border-brand-500 text-white' 
                                : 'bg-dark-900 border-dark-600 text-gray-400 hover:border-brand-500/50'
                            }`}
                        >
                            <div className={`mr-2 ${selectedRatio === ratio.id ? 'text-brand-400' : 'text-gray-500'}`}>
                                {ratio.icon}
                            </div>
                            <span className="text-xs font-medium">{ratio.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Style Selector */}
            <div className="space-y-3">
                 <label className="text-sm font-medium text-gray-300 flex items-center">
                    <Palette size={16} className="mr-2" /> Art Style
                </label>
                <div className="flex flex-wrap gap-2">
                    {STYLES.map(style => (
                        <button
                            key={style}
                            onClick={() => setSelectedStyle(style)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                selectedStyle === style
                                ? 'bg-brand-500 text-white border-brand-500'
                                : 'bg-dark-900 border-dark-600 text-gray-400 hover:text-white hover:border-gray-500'
                            }`}
                        >
                            {style}
                        </button>
                    ))}
                </div>
            </div>

            <Button 
                onClick={handleGenerate} 
                isLoading={isGenerating}
                disabled={!prompt}
                size="lg"
                className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 border-none"
                leftIcon={<Wand2 size={18} fill="currentColor" />}
            >
                {isGenerating ? 'Generating Image...' : 'Generate Image'}
            </Button>
        </div>

        {/* Right Panel: Output */}
        <div className="flex-1 p-6 lg:p-10 flex flex-col bg-dark-900 relative items-center justify-center">
            {generatedImageUrl ? (
                <div className="relative max-w-full max-h-full flex flex-col items-center">
                    <div className="rounded-lg overflow-hidden shadow-2xl border border-dark-700 bg-black relative group">
                        <img 
                            src={generatedImageUrl} 
                            alt="Generated" 
                            className="max-h-[70vh] object-contain"
                        />
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                             <Button onClick={handleDownload} size="lg" leftIcon={<Download size={20} />}>
                                 Download Image
                             </Button>
                         </div>
                    </div>
                    <div className="mt-6 flex space-x-4">
                         <Button variant="secondary" onClick={handleDownload} leftIcon={<Download size={16} />}>
                            Save to Device
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="text-center max-w-md p-8 border-2 border-dashed border-dark-700 rounded-2xl bg-dark-800/30">
                     <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="text-gray-500" size={32} />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">Create something unique</h3>
                    <p className="text-gray-400">
                        Describe your vision on the left to generate high-quality images powered by Gemini AI.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};