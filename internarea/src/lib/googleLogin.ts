import { auth, provider } from "@/firebase/firebase";
import { signInWithPopup } from "firebase/auth";
import api from "@/lib/api";

export interface GoogleLoginResult {
  role: "user" | "admin";
  email: string;
  name: string;
  photo: string | null;
  uid: string;
  otpRequired?: boolean;
}

export async function signInWithGoogle(): Promise<GoogleLoginResult> {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const res = await api.post(
    "/auth/google-login",
    {
      email: user.email,
      name: user.displayName,
      photo: user.photoURL,
      firebaseUid: user.uid,
    },
    { headers: { "x-user-agent": navigator.userAgent } }
  );

  if (res.data.otpRequired) {
    return {
      role: "user",
      email: user.email ?? "",
      name: user.displayName ?? "",
      photo: user.photoURL ?? "",
      uid: user.uid,
      otpRequired: true,
    };
  }

  return {
    role: res.data.user.role,
    email: user.email ?? "",
    name: user.displayName ?? "",
    photo: user.photoURL ?? "",
    uid: user.uid,
  };
}