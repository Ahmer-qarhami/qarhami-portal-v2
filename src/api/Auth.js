// authUtils.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/user-accounts/adminLogin/`, {
      email,
      password,
    });

    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error(
      "Login error:",
      error.response ? error.response.data : error.message
    );
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getToken = () => {
  const token = localStorage.getItem("token");
  console.log("getToken called, token exists:", !!token);
  return token;
};

export const isAuthenticated = () => {
  const token = getToken();
  return !!token; // Returns true if there's a token, false otherwise
};
