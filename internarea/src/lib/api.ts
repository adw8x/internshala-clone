import axios from "axios";

const api = axios.create({
  // Single source of truth for the backend base URL.
  // Override with NEXT_PUBLIC_API_BASE_URL (e.g. on Vercel) when the
  // backend is hosted elsewhere. Defaults to the Render deployment.
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://internshala-clone-y2p2.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
