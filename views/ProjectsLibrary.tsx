import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Clock, 
  Video, 
  MoreVertical,
  Plus,
  Loader2,
  Calendar
} from 'lucide-react';
import { Button } from '../components/Button';
import { Project, User } from '../types';
import { projectService } from '../services/projectService';
import { useToast } from '../components/ToastProvider';

interface ProjectsLibraryProps {
  user: User;
  onEditProject: (project: Project) => void;
  onBack: () => void;
}

export const ProjectsLibrary: React.FC<ProjectsLibraryProps> = ({ user, onEditProject, onBack }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'completed'>('all');

  const toast = useToast();
  
  useEffect(() => {
    fetchProjects();
  }, [user.id]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, statusFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectService.getUserProjects(user.id);
      setProjects(data);
    } catch (e) {
      console.error("Error loading projects", e);
      toast.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
      let filtered = [...projects];

      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q));
      }

      if (statusFilter !== 'all') {
          filtered = filtered.filter(p => p.status === statusFilter);
      }

      setFilteredProjects(filtered);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
          await projectService.deleteProject(id);
          toast.success("Project deleted.");
          fetchProjects(); // Reload
      }
  };

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-dark-900">
      {/* Header & Controls */}
      <div className="p-6 md:p-8 border-b border-dark-700 bg-dark-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                  <h1 className="text-2xl font-bold text-white mb-1">My Projects</h1>
                  <p className="text-gray-400 text-sm">Manage, edit, and export your video library.</p>
              </div>
              <Button onClick={() => onBack()} variant="primary" leftIcon={<Plus size={18} />}>
                  Create New
              </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                  <input 
                      type="text" 
                      placeholder="Search projects..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-dark-900 border border-dark-600 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-1 focus:ring-brand-500"
                  />
              </div>
              
              <div className="flex items-center space-x-2 bg-dark-900 p-1 rounded-lg border border-dark-600">
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${statusFilter === 'all' ? 'bg-dark-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                      All
                  </button>
                  <button 
                    onClick={() => setStatusFilter('draft')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${statusFilter === 'draft' ? 'bg-yellow-500/10 text-yellow-500 shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                      Drafts
                  </button>
                  <button 
                    onClick={() => setStatusFilter('completed')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${statusFilter === 'completed' ? 'bg-green-500/10 text-green-500 shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                      Completed
                  </button>
              </div>
          </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {loading ? (
              <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
          ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-dark-700 rounded-xl bg-dark-800/30">
                  <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mb-4">
                      <Video className="text-gray-600" size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No projects found</h3>
                  <p className="text-gray-500">Try adjusting your filters or create a new video.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProjects.map((project) => (
                      <div 
                        key={project.id}
                        className="group bg-dark-800 border border-dark-700 rounded-xl overflow-hidden hover:border-brand-500/50 hover:shadow-xl transition-all flex flex-col cursor-pointer"
                        onClick={() => onEditProject(project)}
                      >
                          {/* Thumbnail */}
                          <div className="h-40 bg-dark-900 relative overflow-hidden">
                              {project.scenes?.[0]?.imageUrl ? (
                                  <img 
                                    src={project.scenes[0].imageUrl} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                    alt="Thumbnail" 
                                  />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900">
                                      <Video className="text-dark-600" size={40} />
                                  </div>
                              )}
                              
                              <div className="absolute top-2 right-2">
                                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide backdrop-blur-md border ${
                                      project.status === 'completed' 
                                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  }`}>
                                      {project.status}
                                  </div>
                              </div>
                          </div>

                          {/* Info */}
                          <div className="p-4 flex-1 flex flex-col">
                              <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-brand-400 transition-colors">
                                  {project.title || "Untitled Project"}
                              </h3>
                              <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                                  {project.topic || project.script || "No description"}
                              </p>
                              
                              <div className="mt-auto flex items-center justify-between pt-3 border-t border-dark-700">
                                  <div className="flex items-center text-xs text-gray-500">
                                      <Clock size={12} className="mr-1" />
                                      {timeAgo(project.updatedAt || project.createdAt)}
                                  </div>
                                  
                                  <div className="flex space-x-2">
                                      <button 
                                        className="p-1.5 hover:bg-dark-600 rounded text-gray-400 hover:text-white transition-colors"
                                        onClick={(e) => { e.stopPropagation(); onEditProject(project); }}
                                        title="Edit Project"
                                      >
                                          <Edit3 size={14} />
                                      </button>
                                      <button 
                                        className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                                        onClick={(e) => handleDelete(e, project.id)}
                                        title="Delete Project"
                                      >
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};