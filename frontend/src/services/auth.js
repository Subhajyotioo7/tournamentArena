import { apiPost, apiGet } from "./api";

export async function loginUser(username, password) {
  const data = await apiPost("/api/login/", { username, password }, false);


  localStorage.setItem("token", data.access);


  return data;
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh");
}

export function logoutFromCognito(email = "") {
  if (email) {
    localStorage.setItem("cognito_login_hint", email);
  }
  logoutUser();
  sessionStorage.removeItem("cognito_oauth_state");
  sessionStorage.removeItem("cognito_next_path");
  window.location.assign("/");
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

export async function getProfile() {
  return apiGet("/api/profile/", true);
}
