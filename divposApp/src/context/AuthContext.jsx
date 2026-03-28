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
    // 1. SET USER NULL PERTAMA KALI
    // Ini krusial agar RequirePermission langsung return null (menghilangkan kedipan 'exit')
    setUser(null);
    setMenus([]);
    setPermissionMap({});
    isInitialized.current = false;

    try {
      // 2. Jalankan API Logout (jika gagal tetap lanjut ke pembersihan storage)
      await AuthService.logout();
    } catch (err) {
      console.error("Logout API failed", err);
    } finally {
      // 3. Bersihkan semua data di LocalStorage/SessionStorage
      const keysToClear = [
        "access_token",
        "tenant_info",
        "refresh_token",
        "user",
        "app",
        "last_allowed_route",
      ];

      keysToClear.forEach((key) => RemoveStorage(key));

      // 4. Redirect ke login
      // Menggunakan window.location.href untuk memastikan state benar-benar bersih (hard reload)
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
  }, []);

  const updateUser = useCallback((newUserData) => {
    // 1. Ambil data user lama yang "Paling Lengkap" dari Storage
    const currentUser = GetWithExpiry("user") || {};

    // 2. Mapping Data dari UserResource (Update) ke struktur AuthResource (Login)
    const mappedData = {
      ...currentUser, // Pertahankan data lama (Tenant, Role Code, dll)
      full_name: newUserData.full_name || currentUser.full_name,
      email: newUserData.email || currentUser.email,
      username: newUserData.username || currentUser.username,
      avatar: newUserData.avatar || currentUser.avatar,

      // Sesuaikan is_owner karena di UserResource ada di dalam 'meta'
      is_owner: newUserData.meta?.is_owner ?? currentUser.is_owner,

      // Merge Role (agar name & code tetap ada)
      role: {
        ...currentUser.role,
        name: newUserData.role?.name || currentUser.role?.name,
        code: newUserData.role?.code || currentUser.role?.code,
      },

      // Jangan sentuh Tenant karena UserResource (Update) datanya kosong/tidak lengkap
      tenant: currentUser.tenant,
    };

    // 3. Simpan hasil mapping yang sudah "Rapi" kembali ke Storage & State
    SetWithExpiry("user", mappedData, 1440);
    setUser(mappedData);
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
      // console.log("Login successful, response data:", data.user);
      SetWithExpiry("access_token", data.token, 1440);
      SetWithExpiry("refresh_token", data.refresh_token, 1440);
      SetWithExpiry("user", data.user, 1440);

      const configApp = {
        appName: data.app_config.appName,
        logo: data.app_config.logo_path,
        icon: data.app_config.favicon_path,
        footer_text: data.app_config.footer_text,
        primary_color: data.app_config.primary_color,
      };
      SetWithExpiry("app", configApp, 1440);

      setUser(data.user);

      const menuRes = await AuthService.getMenus();
      // console.log(menuRes.data);
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
        updateUser,
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
