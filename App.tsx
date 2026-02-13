import React, { useState, useEffect, Suspense } from 'react';
import { Sidebar } from './components/Sidebar';
import { AppView, User, Project } from './types';
import { authService } from './services/authService';
import { Loader2, Menu, Settings as SettingsIcon } from 'lucide-react';

// Lazy load views for better initial load performance
const Login = React.lazy(() => import('./views/Login').then(m => ({ default: m.Login })));
const Dashboard = React.lazy(() => import('./views/Dashboard').then(m => ({ default: m.Dashboard })));
const ProjectBuilder = React.lazy(() => import('./views/ProjectBuilder').then(m => ({ default: m.ProjectBuilder })));
const ProjectsLibrary = React.lazy(() => import('./views/ProjectsLibrary').then(m => ({ default: m.ProjectsLibrary })));
const VoiceGenerator = React.lazy(() => import('./views/VoiceGenerator').then(m => ({ default: m.VoiceGenerator })));
const SubtitleGenerator = React.lazy(() => import('./views/SubtitleGenerator').then(m => ({ default: m.SubtitleGenerator })));
const AvatarStudio = React.lazy(() => import('./views/AvatarStudio').then(m => ({ default: m.AvatarStudio })));
const ImageGenerator = React.lazy(() => import('./views/ImageGenerator').then(m => ({ default: m.ImageGenerator })));
const PlaceholderView = React.lazy(() => import('./views/PlaceholderView').then(m => ({ default: m.PlaceholderView })));

const PageLoader = () => (
  <div className="flex-1 h-full flex items-center justify-center bg-dark-900">
    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
  </div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // Mobile Sidebar State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // State to handle editing a specific project
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (e) {
        console.error("Session check failed", e);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setEditingProject(undefined);
    setCurrentView(AppView.LOGIN);
  };

  const handleNewProject = () => {
      setEditingProject(undefined); // Clear edit state
      setCurrentView(AppView.EDITOR);
  };
  
  const handleEditProject = (project: Project) => {
      setEditingProject(project);
      setCurrentView(AppView.EDITOR);
  };

  const renderContent = () => {
    return (
      <Suspense fallback={<PageLoader />}>
        {(() => {
          switch (currentView) {
            case AppView.DASHBOARD:
                return <Dashboard 
                    user={user!} 
                    onNavigate={(view) => {
                        if (view === AppView.EDITOR) handleNewProject();
                        else setCurrentView(view);
                    }}
                    onEditProject={handleEditProject}
                />;
            
            case AppView.EDITOR:
                return <ProjectBuilder 
                    user={user!}
                    onBack={() => setCurrentView(AppView.DASHBOARD)} 
                    existingProject={editingProject}
                />;
                
            case AppView.MY_PROJECTS:
                return <ProjectsLibrary 
                    user={user!}
                    onEditProject={handleEditProject}
                    onBack={() => {
                      setEditingProject(undefined);
                      handleNewProject(); 
                    }}
                />;

            case AppView.AVATAR:
                return <AvatarStudio 
                    onBack={() => setCurrentView(AppView.DASHBOARD)}
                />;
                
            case AppView.VOICE:
                return <VoiceGenerator 
                    onBack={() => setCurrentView(AppView.DASHBOARD)}
                />;

            case AppView.IMAGE_GENERATOR:
                return <ImageGenerator 
                    onBack={() => setCurrentView(AppView.DASHBOARD)}
                />;
                
            case AppView.SUBTITLES:
                return <SubtitleGenerator 
                    onBack={() => setCurrentView(AppView.DASHBOARD)}
                />;

            case AppView.SETTINGS:
                return <PlaceholderView 
                    title="Account Settings"
                    description="Manage your subscription, API keys, and notification preferences."
                    icon={<SettingsIcon />}
                    onBack={() => setCurrentView(AppView.DASHBOARD)}
                />;
                
            default:
                return <Dashboard 
                    user={user!} 
                    onNavigate={setCurrentView} 
                    onEditProject={handleEditProject}
                />;
          }
        })()}
      </Suspense>
    );
  };

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-dark-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login onLogin={handleLogin} />
      </Suspense>
    );
  }

  // If in Editor Mode, full screen without sidebar (except on mobile we might want a way back)
  // For simplicity, we keep full screen logic for Editor but ensure back buttons exist in the views
  if (currentView === AppView.EDITOR) {
    return (
      <div className="h-screen bg-dark-900 text-white overflow-hidden font-sans">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark-900 text-white overflow-hidden font-sans">
      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => {
            if (view === AppView.EDITOR) handleNewProject();
            else setCurrentView(view);
        }} 
        onLogout={handleLogout} 
        user={user}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden h-16 border-b border-dark-700 bg-dark-800 flex items-center px-4 flex-shrink-0">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-bold text-white">DocuGen AI</span>
        </div>

        {/* Subtle background gradient for main area */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-dark-800 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex-1 overflow-y-auto bg-dark-900">
            {renderContent()}
        </div>
      </main>
    </div>
  );
}