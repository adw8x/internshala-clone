import { auth, provider } from "@/firebase/firebase";
import { signInWithPopup } from "firebase/auth";
import api from "@/lib/api";

export interface GoogleLoginResult {
  role: "user" | "admin";
  email: string;
  name: string;
  photo: string | null;
  uid: string;
}

export async function signInWithGoogle(): Promise<GoogleLoginResult> {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const res = await api.post("/auth/google-login", {
    email: user.email,
    name: user.displayName,
    photo: user.photoURL,
    firebaseUid: user.uid,
  });

  return {
    role: res.data.user.role,
    email: user.email ?? "",
    name: user.displayName ?? "",
    photo: user.photoURL ?? "",
    uid: user.uid,
  };
}
