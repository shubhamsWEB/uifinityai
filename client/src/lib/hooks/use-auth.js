import { useState, useEffect, useContext, createContext } from 'react';
import { 
  login as loginApi, 
  register as registerApi, 
  logout as logoutApi, 
  getCurrentUser, 
  isAuthenticated as checkIsAuthenticated 
} from '@/lib/api/auth';

// Create an authentication context
const AuthContext = createContext(null);

// Provider component that wraps your app and makes auth object available to any
// child component that calls useAuth().
export function AuthProvider({ children }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

// Hook for components to get the auth object and re-render when it changes.
export function useAuth() {
  return useContext(AuthContext);
}

// Provider hook that creates auth object and handles state
function useProvideAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        if (checkIsAuthenticated()) {
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        setUser(null);
        setIsAuthenticated(false);
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Register a new user
  const signUp = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await registerApi(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in a user
  const signIn = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginApi(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = () => {
    logoutApi();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user information
  const updateUser = (userData) => {
    setUser(userData);
  };

  // Return the user object and auth methods
  return {
    user,
    loading,
    error,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    updateUser,
  };
}
