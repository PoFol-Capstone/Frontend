const LOGIN_KEY = "isLoggedIn";
const EMAIL_KEY = "userEmail";

export function saveLogin(email: string) {
  localStorage.setItem(LOGIN_KEY, "true");
  localStorage.setItem(EMAIL_KEY, email);
}

export function isLoggedIn() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOGIN_KEY) === "true";
}

export function logout() {
  localStorage.removeItem(LOGIN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}