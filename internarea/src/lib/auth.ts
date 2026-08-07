import { useEffect, useState } from "react";

const ADMIN_KEY = "internshalaAdmin";

export function isAdmin() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ADMIN_KEY) === "true";
}

export function setAdmin() {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(ADMIN_KEY, "true");
  }
}

export function clearAdmin() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ADMIN_KEY);
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
