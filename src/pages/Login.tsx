
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    try {
      console.log('Attempting login with:', email);
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: "Login successful",
          description: "You have been successfully logged in.",
          variant: "default",
        });
        navigate('/admin');
      } else {
        setLoginError('Invalid username or password');
        toast({
          title: "Login failed",
          description: "Invalid username or password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An error occurred during login');
      toast({
        title: "Login error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-50 px-4 relative">
      <Button 
        variant="ghost"
        size="icon"
        onClick={handleBackToHome}
        className="absolute top-4 left-4 z-10 rounded-full"
        aria-label="Back to home"
      >
        <Home size={24} className="text-gray-700" />
      </Button>
      
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-2">Portal Login</h2>
        <p className="text-center text-sm text-gray-600 mb-6">Please login to access your portal dashboard</p>
        <form onSubmit={handleLogin} className="space-y-4">
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                <span className="font-medium">Error</span>
              </span>
              <span className="block sm:inline ml-7">{loginError}</span>
            </div>
          )}
          <div>
            <Label htmlFor="email">Username</Label>
            <Input 
              type="text" 
              id="email" 
              placeholder="Enter your email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input 
              type="password" 
              id="password" 
              placeholder="Enter your password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <p className="text-center text-sm text-gray-600 mt-4">
            Demo Accounts (all use password: 'password')
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              <strong>CEO:</strong> ceo
            </div>
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              <strong>Admin:</strong> admin
            </div>
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              <strong>HR:</strong> hr
            </div>
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              <strong>Marketing:</strong> marketing
            </div>
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              <strong>Accounts:</strong> accounts
            </div>
            <div className="text-xs px-3 py-2 bg-gray-100 rounded text-center">
              <strong>Coach:</strong> user
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
