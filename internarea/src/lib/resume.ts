export const RESUME_FEE_INR = 50;
export const RESUME_FEE_PAISE = RESUME_FEE_INR * 100;

export function isPremiumPlan(planId: string | null | undefined): boolean {
  return Boolean(planId) && planId !== "free";
}

export interface ResumeEducation {
  degree?: string;
  institution?: string;
  year?: string;
  percentage?: string;
}

export interface ResumeExperience {
  company?: string;
  role?: string;
  duration?: string;
  description?: string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  summary?: string;
  skills?: string[];
  education?: ResumeEducation[];
  experience?: ResumeExperience[];
  photo?: string;
}

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function lineBreak(value?: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

export function generateResumeHtml(data: ResumeData): string {
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const phone = escapeHtml(data.phone);
  const address = escapeHtml(data.address);

  const contactItems = [email && `Email: ${email}`, phone && `Phone: ${phone}`, address && `Address: ${address}`]
    .filter(Boolean)
    .join(" &nbsp;|&nbsp; ");

  const contactRow = contactItems
    ? `<div style="color:#6b7280;font-size:12px;margin-top:4px;">${contactItems}</div>`
    : "";

  const photoHtml = data.photo
    ? `<img src="${escapeHtml(data.photo)}" alt="Photo" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #2563eb;flex-shrink:0" />`
    : "";

  const summaryHtml = data.summary
    ? `<div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 18px;margin-top:14px;color:#374151;font-size:13px;line-height:1.6;">${lineBreak(data.summary)}</div>`
    : "";

  const skillsHtml = (data.skills || [])
    .filter((s) => s && s.trim())
    .map(
      (s) =>
        `<span style="display:inline-block;background:#2563eb;color:#fff;font-size:12px;font-weight:600;padding:4px 12px;border-radius:999px;margin:3px 4px 3px 0;">${escapeHtml(s)}</span>`
    )
    .join("");

  const educationItems = (data.education || [])
    .filter((e) => e && (e.degree || e.institution))
    .map((e) => {
      const left = lineBreak(e.degree || "Course");
      const meta = [e.institution, e.year, e.percentage ? `${e.percentage}%` : ""]
        .filter(Boolean)
        .join(" &middot; ");
      return `<div style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
        <div style="font-weight:700;color:#111827;font-size:13px;">${left}</div>
        <div style="color:#6b7280;font-size:12px;">${meta}</div>
      </div>`;
    })
    .join("");

  const experienceItems = (data.experience || [])
    .filter((x) => x && (x.company || x.role))
    .map((x) => {
      const meta = [x.company, x.duration].filter(Boolean).join(" &middot; ");
      return `<div style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
        <div style="font-weight:700;color:#111827;font-size:13px;">${lineBreak(x.role || "Role")}</div>
        <div style="color:#2563eb;font-size:12px;font-weight:500;">${meta}</div>
        ${
          x.description
            ? `<div style="color:#4b5563;font-size:12px;line-height:1.6;margin-top:4px;">${lineBreak(x.description)}</div>`
            : ""
        }
      </div>`;
    })
    .join("");

  const skillsSection = skillsHtml
    ? `<div style="margin-top:18px;"><h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#2563eb;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-bottom:10px;">Skills</h2>${skillsHtml}</div>`
    : "";

  const educationSection = educationItems
    ? `<div style="margin-top:18px;"><h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#2563eb;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-bottom:10px;">Education</h2>${educationItems}</div>`
    : "";

  const experienceSection = experienceItems
    ? `<div style="margin-top:18px;"><h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#2563eb;border-bottom:2px solid #e5e7eb;padding-bottom:6px;margin-bottom:10px;">Experience</h2>${experienceItems}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${name} - Resume</title>
  <style>
    @media print {
      body { background:#fff !important; }
      .page { box-shadow:none !important; margin:0 !important; border:none !important; }
    }
    body { font-family:Arial, Helvetica, sans-serif; background:#f3f4f6; margin:0; padding:24px; color:#111827; }
    .page { max-width:794px; margin:0 auto; background:#fff; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,.08); overflow:hidden; }
    .header { background:linear-gradient(135deg,#1d4ed8,#2563eb); color:#fff; padding:26px 32px; display:flex; align-items:center; gap:20px; }
    .header h1 { margin:0; font-size:26px; letter-spacing:.5px; }
    .content { padding:10px 32px 28px; }
    .col-head { font-size:13px; text-transform:uppercase; letter-spacing:1.5px; color:#2563eb; border-bottom:2px solid #e5e7eb; padding-bottom:6px; margin-bottom:10px; }
    table { width:100%; border-collapse:collapse; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      ${photoHtml}
      <div style="flex:1">
        <h1>${name}</h1>
        ${contactRow}
      </div>
    </div>
    <div class="content">
      ${summaryHtml}
      ${skillsSection}
      ${educationSection}
      ${experienceSection}
    </div>
  </div>
</body>
</html>`;
}