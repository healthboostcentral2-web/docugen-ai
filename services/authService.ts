import { User } from '../types';

const STORAGE_KEY_USERS = 'docugen_users';
const STORAGE_KEY_SESSION = 'docugen_session';

// Simulate a backend database delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  /**
   * Register a new user
   */
  register: async (name: string, email: string, password: string): Promise<User> => {
    await delay(800);
    
    const usersRaw = localStorage.getItem(STORAGE_KEY_USERS);
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    
    if (users.find((u: any) => u.email === email)) {
      throw new Error("User with this email already exists");
    }

    // Simple mock "encryption" (hashing would be done on backend)
    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password: btoa(password), // Mock encoding
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    
    const { password: _, ...safeUser } = newUser;
    return safeUser;
  },

  /**
   * Login existing user
   */
  login: async (email: string, password: string): Promise<User> => {
    await delay(800);

    const usersRaw = localStorage.getItem(STORAGE_KEY_USERS);
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    
    const user = users.find((u: any) => u.email === email && u.password === btoa(password));
    
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const { password: _, ...safeUser } = user;
    
    // Set Session
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(safeUser));
    
    return safeUser;
  },

  /**
   * Check for active session on app load
   */
  getCurrentUser: async (): Promise<User | null> => {
    await delay(200);
    const sessionRaw = localStorage.getItem(STORAGE_KEY_SESSION);
    return sessionRaw ? JSON.parse(sessionRaw) : null;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }
};