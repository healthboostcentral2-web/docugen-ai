import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { AppView } from '../types';

interface PlaceholderViewProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onBack: () => void;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, description, icon, onBack }) => {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mb-6 border border-dark-700 shadow-xl relative">
        <div className="absolute inset-0 bg-brand-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="relative text-brand-400">
            {React.isValidElement(icon) 
                ? React.cloneElement(icon as React.ReactElement<any>, { size: 48 })
                : icon}
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-3">{title}</h1>
      <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
        {description}
        <br/>
        <span className="text-sm mt-2 block opacity-70">This feature is coming in the next update.</span>
      </p>
      
      <div className="flex space-x-4">
        <Button variant="outline" onClick={onBack} leftIcon={<ArrowLeft size={18} />}>
            Back to Dashboard
        </Button>
        <Button variant="primary" onClick={() => alert("We'll notify you when this feature launches!")}>
            Get Notified
        </Button>
      </div>
    </div>
  );
};