import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Clock, 
  MoreVertical, 
  PlayCircle, 
  Video, 
  Loader2, 
  Trash2,
  ArrowRight,
  Smile,
  Mic,
  Captions,
  Zap,
  Film
} from 'lucide-react';
import { AppView, Project, User } from '../types';
import { projectService } from '../services/projectService';
import { Button } from '../components/Button';
import { useToast } from '../components/ToastProvider';

interface DashboardProps {
  user: User;
  onNavigate: (view: AppView) => void;
  onEditProject?: (project: Project) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onEditProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectService.getUserProjects(user.id);
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects", error);
      toast.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user.id]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm("Are you sure you want to delete this project?")) {
      await projectService.deleteProject(id);
      toast.success("Project deleted.");
      fetchProjects();
    }
  };

  const calculateDuration = (p: Project) => {
    if (p.scenes && p.scenes.length > 0) {
        const total = p.scenes.reduce((acc, s) => acc + (s.duration || 0), 0);
        const mins = Math.floor(total / 60);
        const secs = Math.floor(total % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return '--:--';
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const QuickActionCard = ({ icon, title, desc, onClick, colorClass }: any) => (
    <div 
        onClick={onClick}
        className="bg-dark-800 border border-dark-700 p-6 rounded-xl cursor-pointer hover:bg-dark-700 hover:border-dark-600 transition-all group relative overflow-hidden"
    >
        <div className={`absolute top-0 right-0 p-20 ${colorClass} opacity-5 blur-2xl rounded-full transform translate-x-10 -translate-y-10 group-hover:opacity-10 transition-opacity`}></div>
        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-lg ${colorClass.replace('bg-', 'bg-').replace('text-', 'text-').split(' ')[0]}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {React.cloneElement(icon, { className: colorClass.split(' ')[1] })}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 mb-4">{desc}</p>
            <div className="flex items-center text-sm font-medium text-brand-400 group-hover:translate-x-1 transition-transform">
                Start Creating <ArrowRight size={14} className="ml-1" />
            </div>
        </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 pb-24">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900/50 to-dark-800 border border-dark-700 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white mb-4">
                Welcome back, {user.name}
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mb-8">
                Create professional documentaries, explainer videos, and social content in minutes. 
                One-click automation powered by advanced AI.
            </p>
            <div className="flex flex-wrap gap-4">
                <Button 
                    onClick={() => onNavigate(AppView.EDITOR)}
                    size="lg"
                    leftIcon={<Plus size={20} />}
                    className="shadow-xl shadow-brand-500/20"
                >
                    New Documentary
                </Button>
                <Button 
                    onClick={() => onNavigate(AppView.MY_PROJECTS)}
                    variant="secondary"
                    size="lg"
                    leftIcon={<Film size={20} />}
                >
                    My Library
                </Button>
            </div>
        </div>
      </header>

      {/* Quick Tools Grid */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Zap className="mr-2 text-yellow-400" size={20} /> Creative Studio
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard 
                icon={<Video size={24} />}
                title="AI Video Generator"
                desc="Turn scripts or ideas into full videos automatically."
                onClick={() => onNavigate(AppView.EDITOR)}
                colorClass="bg-brand-500 text-brand-400"
            />
            <QuickActionCard 
                icon={<Smile size={24} />}
                title="Avatar Studio"
                desc="Generate realistic AI avatars from photos or camera."
                onClick={() => onNavigate(AppView.AVATAR)}
                colorClass="bg-purple-500 text-purple-400"
            />
            <QuickActionCard 
                icon={<Mic size={24} />}
                title="Voice Lab"
                desc="Convert text to human-like speech instantly."
                onClick={() => onNavigate(AppView.VOICE)}
                colorClass="bg-pink-500 text-pink-400"
            />
            <QuickActionCard 
                icon={<Captions size={24} />}
                title="Auto Subtitles"
                desc="Generate and translate subtitles for any video."
                onClick={() => onNavigate(AppView.SUBTITLES)}
                colorClass="bg-blue-500 text-blue-400"
            />
        </div>
      </section>

      {/* My Projects */}
      <section>
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
            <button 
                onClick={() => onNavigate(AppView.MY_PROJECTS)}
                className="text-sm text-brand-400 hover:text-brand-300 font-medium flex items-center transition-colors"
            >
                View All <ArrowRight size={14} className="ml-1" />
            </button>
        </div>
        
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1,2,3].map(i => (
                 <div key={i} className="h-64 bg-dark-800 rounded-xl animate-pulse border border-dark-700" />
             ))}
           </div>
        ) : projects.length === 0 ? (
            <div className="bg-dark-800/50 border border-dark-700 border-dashed rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="text-gray-500" size={32} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
                <p className="text-gray-400 mb-6">Start your first project to see it here.</p>
                <Button onClick={() => onNavigate(AppView.EDITOR)} variant="outline">Start Creating</Button>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 3).map((project) => (
              <div 
                key={project.id} 
                onClick={() => onEditProject?.(project)}
                className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden hover:border-brand-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-900/10 group relative cursor-pointer"
              >
                <div className="h-44 bg-dark-700 relative overflow-hidden">
                   {project.scenes?.[0]?.imageUrl ? (
                       <img src={project.scenes[0].imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" alt="thumbnail" />
                   ) : (
                       <div className="w-full h-full bg-gradient-to-br from-brand-900/20 to-dark-900"></div>
                   )}

                  <div className="absolute top-3 right-3">
                     <div className="bg-dark-900/80 backdrop-blur p-1.5 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                        onClick={(e) => handleDelete(e, project.id)}>
                         <Trash2 size={14} />
                     </div>
                  </div>

                  <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                      <span className="px-2 py-1 rounded bg-black/60 backdrop-blur text-xs font-medium text-white flex items-center">
                          <Clock size={12} className="mr-1" />
                          {calculateDuration(project)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border backdrop-blur ${
                          project.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/20' 
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                      }`}>
                          {project.status === 'completed' ? 'Ready' : 'Draft'}
                      </span>
                  </div>
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                      <PlayCircle size={48} className="text-white drop-shadow-xl transform scale-90 group-hover:scale-100 transition-transform" />
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-semibold text-white truncate mb-1">{project.title}</h3>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{timeAgo(project.createdAt)}</span>
                    <span className="uppercase tracking-wider">{project.language}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};