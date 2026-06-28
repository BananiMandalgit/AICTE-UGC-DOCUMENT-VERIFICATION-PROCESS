"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, GraduationCap, BarChart2, Users, LogIn, Image as ImageIcon, Megaphone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const config = {
  primaryColor: "#6d28d9",
  hoverColor: "#5b21b6",
  secondaryColor: "#7c3aed",
  surfaceColor: "#ffffff",
  backgroundColor: "#f5f3ff",
  textColor: "#1f2937",
  portalTitle: "AISHE Analytics & Reporting Portal",
};

export default function AISHELanding() {
  const [showAboutInfo, setShowAboutInfo] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const navigate = useNavigate();

  const announcements = [
    {
      id: 1,
      title: "AISHE 2024–25 Survey Window Open",
      body: "Institutions can now submit AISHE data for the current academic year.",
      date: "2025-11-15",
    },
    {
      id: 2,
      title: "Data Validation & Consistency Checks",
      body: "Automated validations are enabled for student strength, faculty count, and programme-wise intake.",
      date: "2025-10-30",
    },
    {
      id: 3,
      title: "Integration with NAAC & NIRF",
      body: "AISHE indicators are now mapped with NAAC and NIRF KPIs for unified reporting.",
      date: "2025-09-10",
    },
  ];

  const handleLogin = (type: string) => {
    if (type === "Institution") navigate("/institute/login");
    if (type === "Evaluator") navigate("/evaluator");
    if (type === "Admin") navigate("/admin");
  };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden p-6"
      style={{
        background: `linear-gradient(135deg, ${config.backgroundColor} 0%, #ede9fe 50%, ${config.backgroundColor} 100%)`,
      }}
    >
      {/* decorative blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-10 -left-10 w-72 h-72 rounded-full opacity-20 animate-[float_8s_ease-in-out_infinite]"
          style={{
            background: `radial-gradient(circle, ${config.primaryColor} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -bottom-20 -right-6 w-96 h-96 rounded-full opacity-15 animate-[float_10s_ease-in-out_infinite]"
          style={{
            background: `radial-gradient(circle, ${config.secondaryColor} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* header */}
      <header className="relative z-10 flex items-center justify-between mb-6">
        <Link to="/" className="flex items-center gap-4" aria-label="AISHE Home">
          <div className="h-14 w-14 rounded-full flex items-center justify-center bg-white shadow-md border border-violet-200">
            <BarChart2 className="h-8 w-8" style={{ color: config.primaryColor }} />
          </div>
          <div className="flex flex-col">
            <span
              className="font-bold text-sm sm:text-base md:text-lg"
              style={{ color: config.textColor }}
            >
              All India Survey on Higher Education (AISHE)
            </span>
            <span className="text-xs sm:text-sm md:text-base text-gray-600">
              राष्ट्रीय उच्च शिक्षा सर्वेक्षण
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <button
            onClick={() => setShowAboutInfo(true)}
            className="text-sm px-3 py-2 rounded-lg hover:shadow-sm transition"
            style={{ color: config.textColor }}
          >
            About
          </button>
          <Dialog open={showAboutInfo} onOpenChange={setShowAboutInfo}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>About AISHE</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                AISHE collects detailed data on higher education in India — student
                enrolment, faculty strength, programmes, infrastructure, and
                financials. This portal adds AI-assisted validation, anomaly
                detection, and dashboarding on top of AISHE indicators, helping
                institutions ensure clean, consistent and policy-aligned data
                submissions.
              </DialogDescription>
            </DialogContent>
          </Dialog>

          <button
            onClick={() => setShowContact(true)}
            className="text-sm px-3 py-2 rounded-lg hover:shadow-sm transition"
            style={{ color: config.textColor }}
          >
            Contact
          </button>
          <Dialog open={showContact} onOpenChange={setShowContact}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contact (AISHE Cell)</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>Helpdesk:</strong> 011-2958 6400 / 011-2958 6401
                </p>
                <p>
                  <strong>Email:</strong> support-aishe@example.gov.in
                </p>
                <p>
                  For technical issues related to this portal, raise a ticket
                  through the integrated support panel after login.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <button
            onClick={() => setShowGallery(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border transition transform hover:-translate-y-0.5"
            style={{
              borderColor: `${config.primaryColor}33`,
              color: config.primaryColor,
            }}
          >
            <ImageIcon className="h-4 w-4" />
            Gallery
          </button>

          <Dialog open={showGallery} onOpenChange={setShowGallery}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>AISHE Visuals</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((id) => (
                    <button
                      key={id}
                      type="button"
                      className="relative aspect-video rounded-lg overflow-hidden shadow-sm bg-violet-50 hover:shadow-md transition"
                      onClick={() =>
                        setActiveImage(
                          `https://dummyimage.com/800x450/ede9fe/4c1d95&text=AISHE+Dashboard+${id}`
                        )
                      }
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-violet-900 bg-violet-100/40">
                        AISHE Indicator View {id}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Dialog open={!!activeImage} onOpenChange={() => setActiveImage(null)}>
            <DialogContent className="max-w-4xl">
              <img
                src={activeImage ?? ""}
                alt="AISHE visualization"
                className="w-full rounded-lg"
              />
            </DialogContent>
          </Dialog>

          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg border transition transform hover:-translate-y-0.5"
            style={{
              borderColor: `${config.primaryColor}33`,
              color: config.primaryColor,
            }}
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Login</span>
          </button>
        </nav>
      </header>

      {/* announcement strip */}
      <div className="relative z-10 mb-6">
        <div className="rounded-lg p-3 bg-white shadow-sm flex items-center gap-4">
          <Megaphone className="h-5 w-5 text-violet-600" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold">Announcements</div>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-700">
              <div className="whitespace-nowrap overflow-hidden">
                <div>
                  {announcements
                    .map((a) => `${a.date} — ${a.title} • `)
                    .join(" ")}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAnnouncements(!showAnnouncements)}
              className="px-3 py-1 transition-colors"
              style={{ backgroundColor: config.primaryColor, color: "#fff" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = config.hoverColor)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = config.primaryColor)
              }
            >
              {showAnnouncements ? "Hide" : "Open"}
            </Button>
          </div>
        </div>

        {showAnnouncements && (
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            {announcements.map((a) => (
              <Card key={a.id} className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm">{a.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600">{a.date}</p>
                  <p className="mt-2 text-sm">{a.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* main area */}
      <main className="relative z-10 flex-1 flex items-start justify-center">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-start">
          {/* left panel */}
          <div className="space-y-6 animate-[fadeInLeft_700ms_ease]">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white shadow-sm">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "#7c3aed" }}
              />
              Unified AISHE Data + AI Validation
            </span>

            <h1
              className="text-4xl md:text-5xl font-extrabold leading-tight"
              style={{ color: config.textColor }}
            >
              {config.portalTitle}
            </h1>

            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Capture and validate <span className="font-semibold">AISHE
              indicators</span> with automated checks on enrolment, faculty,
              programmes, infrastructure and finances. Generate clean, consistent
              datasets ready for national reporting and downstream use in NAAC,
              NIRF and internal dashboards.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <button
                onClick={() => handleLogin("Institution")}
                className="px-4 py-3 rounded-xl shadow-md text-sm font-semibold transform transition hover:-translate-y-0.5"
                style={{ background: config.primaryColor, color: "#fff" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = config.hoverColor)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = config.primaryColor)
                }
              >
                Institution Login
              </button>
              <button
                onClick={() => handleLogin("Evaluator")}
                className="px-4 py-3 rounded-xl shadow-md text-sm font-semibold bg-white border border-violet-200 text-violet-800 hover:-translate-y-0.5 transform transition"
              >
                Evaluator Login
              </button>
              <button
                onClick={() => handleLogin("Admin")}
                className="px-4 py-3 rounded-xl shadow-md text-sm font-semibold bg-white border border-gray-200 text-gray-800 hover:-translate-y-0.5 transform transition"
              >
                Admin Console
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-6 text-xs md:text-sm">
              <div className="flex items-start gap-2 bg-white/70 p-3 rounded-lg shadow-sm">
                <GraduationCap
                  className="h-5 w-5 mt-0.5"
                  style={{ color: config.primaryColor }}
                />
                <div>
                  <div className="font-semibold">Programme-wise Enrolment</div>
                  <p className="text-gray-600">
                    Validate UG / PG / PhD counts against sanctioned intake and
                    historical trends.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-white/70 p-3 rounded-lg shadow-sm">
                <Users
                  className="h-5 w-5 mt-0.5"
                  style={{ color: config.secondaryColor }}
                />
                <div>
                  <div className="font-semibold">Faculty & Staff</div>
                  <p className="text-gray-600">
                    Track faculty strength, qualifications and student–faculty
                    ratios as per AISHE norms.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-white/70 p-3 rounded-lg shadow-sm">
                <Book
                  className="h-5 w-5 mt-0.5"
                  style={{ color: "#4c1d95" }}
                />
                <div>
                  <div className="font-semibold">Derived Indicators</div>
                  <p className="text-gray-600">
                    Generate derived KPIs feeding into NIRF, NAAC and internal
                    quality dashboards.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* right panel */}
          <div className="space-y-4 animate-[fadeInRight_700ms_ease]">
            <Card className="shadow-md border-violet-100">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2
                    className="h-5 w-5"
                    style={{ color: config.primaryColor }}
                  />
                  AISHE Indicator Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Total Enrolment Consistency</span>
                  <span className="font-semibold text-violet-700">98.4%</span>
                </div>
                <div className="flex justify-between">
                  <span>Faculty Data Completeness</span>
                  <span className="font-semibold text-violet-700">96.1%</span>
                </div>
                <div className="flex justify-between">
                  <span>Programme Mapping Coverage</span>
                  <span className="font-semibold text-violet-700">93.5%</span>
                </div>
                <div className="flex justify-between">
                  <span>Anomaly Flags Resolved</span>
                  <span className="font-semibold text-emerald-600">87.2%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-gradient-to-br from-violet-50 to-white border-violet-100">
              <CardHeader>
                <CardTitle className="text-base">How this portal helps</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 space-y-2">
                <p>
                  • Guided capture flows aligned with official AISHE formats.
                </p>
                <p>
                  • Rule-based and AI-driven validations for inconsistent or
                  missing data.
                </p>
                <p>
                  • One-click exports for submissions and internal quality
                  audits.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
