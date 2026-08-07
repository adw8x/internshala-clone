import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
  ArrowUpRight,
  Banknote,
  Calendar,
  ChevronRight,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import api from "@/lib/api";
import { selectuser, login } from "@/Feature/Userslice";
import { setAdmin } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/googleLogin";

export default function SvgSlider() {
  const categories = [
    "Big Brands",
    "Work From Home",
    "Part-time",
    "MBA",
    "Engineering",
    "Media",
    "Design",
    "Data Science",
  ];
  // const internships = [
  //   {
  //     _id: "1",
  //     title: "Software Engineering Intern",
  //     company: "Google",
  //     location: "Remote",
  //     stipend: "$1,500/month",
  //     duration: "3 months",
  //     category: "Engineering",
  //   },
  //   {
  //     _id: "2",
  //     title: "Marketing Intern",
  //     company: "Meta",
  //     location: "New York",
  //     stipend: "$1,200/month",
  //     duration: "6 months",
  //     category: "Media",
  //   },
  //   {
  //     _id: "3",
  //     title: "Graphic Design Intern",
  //     company: "Adobe",
  //     location: "San Francisco",
  //     stipend: "$1,000/month",
  //     duration: "4 months",
  //     category: "Design",
  //   },
  // ];

  // const jobs = [
  //   {
  //     _id: "101",
  //     title: "Frontend Developer",
  //     company: "Amazon",
  //     location: "Seattle",
  //     CTC: "$100K/year",
  //     Experience: "2+ years",
  //     category: "Engineering",
  //   },
  //   {
  //     _id: "102",
  //     title: "Data Analyst",
  //     company: "Microsoft",
  //     location: "Remote",
  //     CTC: "$90K/year",
  //     Experience: "1+ years",
  //     category: "Data Science",
  //   },
  //   {
  //     _id: "103",
  //     title: "UX Designer",
  //     company: "Apple",
  //     location: "California",
  //     CTC: "$110K/year",
  //     Experience: "3+ years",
  //     category: "Design",
  //   },
  // ];
  const slides = [
    {
      pattern: "pattern-1",
      title: "Start Your Career Journey",
      bgColor: "bg-indigo-600",
    },
    {
      pattern: "pattern-2",
      title: "Learn From The Best",
      bgColor: "bg-blue-600",
    },
    {
      pattern: "pattern-3",
      title: "Grow Your Skills",
      bgColor: "bg-purple-600",
    },
    {
      pattern: "pattern-4",
      title: "Connect With Top Companies",
      bgColor: "bg-teal-600",
    },
  ];

  const stats = [
    { number: "300K+", label: "companies hiring" },
    { number: "10K+", label: "new openings everyday" },
    { number: "21Mn+", label: "active students" },
    { number: "600K+", label: "learners" },
  ];
  const [internships, setinternship] = useState<any>([]);
  const [jobs, setjob] = useState<any>([]);
  const user = useSelector(selectuser);
  const dispatch = useDispatch();
  const router = useRouter();
  useEffect(() => {
    const fetchdata = async () => {
      try {
        const [internshipres, jobres] = await Promise.all([
          api.get("/internship"),
          api.get("/job"),
        ]);
        setinternship(internshipres.data);
        setjob(jobres.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchdata();
  }, []);

  const handleGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.role === "admin") {
        setAdmin();
        toast.success("Logged in as admin");
        router.push("/adminpanel");
      } else {
        dispatch(
          login({
            uid: result.uid,
            name: result.name,
            email: result.email,
            photo: result.photo,
          })
        );
        toast.success("Logged in successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Slider */}
      <div className="bg-white">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000 }}
          loop
          className="h-[420px]"
        >
          {slides.map((slide, idx) => (
            <SwiperSlide key={idx}>
              <div
                className={`flex items-center justify-center h-[420px] ${slide.bgColor}`}
              >
                <h2 className="text-3xl md:text-5xl font-bold text-white text-center px-4">
                  {slide.title}
                </h2>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Login Options */}
      {!user && (
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Join Internshala Today
              </h2>
              <p className="text-gray-600 mt-1">
                Register to explore internships, jobs and the community
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/login?tab=register">
                <span className="block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center">
                  Register
                </span>
              </Link>
              <Link href="/login?tab=admin">
                <span className="block px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center">
                  Admin
                </span>
              </Link>
              <button
                onClick={handleGoogle}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
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
                Login with Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow-sm p-6 text-center"
          >
            <div className="text-2xl font-bold text-blue-600">
              {stat.number}
            </div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <h3 className="text-xl font-semibold mb-4 text-black">Popular Categories</h3>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <span
              key={cat}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Internships */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-black">Latest Internships</h3>
          <Link
            href="/internship"
            className="text-blue-600 flex items-center gap-1 text-sm"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {internships.slice(0, 6).map((item: any) => (
            <Link
              key={item._id}
              href={`/detailiternship/${item._id}`}
              className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{item.title}</h4>
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mt-1">{item.company}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                <MapPin className="h-4 w-4" /> {item.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Banknote className="h-4 w-4" /> {item.stipend}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Jobs */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-black">Latest Jobs</h3>
          <Link
            href="/job"
            className="text-blue-600 flex items-center gap-1 text-sm"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {jobs.slice(0, 6).map((item: any) => (
            <Link
              key={item._id}
              href={`/detailjob/${item._id}`}
              className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{item.title}</h4>
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mt-1">{item.company}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                <MapPin className="h-4 w-4" /> {item.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Calendar className="h-4 w-4" /> {item.StartDate}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
