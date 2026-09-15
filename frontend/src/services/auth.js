import { apiPost, apiGet } from "./api";

export async function registerUser(username, password) {
  return apiPost("/api/register/", { username, password }, false);
}

export async function loginUser(username, password) {
  const data = await apiPost("/api/login/", { username, password }, false);


  localStorage.setItem("token", data.access);


  return data;
}

export function logoutUser() {
  localStorage.removeItem("token");
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

export async function getProfile() {
  return apiGet("/api/profile/", true);
}

