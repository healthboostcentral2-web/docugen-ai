import React, { useState } from 'react';
import { Video, ArrowRight, Github, Mail, User as UserIcon, Lock, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { authService } from '../services/authService';
import { User } from '../types';
import { useToast } from '../components/ToastProvider';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let user: User;
      if (isLoginView) {
        user = await authService.login(email, password);
        toast.success(`Welcome back, ${user.name}!`);
      } else {
        if (!name) throw new Error("Name is required");
        user = await authService.register(name, email, password);
        toast.success("Account created successfully!");
      }
      onLogin(user);
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] right-[0%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md bg-dark-800/80 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl overflow-hidden transition-all duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/20 shadow-lg shadow-brand-500/10">
            <Video className="text-brand-400 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLoginView ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-400">
            {isLoginView 
              ? 'Sign in to access your video projects.' 
              : 'Join DocuGen AI and start creating in seconds.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginView && (
            <div className="animate-in slide-in-from-left-4 duration-300">
              <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  required={!isLoginView}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                required
                minLength={6}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full py-3 text-lg mt-2" 
            isLoading={loading}
            leftIcon={isLoginView ? <ArrowRight size={18} /> : undefined}
          >
            {isLoginView ? 'Sign In' : 'Sign Up Free'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={toggleView} 
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              {isLoginView ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};