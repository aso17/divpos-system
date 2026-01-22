import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  login as loginApi,
  logout as logoutApi,
  getMe,
  getMenus,
} from "../services/AuthService";

import { getProjectInfo } from "../services/projectService";
import { SetWithExpiry } from "../utils/SetWithExpiry";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);
  const loadUser = async () => {
    try {
      const { data } = await getMe();
      setUser(data);
      return data;
    } catch (err) {
      await logout();
      return null;
    }
  };

  const loadMenus = async () => {
    try {
      const { data } = await getMenus();
      const menuData = data.menus || [];
      setMenus(menuData);
      return menuData;
    } catch (err) {
      setMenus([]);
      return [];
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const { data } = await loginApi(credentials);
      SetWithExpiry("access_token", data.token, 1440);
      SetWithExpiry("user", data.user, 1440);

      localStorage.setItem("project_name", data.user.tenant.slug);
      localStorage.setItem("project_logo_path", data.user.tenant.logo_path);

      setUser(data.user);

      await loadMenus();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout API failed", err);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      localStorage.removeItem("project_name");
      localStorage.removeItem("project_logo_path");

      setUser(null);
      setMenus([]);

      isInitialized.current = false;
      await getProjectInfo();
    }
  };

  useEffect(() => {
    if (isInitialized.current) return;

    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      isInitialized.current = true;
      return;
    }

    const initAuth = async () => {
      try {
        isInitialized.current = true;
        // Ambil data secara paralel saat reload/buka pertama kali
        await Promise.all([loadUser(), loadMenus()]);
      } catch (err) {
        console.error("Initialization failed", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        menus,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
