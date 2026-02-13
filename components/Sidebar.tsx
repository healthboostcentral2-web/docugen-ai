import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  FolderOpen, 
  Smile, 
  Mic, 
  Captions, 
  Settings, 
  LogOut, 
  PlusCircle,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { AppView, User } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLogout: () => void;
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  onLogout, 
  user, 
  isOpen,
  onClose 
}) => {
  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', view: AppView.DASHBOARD },
    { icon: <Video size={20} />, label: 'Create New Video', view: AppView.EDITOR },
    { icon: <FolderOpen size={20} />, label: 'My Projects', view: AppView.MY_PROJECTS },
    { icon: <Smile size={20} />, label: 'Create Avatar', view: AppView.AVATAR },
    { icon: <Mic size={20} />, label: 'Generate Voice', view: AppView.VOICE },
    { icon: <ImageIcon size={20} />, label: 'Generate Images', view: AppView.IMAGE_GENERATOR },
    { icon: <Captions size={20} />, label: 'Generate Subtitles', view: AppView.SUBTITLES },
    { icon: <Settings size={20} />, label: 'Settings', view: AppView.SETTINGS },
  ];

  const handleNavClick = (view: AppView) => {
    onChangeView(view);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Video className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              DocuGen
            </span>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <div className="mb-6 px-3">
              <button 
                  onClick={() => handleNavClick(AppView.EDITOR)}
                  className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-lg p-3 flex items-center justify-center space-x-2 font-medium shadow-lg shadow-brand-900/20 transition-all border border-transparent hover:border-brand-300/20"
              >
                  <PlusCircle size={18} />
                  <span>New Project</span>
              </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.view)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                  currentView === item.view && item.view !== AppView.EDITOR
                    ? 'bg-dark-700 text-brand-400 border-l-2 border-brand-500'
                    : 'text-gray-400 hover:bg-dark-700 hover:text-white hover:translate-x-1'
                }`}
              >
                <span className={currentView === item.view ? 'text-brand-400' : 'text-gray-500 group-hover:text-white'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-dark-700 bg-dark-800/50">
          <div className="flex items-center space-x-3 mb-4 px-2 p-2 rounded-lg hover:bg-dark-700 transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">Free Plan</p>
              </div>
          </div>
          <button 
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};