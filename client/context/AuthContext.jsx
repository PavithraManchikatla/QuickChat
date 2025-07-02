// context/AuthContext.js
import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ loading state

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      const { success, user } = data;

      if (success) {
        setAuthUser(user);
        connectSocket(user);
      }
    } catch (error) {
      console.error("Auth check failed:", error.message);
      logout();
    } finally {
      setLoading(false); // ✅ always clear loading
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      const { success, user, token, message } = data;

      if (success) {
        setAuthUser(user);
        connectSocket(user);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setToken(token);
        localStorage.setItem("token", token);
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (error) {
      toast.error(error.message || "Login/Signup failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    delete axios.defaults.headers.common["Authorization"];
    if (socket) socket.disconnect();
    toast.success("Logged out successfully");
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      const { success, updatedUser } = data;

      if (success) {
        setAuthUser(updatedUser);
        toast.success("Profile updated successfully");
      } else {
        toast.error("Profile update failed");
      }
    } catch (error) {
      toast.error(error.message || "Update failed");
    }
  };

  const deleteAccount = async () => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      );
      if (!confirmDelete) return;

      const { data } = await axios.delete("/api/auth/delete-account");
      const { success, message } = data;

      if (success) {
        toast.success(message);
        logout();
      } else {
        toast.error("Failed to delete account");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Account deletion failed");
    }
  };

  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
    });

    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false); // ✅ if no token, still stop loading
    }
  }, []);

  const value = {
    axios,
    authUser,
    token,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
    deleteAccount, // ✅ added here
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
