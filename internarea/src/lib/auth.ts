import { useEffect, useState } from "react";

const ADMIN_KEY = "internshalaAdmin";
const ADMIN_USER_KEY = "internshalaAdminUser";

export function isAdmin() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ADMIN_KEY) === "true";
}

export function getAdminUser() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(ADMIN_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setAdmin(user?: { email: string; name: string; photo?: string }) {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(ADMIN_KEY, "true");
    if (user) {
      window.sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    }
  }
}

export function clearAdmin() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ADMIN_KEY);
    window.sessionStorage.removeItem(ADMIN_USER_KEY);
  }
}

export function useRequireAdmin() {
  const [admin, setAdminState] = useState(false);

  useEffect(() => {
    const value = isAdmin();
    setAdminState(value);
    if (!value) {
      window.location.href = "/adminlogin";
    }
  }, []);

  return admin;
}
