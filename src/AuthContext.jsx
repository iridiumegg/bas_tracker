import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bas_token");
    const check = token
      ? api.me().then(({ user }) => setUser(user)).catch(() => localStorage.removeItem("bas_token"))
      : Promise.resolve();
    check.finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { token, user } = await api.login(username, password);
    localStorage.setItem("bas_token", token);
    setUser(user);
  };

  const setup = async (body) => {
    const { token, user } = await api.setup(body);
    localStorage.setItem("bas_token", token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("bas_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, setup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
