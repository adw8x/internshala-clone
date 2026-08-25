import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "./db";
import User from "./models/User";

export interface AuthRequest extends NextApiRequest {
  user?: {
    id: string;
    name: string;
    photo: string;
    email: string;
    friends: string[];
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: NextApiResponse,
  next: () => void
) {
  try {
    const uid = req.headers["x-user-id"] as string;
    if (!uid) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    await connectToDatabase();

    let name = "";
    let photo = "";
    let email = "";
    try {
      name = decodeURIComponent((req.headers["x-user-name"] as string) || "");
      photo = decodeURIComponent((req.headers["x-user-photo"] as string) || "");
      email = decodeURIComponent((req.headers["x-user-email"] as string) || "");
    } catch (e) {}

    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      user = await User.create({ firebaseUid: uid, name, photo, email });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name || name,
      photo: user.photo || photo,
      email: user.email || email,
      friends: (user.friends || []).map((f: any) => f.toString()),
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
