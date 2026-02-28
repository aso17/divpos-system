import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import AuthService from "../services/AuthService";
import { SetWithExpiry, GetWithExpiry, RemoveStorage } from "../utils/Storage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [menus, setMenus] = useState([]);
  const [permissionMap, setPermissionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } catch (err) {
      console.error("Logout API failed", err);
    } finally {
      const keysToClear = [
        "access_token",
        "tenant_info",
        "tenant_name",
        "last_allowed_route",
      ];

      keysToClear.forEach((key) => RemoveStorage(key));

      setUser(null);
      setMenus([]);
      setPermissionMap({});
      isInitialized.current = false;

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
  }, []);

  // 🔥 Load user + menu + permission paralel
  const loadInitialData = useCallback(async () => {
    try {
      const [userRes, menuRes] = await Promise.all([
        AuthService.getMe(),
        AuthService.getMenus(),
      ]);

      setUser(userRes.data);

      const menuData = menuRes.data.menus || [];
      const permissions = menuRes.data.permissions || {};

      setMenus(menuData);
      setPermissionMap(permissions);
    } catch (err) {
      console.error("Auth initialization failed:", err);
      await logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const login = async (credentials) => {
    setLoading(true);

    try {
      const { data } = await AuthService.login(credentials, "");
      console.log("Login successful:", data);
      SetWithExpiry("access_token", data.token, 1440);
      SetWithExpiry("refresh_token", data.refresh_token, 1440);
      SetWithExpiry("user", data.user, 1440);

      localStorage.setItem("tenant_name", data.user.tenant.slug);

      const tenantInfo = {
        name: data.user.tenant.slug,
        logo: data.user.tenant.logo_path,
        icon: data.user.tenant.icon_path,
        code: data.user.tenant.code,
        type: data.user.tenant.business_type,
      };

      SetWithExpiry("tenant_info", tenantInfo, 1440);

      setUser(data.user);

      const menuRes = await AuthService.getMenus();

      setMenus(menuRes.data.menus || []);
      setPermissionMap(menuRes.data.permissions || {});

      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized.current) return;

    const token = GetWithExpiry("access_token");

    if (!token) {
      setLoading(false);
      isInitialized.current = true;
      return;
    }

    isInitialized.current = true;
    loadInitialData();
  }, [loadInitialData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        menus,
        permissionMap,
        loading,
        isAuthenticated: !!user,
        businessType: user?.tenant?.business_type,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");

  return context;
};
