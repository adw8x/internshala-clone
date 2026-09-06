import api from "@/lib/api";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface ResumeFull {
  _id: string;
  name: string;
  email: string;
  status: string;
  amountINR: number;
  generatedHtml: string;
  paidAt: string | null;
}

const ResumeViewPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [resume, setResume] = useState<ResumeFull | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/resume/${id}`)
      .then((res) => setResume(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 text-center text-gray-500">
        Loading resume...
      </div>
    );
  }

  if (notFound || !resume) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 text-center">
        <p className="text-gray-600 mb-6">Resume not found.</p>
        <Link
          href="/resume"
          className="inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Resume Builder
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900">{resume.name}&apos;s Resume</p>
              <p className="text-xs text-gray-500">
                {resume.status === "paid"
                  ? `Paid ₹${resume.amountINR} · Generated ${resume.paidAt ? new Date(resume.paidAt).toLocaleString("en-IN") : ""}`
                  : "Awaiting payment — resume not generated"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {resume.status === "paid" && (
              <>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  <Printer className="h-4 w-4" /> Save as PDF
                </button>
              </>
            )}
            <Link
              href="/resume"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium bg-gray-100 px-4 py-2 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" /> Builder
            </Link>
          </div>
        </div>

        {resume.status === "paid" && resume.generatedHtml ? (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <iframe
              srcDoc={resume.generatedHtml}
              title={`${resume.name} Resume`}
              className="w-full min-h-[1000px]"
              style={{ border: "none" }}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            <p className="text-gray-600 mb-4">
              This resume has not been generated yet. The payment for this resume
              is still pending or the resume was created before payment.
            </p>
            <Link
              href="/resume"
              className="inline-flex items-center gap-2 text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Resume Builder
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeViewPage;