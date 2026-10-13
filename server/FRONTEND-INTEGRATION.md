# Connecting the Frontend to the Backend

This guide will help you update your frontend React application to work with the new Node.js backend instead of the in-memory data service.

## 1. Set Up API Service

Create a new API service to handle communication with the backend:

```javascript
// src/services/apiService.ts

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiry
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 2. Create Authentication Service

Replace the current auth functions with API calls:

```javascript
// src/services/authService.ts

import api from './apiService';

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    isSuperAdmin: boolean;
  };
}

export const loginAdmin = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', credentials);
  
  if (response.data.success) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response.data;
};

export const logoutAdmin = async (): Promise<void> => {
  await api.get('/auth/logout');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentAdmin = async (): Promise<any> => {
  const response = await api.get('/auth/me');
  return response.data.data;
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem('token') !== null;
};

export const getUser = (): any => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isSuperAdmin = (): boolean => {
  const user = getUser();
  return user && user.isSuperAdmin;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};
```

## 3. Replace Other Service Functions

Create separate service files for each entity:

### Programs Service

```javascript
// src/services/programsService.ts

import api from './apiService';

export const getPrograms = async () => {
  const response = await api.get('/programs');
  return response.data.data;
};

export const getProgram = async (id: string) => {
  const response = await api.get(`/programs/${id}`);
  return response.data.data;
};

export const saveProgram = async (program: any) => {
  if (program.id) {
    const response = await api.put(`/programs/${program.id}`, program);
    return response.data.data;
  } else {
    const response = await api.post('/programs', program);
    return response.data.data;
  }
};

export const deleteProgram = async (id: string) => {
  const response = await api.delete(`/programs/${id}`);
  return response.data.success;
};
```

### Announcements Service

```javascript
// src/services/announcementsService.ts

import api from './apiService';

export const getAnnouncements = async () => {
  const response = await api.get('/announcements');
  return response.data.data;
};

export const getAnnouncement = async (id: string) => {
  const response = await api.get(`/announcements/${id}`);
  return response.data.data;
};

export const saveAnnouncement = async (announcement: any) => {
  if (announcement.id) {
    const response = await api.put(`/announcements/${announcement.id}`, announcement);
    return response.data.data;
  } else {
    const response = await api.post('/announcements', announcement);
    return response.data.data;
  }
};

export const deleteAnnouncement = async (id: string) => {
  const response = await api.delete(`/announcements/${id}`);
  return response.data.success;
};
```

### Registrations Service

```javascript
// src/services/registrationsService.ts

import api from './apiService';

export const getRegistrations = async () => {
  const response = await api.get('/registrations');
  return response.data.data;
};

export const getRegistration = async (id: string) => {
  const response = await api.get(`/registrations/${id}`);
  return response.data.data;
};

export const addRegistration = async (registration: any) => {
  const response = await api.post('/registrations', registration);
  return response.data.data;
};

export const updateRegistration = async (id: string, updates: any) => {
  const response = await api.put(`/registrations/${id}`, updates);
  return response.data.data;
};
```

### Contact Service

```javascript
// src/services/contactService.ts

import api from './apiService';

export const submitContactForm = async (formData: any) => {
  const response = await api.post('/contact', formData);
  return response.data;
};

export const getContactSubmissions = async () => {
  const response = await api.get('/contact');
  return response.data.data;
};

export const getContactSubmission = async (id: string) => {
  const response = await api.get(`/contact/${id}`);
  return response.data.data;
};

export const replyToContact = async (id: string, replyMessage: string) => {
  const response = await api.post(`/contact/${id}/reply`, { replyMessage });
  return response.data.data;
};

export const updateContactStatus = async (id: string, status: string) => {
  const response = await api.put(`/contact/${id}`, { status });
  return response.data.data;
};
```

### Payment Service

```javascript
// src/services/paymentService.ts

import api from './apiService';

export const createCheckoutSession = async (registrationId: string) => {
  const response = await api.post(`/payment/${registrationId}`);
  return response.data;
};

export const processMpesaPayment = async (registrationId: string, phone: string) => {
  const response = await api.post(`/payment/mpesa/${registrationId}`, { phone });
  return response.data;
};

export const verifyPayment = async (registrationId: string) => {
  const response = await api.get(`/payment/verify/${registrationId}`);
  return response.data.data;
};

export const updatePaymentStatus = async (registrationId: string, paymentInfo: any) => {
  const response = await api.put(`/payment/manual/${registrationId}`, paymentInfo);
  return response.data.data;
};
```

## 4. Update Admin Components and Authentication

Create an AuthContext to manage authentication state:

```jsx
// src/context/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginAdmin, logoutAdmin, getCurrentAdmin, isAuthenticated, getUser } from '../services/authService';

const AuthContext = createContext<any>(null);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (isAuthenticated()) {
        try {
          const userData = await getCurrentAdmin();
          setUser(userData);
        } catch (error) {
          console.error('Auth check failed:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await loginAdmin({ username, password });
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    await logoutAdmin();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

## 5. Create Protected Routes

Create a ProtectedRoute component to secure admin routes:

```jsx
// src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  superAdminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, superAdminOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (superAdminOnly && !user.isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```

## 6. Update React Router Setup

Wrap your application with the AuthProvider and update routes:

```jsx
// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import Index from './pages/Index';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

## 7. Create Login Page

```jsx
// src/pages/AdminLogin.tsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from "@/components/ui/use-toast";

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.response?.data?.error || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Admin Login</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-green-500 group-hover:text-green-400 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
        
        <div className="text-sm text-center">
          <p className="text-gray-600">
            Default credentials: admin / password
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
```

## 8. Update Package.json for Frontend

Ensure you have axios added to your frontend dependencies:

```json
{
  "dependencies": {
    "axios": "^1.7.0"
    // other dependencies...
  }
}
```

## 9. Environment Setup

Create a `.env` file in your frontend project root:

```
REACT_APP_API_URL=http://localhost:5000/api
```

For production, update this to your actual backend URL.

## 10. Update All Components

Update all components that use the in-memory data service to use the new API services instead. This includes:

- ProgramRegistration.tsx
- ProgramHighlights.tsx
- AdminDashboard.tsx
- AdminUsers.tsx
- Announcements.tsx
- ContactForm.tsx

## Additional Notes

1. Make sure CORS is properly configured on the backend to accept requests from your frontend.
2. For production deployment, ensure both frontend and backend are hosted and can communicate.
3. Consider adding loading states to all API calls to improve user experience.
4. Add error handling throughout the application.

By following these steps, you'll successfully migrate from the in-memory data service to a real backend with authentication, database storage, email communication, and payment processing.
