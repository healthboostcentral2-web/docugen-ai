import { Project } from '../types';

const STORAGE_KEY_PROJECTS = 'docugen_projects';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const projectService = {
  /**
   * Get all projects for a specific user, sorted by last update
   */
  getUserProjects: async (userId: string): Promise<Project[]> => {
    await delay(500);
    const allProjectsRaw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    const allProjects: Project[] = allProjectsRaw ? JSON.parse(allProjectsRaw) : [];
    
    // Filter by user ID and sort by updatedAt or createdAt desc
    return allProjects
      .filter(p => p.userId === userId)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
  },

  /**
   * Save or Update a project
   */
  saveProject: async (project: Project): Promise<Project> => {
    await delay(600);
    const allProjectsRaw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    let allProjects: Project[] = allProjectsRaw ? JSON.parse(allProjectsRaw) : [];
    
    const existingIndex = allProjects.findIndex(p => p.id === project.id);
    
    const timestamp = new Date().toISOString();
    const projectToSave = {
        ...project,
        updatedAt: timestamp
    };

    if (existingIndex >= 0) {
      // Preserve createdAt if exists, just in case
      projectToSave.createdAt = allProjects[existingIndex].createdAt;
      allProjects[existingIndex] = projectToSave;
    } else {
      projectToSave.createdAt = timestamp; // Ensure createdAt is set for new
      allProjects.push(projectToSave);
    }
    
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(allProjects));
    return projectToSave;
  },

  /**
   * Delete a project
   */
  deleteProject: async (projectId: string): Promise<void> => {
    await delay(300);
    const allProjectsRaw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    let allProjects: Project[] = allProjectsRaw ? JSON.parse(allProjectsRaw) : [];
    
    allProjects = allProjects.filter(p => p.id !== projectId);
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(allProjects));
  }
};