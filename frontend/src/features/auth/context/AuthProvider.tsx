import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
} from "react";
import { fetchCurrentUser } from "../api/authService";
import type { User } from "../../../utils/interfaces";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isInitializing: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setUser(null);
        setIsInitializing(false);
        return;
      }
      try {
        const response = await fetchCurrentUser();
        setUser(response.data);
      } catch (error) {
        setUser(null);
        console.error(error);
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isInitializing, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
