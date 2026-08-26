import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "../firebase/firebase";
import { Search } from "lucide-react";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { logout } from "@/Feature/Userslice";
import { setAdmin, clearAdmin } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/googleLogin";
import api from "@/lib/api";

interface SearchItem {
  type: "internship" | "job";
  _id: string;
  title: string;
  company: string;
  location: string;
}

const Navbar = () => {
  const user = useSelector(selectuser);
  const dispatch = useDispatch();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [internshipRes, jobRes] = await Promise.all([
          api.get("/internship"),
          api.get("/job"),
        ]);
        const q = search.trim().toLowerCase();
        const internships: SearchItem[] = (internshipRes.data || [])
          .filter(
            (item: any) =>
              item.title?.toLowerCase().includes(q) ||
              item.company?.toLowerCase().includes(q) ||
              item.location?.toLowerCase().includes(q) ||
              item.category?.toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map((item: any) => ({
            type: "internship" as const,
            _id: item._id,
            title: item.title,
            company: item.company,
            location: item.location,
          }));
        const jobs: SearchItem[] = (jobRes.data || [])
          .filter(
            (item: any) =>
              item.title?.toLowerCase().includes(q) ||
              item.company?.toLowerCase().includes(q) ||
              item.location?.toLowerCase().includes(q) ||
              item.category?.toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map((item: any) => ({
            type: "job" as const,
            _id: item._id,
            title: item.title,
            company: item.company,
            location: item.location,
          }));
        setResults([...internships, ...jobs]);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlelogin = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.role === "admin") {
        setAdmin();
        toast.success("Logged in as admin");
        router.push("/adminpanel");
      } else {
        toast.success("logged in successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("login failed");
    }
  };
  const handlelogout = () => {
    clearAdmin();
    dispatch(logout());
    signOut(auth);
    router.push("/");
  };
  return (
    <div className="relative">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="text-xl font-bold text-blue-600">
                <img src={"/logo.png"} alt="" className="h-16" />
              </a>
            </div>
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/internship"}>
                  <span>Internships</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/job"}>
                  <span>Jobs</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/publicspace"}>
                  <span>Public Space</span>
                </Link>
              </button>
              {user && (
                <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                  <Link href={"/discover"}>
                    <span>Discover</span>
                  </Link>
                </button>
              )}
              <div className="relative" ref={searchRef}>
                <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                  <Search size={16} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search opportunities..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    className="ml-2 bg-transparent focus:outline-none text-sm w-48"
                  />
                </div>
                {showDropdown && (
                  <div className="absolute top-full mt-2 w-80 bg-white shadow-lg rounded-xl border border-gray-200 py-2 z-50">
                    {searching && (
                      <p className="px-4 py-2 text-sm text-gray-500">
                        Searching...
                      </p>
                    )}
                    {!searching && results.length === 0 && (
                      <p className="px-4 py-2 text-sm text-gray-500">
                        No results found
                      </p>
                    )}
                    {!searching && results.length > 0 && (
                      <>
                        {results.some((r) => r.type === "internship") && (
                          <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">
                            Internships
                          </p>
                        )}
                        {results
                          .filter((r) => r.type === "internship")
                          .map((item) => (
                            <Link
                              key={`internship-${item._id}`}
                              href={`/internship/${item._id}`}
                              onClick={() => {
                                setShowDropdown(false);
                                setSearch("");
                              }}
                              className="block px-4 py-2 hover:bg-gray-50"
                            >
                              <p className="text-sm font-medium text-gray-800">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.company} · {item.location}
                              </p>
                            </Link>
                          ))}
                        {results.some((r) => r.type === "job") && (
                          <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">
                            Jobs
                          </p>
                        )}
                        {results
                          .filter((r) => r.type === "job")
                          .map((item) => (
                            <Link
                              key={`job-${item._id}`}
                              href={`/job/${item._id}`}
                              onClick={() => {
                                setShowDropdown(false);
                                setSearch("");
                              }}
                              className="block px-4 py-2 hover:bg-gray-50"
                            >
                              <p className="text-sm font-medium text-gray-800">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.company} · {item.location}
                              </p>
                            </Link>
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative flex items-center space-x-2">
                  <Link href={"/profile"}>
                    {user.photo ? (
                      <img
                        src={user.photo}
                        alt={user.name || "profile"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <button
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                    onClick={handlelogout}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login?tab=admin">
                    <span className="text-gray-600 hover:text-gray-800">
                      Admin
                    </span>
                  </Link>
                  <Link href="/login?tab=register">
                    <span className="text-gray-600 hover:text-gray-800">
                      User
                    </span>
                  </Link>
                  <button
                    onClick={handlelogin}
                    className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-center space-x-2 hover:bg-gray-50 "
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-gray-700 hidden lg:inline">
                      Sign in with Google
                    </span>
                    <span className="text-gray-700 lg:hidden">Google</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
