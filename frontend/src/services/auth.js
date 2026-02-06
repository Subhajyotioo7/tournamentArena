// src/services/auth.js
import { apiPost, apiGet } from "./api";

// Register (no auth)
export async function registerUser(username, password) {
  return apiPost("/api/register/", { username, password }, false);
}

// Login (SimpleJWT)
export async function loginUser(username, password) {
  const data = await apiPost("/api/login/", { username, password }, false);

  console.log("LOGIN RESPONSE:", data);

  localStorage.setItem("token", data.access);

  console.log("TOKEN AFTER SAVE:", localStorage.getItem("token"));

  return data;
}

// Logout
export function logoutUser() {
  localStorage.removeItem("token");
}

// Simple login check
export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

// Profile (auth required)
export async function getProfile() {
  return apiGet("/api/profile/", true);
}

