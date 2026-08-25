import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import { authMiddleware, AuthRequest } from "@/lib/serverAuth";

function runMiddleware(req: AuthRequest, res: NextApiResponse, fn: Function) {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      resolve();
    });
  });
}

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  await connectToDatabase();

  const authReq = req as AuthRequest;
  await runMiddleware(authReq, res, authMiddleware);

  try {
    const formidable = (await import("formidable")).default;
    const fs = await import("fs");
    const path = await import("path");

    const uploadsDir = "/tmp/uploads";
    try {
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (e) {}

    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 25 * 1024 * 1024,
    });

    const [fields, files] = await form.parse(req);
    const file = files.media?.[0];

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const ext = path.extname(file.originalFilename || "") || "";
    const newName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const newPath = path.join(uploadsDir, newName);
    fs.renameSync(file.filepath, newPath);

    const host = req.headers.host || "localhost";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const url = `${protocol}://${host}/api/publicspace/uploads/${newName}`;

    res.status(201).json({ url, filename: newName });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(400).json({ error: "Upload failed" });
  }
}
