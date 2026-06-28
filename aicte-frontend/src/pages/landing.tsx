'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, GraduationCap, Building, Users, LogIn, Image as ImageIcon, Megaphone } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

// --- IMAGES (provided in the conversation, stored in the container) ---
const galleryImages = [
  'https://tse4.mm.bing.net/th/id/OIP.-zLDekd2XBDwmfd0m_pxywHaE8?pid=Api&P=0&h=180',
  'https://www.thestatesman.com/wp-content/uploads/2023/08/820142160-aicte-margdarshan_850x478.jpg',
  'https://www.aicte.gov.in/sites/default/files/images/slideshow/Banner-4_0.jpg',
  'https://scontent.fccu27-2.fna.fbcdn.net/v/t39.30808-6/588699752_1155963856726383_1334451745312803748_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=127cfc&_nc_ohc=FY-yfi2VIz8Q7kNvwHZsdOC&_nc_oc=AdmK8Flsk1rTdnVZ5s0929Ce73W9g1HU7NFHHWnd9lF9HlouduFBaydM0ZX3P5CRSQLlAVRG-nbqNn5ky-vFiNvG&_nc_zt=23&_nc_ht=scontent.fccu27-2.fna&_nc_gid=1PxO0GjDP5WYYldFhM202A&oh=00_AfgkXuwwzi_pyeMOpVhA_gQPdwvqcIHmFOcOSnWh85AfwQ&oe=69320FB8',
  'https://scontent.fccu27-2.fna.fbcdn.net/v/t39.30808-6/592068881_1155963966726372_263672633861692394_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=127cfc&_nc_ohc=xaj_8kZTrbEQ7kNvwFXWHjb&_nc_oc=AdkFDgcLkosUbwBPrjIQHSS4NOqOZABuHVXzyRjGrgeUHTUEl7k4LsmZMbG5Z7ibOeoPFEnNuttu7XWlKbQO1f5E&_nc_zt=23&_nc_ht=scontent.fccu27-2.fna&_nc_gid=WRas_n09FaExQokz0Eqpmg&oh=00_AfiOV4RUNx76xbrx-YN5uXtMp6IYJhkJhZUBC-LnaTQB7w&oe=69322322',
  'https://scontent.fccu27-2.fna.fbcdn.net/v/t39.30808-6/585587994_1150568593932576_1744386464857986547_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=D6b08V6gnkMQ7kNvwF09Ooq&_nc_oc=AdnsVP65uMt7kOvls4Sgpf6k9adki4coYe93zOT0oNYTJU1OssBm2sUWibPzfw_WO8deN3WS2SF1jDHpuh5bzicl&_nc_zt=23&_nc_ht=scontent.fccu27-2.fna&_nc_gid=40TbXVX13MYCUiNswU4qmA&oh=00_AfitecOgP_EXN4OGD8qClksqr0bB5_0pJ8qozBrj9MDf9w&oe=693212B4',
  'https://scontent.fccu27-2.fna.fbcdn.net/v/t39.30808-6/587963959_1150568573932578_4207800528701474239_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=127cfc&_nc_ohc=1N0dCilyAucQ7kNvwG-91SV&_nc_oc=Adnq-GgpR9XuTtX27bviJdYuXOAZKeJGROIU45-MWqJPF75SC2hHNk0VzVPcsburmyW3aI5pc1Vpd-IhbBCciCk7&_nc_zt=23&_nc_ht=scontent.fccu27-2.fna&_nc_gid=nhwtzJEW9i0MVdqNzBFFPQ&oh=00_AfjnEpVTTu9WqBWeQk4Xp1QF_Mj3shSPzyeFGCif_4lldw&oe=693216A4',
  'https://scontent.fccu27-3.fna.fbcdn.net/v/t39.30808-6/575668139_1138523341803768_2170959424798602933_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=127cfc&_nc_ohc=RRoVFJ2kajEQ7kNvwFmyKSA&_nc_oc=AdnwsL1WvZJNr8OpkK5PiGNAXLaXSDClffqmphPbtNNGRGovv9g9OrYt0hir2lUTavhY3YXC3-MhrhTfgCuZp-5l&_nc_zt=23&_nc_ht=scontent.fccu27-3.fna&_nc_gid=KZDjMI5SWGbimZOfEMkXnw&oh=00_AfhCx6-JxWjoST6RbPGG6Ain54ZGNsfO9o8s1PQv4tAwYw&oe=693215BE',
  'https://scontent.fccu27-2.fna.fbcdn.net/v/t39.30808-6/572099074_1313496427457924_6216819515634266992_n.jpg?stp=dst-jpg_s590x590_tt6&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=EGCoQ2qLTzQQ7kNvwGFj_Qy&_nc_oc=AdkFq68fWpMmNDmQzrd2OZlz5CtkWzNJhuMDRXPgiNImkG1FxMZ7k_YkPj5KmuQPlpgApe9A-brAB9tXUbdc1Sq2&_nc_zt=23&_nc_ht=scontent.fccu27-2.fna&_nc_gid=bA3jMz2Fa33rNtild9PaJQ&oh=00_Afj45BjKEzEJE-fbH5KoQLUdSAjmF1IlyT9tDy-HyBujhQ&oe=69324090',
]
/**
 * DESIGN CONFIG — edit these colors to quickly theme the page
 */
const config = {
  primaryColor: "#0b6e4f",
  hoverColor: "#095a40",
  secondaryColor: "#0f4c81",
  surfaceColor: "#ffffff",
  backgroundColor: "#f7fbf9",
  textColor: "#0f172a",
  portalTitle: "AICTE Document Verification Portal",
}

export default function AICTEPortal() {
  const [loginType] = useState("")
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [showAboutInfo, setShowAboutInfo] = useState(false)
  const [showInitiatives, setShowInitiatives] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [showAnnouncements, setShowAnnouncements] = useState(true)
  const navigate = useNavigate()

  const handleLogin = (type: string) => {
    if (type === "University") navigate("/institute/regulation-select")
    if (type === "Evaluator") navigate("/evaluator/regulation-select")
    if (type === "Admin") navigate("/admin")
  }

  // sample announcements — you can replace with API data
  const announcements = [
    { id: 1, title: 'New Approval Guidelines', body: 'AICTE has released updated approval guidelines for 2025. Check the circular for details.', date: '2025-11-20' },
    { id: 2, title: 'One Student One Tree', body: 'Register your campus for the One Student One Tree campaign before Dec 15.', date: '2025-10-02' },
    { id: 3, title: 'Smart India Hackathon', body: 'Round 1 results have been published.', date: '2025-09-18' },
  ]

  // external share links (user requested facebook link)
  const facebookShare = 'https://www.facebook.com/share/17aa1zn9gS/'
  // placeholder youtube playlist or video link — replace with real ID
  const youtubeLink = 'https://www.youtube.com/live/VOd40u_l-kg?si=IGlp8ErweVBBPnzf'

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden p-6"
      style={{
        background: `linear-gradient(135deg, ${config.backgroundColor} 0%, #E8E8E8 50%, ${config.backgroundColor} 100%)`,
      }}
    >
      {/* decorative blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-10 -left-10 w-72 h-72 rounded-full opacity-20 animate-[float_8s_ease-in-out_infinite]"
          style={{ background: `radial-gradient(circle, ${config.primaryColor} 0%, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-20 -right-6 w-96 h-96 rounded-full opacity-15 animate-[float_10s_ease-in-out_infinite]"
          style={{ background: `radial-gradient(circle, ${config.secondaryColor} 0%, transparent 70%)` }}
        />
      </div>

      {/* header */}
      <header className="relative z-10 flex items-center justify-between mb-6">
        <Link to="/" className="flex items-center gap-4" aria-label="AICTE Home">
          <img
            src="https://scontent.fccu20-1.fna.fbcdn.net/v/t39.30808-6/596620374_832688063078973_147994407975857527_n.jpg?stp=dst-jpg_p526x296_tt6&_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_ohc=gcCW1s7VxIgQ7kNvwFydmmk&_nc_oc=AdmQK4aTipAEX6pAKMWMXs4FljPGlduQbcPMvJv_gDGFfLxZW_Tav8moD-K6qAB9iYtG5so-WWyUQiwf1eYLotfc&_nc_zt=23&_nc_ht=scontent.fccu20-1.fna&_nc_gid=uJvJFqXRcMBjSRpcyEVnoA&oh=00_AfkmlvtSkpRTV8TIVF2uqd5TPMhDElrbvQSNrfxc1hw0SQ&oe=69397C0A"
            alt="Approval Enginex logo"
            className="h-16 w-16 object-contain"
          />
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base md:text-lg" style={{ color: config.textColor }}>
              All India Council for Technical Education
            </span>
            <span className="text-xs sm:text-sm md:text-base text-gray-600">अखिल भारतीय तकनीकी शिक्षा परिषद</span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <button onClick={() => setShowAboutInfo(true)} className="text-sm px-3 py-2 rounded-lg hover:shadow-sm transition" style={{ color: config.textColor }}>About</button>
          <Dialog open={showAboutInfo} onOpenChange={setShowAboutInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About AICTE</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            The All India Council for Technical Education (AICTE) is the statutory body and a national-level council for technical education, under the Department of Higher Education, Ministry of Education, Government of India. Established in November 1945, AICTE is responsible for proper planning and coordinated development of the technical education and management education system in India.
          </DialogDescription>
        </DialogContent>
      </Dialog>
          <button onClick={() => setShowInitiatives(true)} className="text-sm px-3 py-2 rounded-lg hover:shadow-sm transition" style={{ color: config.textColor }}>Initiatives</button>
          <Dialog open={showInitiatives} onOpenChange={setShowInitiatives}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AICTE Initiatives</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              <h3 className="font-bold">One Student One Tree 2023</h3>
              <p>A campaign aimed at combating climate change by promoting tree plantation. The goal is to plant one crore trees, with each student, faculty, and staff member encouraged to plant at least one tree.</p>
              
              <h3 className="font-bold">MeriLiFE Movement</h3>
              <p>This movement focuses on combating climate change and promoting environmental sustainability.</p>
              
              <h3 className="font-bold">AICTE Yoga Campaign 2023</h3>
              <p>Launched on International Yoga Day, this campaign promotes yoga among students and faculty to enhance physical and mental well-being.</p>
              
              <h3 className="font-bold">Jal Shakti Abhiyan</h3>
              <p>A scheme aimed at water conservation and management, with the theme "Sanchay Jal Behtar Kal" (Save Water for a Better Tomorrow).</p>
              
              <h3 className="font-bold">Smart India Hackathon</h3>
              <p>An initiative to encourage students to solve real-world problems through innovative solutions using technology.</p>
              
              <h3 className="font-bold">SWAYAM</h3>
              <p>A platform for providing online courses and study material for students and teachers.</p>
              
              <h3 className="font-bold">National Education Alliance for Technology (NEAT)</h3>
              <p>Aims to improve the quality of technical education through collaboration and innovation.</p>
              
              <h3 className="font-bold">Student Learning Assessment (PARAKH)</h3>
              <p>A framework to assess and improve the learning outcomes of students in technical education.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
          <button onClick={() => setShowContact(true)} className="text-sm px-3 py-2 rounded-lg hover:shadow-sm transition" style={{ color: config.textColor }}>Contact</button>
          <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact AICTE</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p><strong>Helpline Numbers:</strong></p>
            <p>011-2958 1000</p>
            <p>1800-572-3575 (Toll Free)</p>
            <p><strong>Email:</strong> helpdesk1@aicte-india.org</p>
          </div>
        </DialogContent>
      </Dialog>

          <button
            onClick={() => setShowGallery(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border transition transform hover:-translate-y-0.5"
            style={{ borderColor: `${config.primaryColor}33`, color: config.primaryColor }}
          >
            <ImageIcon className="h-4 w-4" />
            Gallery
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border transition transform hover:-translate-y-0.5" style={{ borderColor: `${config.primaryColor}33`, color: config.primaryColor }}>
                <LogIn className="h-4 w-4" />
                Login
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => handleLogin("University")}>Institution</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleLogin("Evaluator")}>Evaluator</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleLogin("Admin")}>Admin</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </header>

      {/* announcement strip */}
      <div className="relative z-10 mb-6">
        <div className="rounded-2xl p-5 bg-white shadow-md flex items-center gap-5">
          <Megaphone className="h-7 w-7 text-amber-600" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl font-semibold">Announcements</div>
              <div className="text-sm text-gray-500">{new Date().toLocaleDateString()}</div>
            </div>

            {/* scrolling short list */}
            <div className="mt-3 text-base text-gray-700">
              <div className="whitespace-nowrap overflow-hidden">
                <div
                  className="inline-block"
                  onMouseOver={() => { /* optionally pause animation */ }}
                  onMouseOut={() => { /* optionally resume animation */ }}
                >
                  {announcements.map(a => `${a.date} — ${a.title} • `).join(' ')}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowAnnouncements(!showAnnouncements)} 
              className="px-5 py-2 text-base transition-colors"
              style={{ 
                backgroundColor: config.primaryColor,
                color: '#fff'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = config.hoverColor}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = config.primaryColor}
            >
              Open
            </Button>
          </div>
        </div>

        {/* announcements expanded */}
        {showAnnouncements && (
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {announcements.map(a => (
              <Card key={a.id} className="shadow-md">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg">{a.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{a.date}</p>
                  <p className="mt-3 text-base leading-relaxed">{a.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* main area */}
      <main className="relative z-10 flex-1 flex items-start justify-center">
        <div className="max-w-6xl w-full grid md:grid-cols-1 gap-8 items-start">
          <div className="space-y-6 animate-[fadeInLeft_700ms_ease]">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white shadow-sm">
              <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
              Live AI-Powered Approval Portal
            </span>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: config.textColor }}>
              {config.portalTitle}
            </h1>

            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Streamline <span className="font-semibold">AICTE & academic approvals</span> with intelligent document verification,
              blueprint analysis, and automated compliance reporting.
            </p>

            {/* THREE LOGIN BUTTONS */}
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <button 
                onClick={() => navigate("/institute/regulation-select")} 
                className="btn-same px-4 py-3 rounded-xl shadow-md text-sm font-semibold transform transition hover:-translate-y-0.5" 
                style={{ background: config.primaryColor, color: "#fff" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = config.hoverColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = config.primaryColor}
                aria-label="Institution Login"
              >
                Institution Login
              </button>

              <button 
                onClick={() => navigate("/evaluator/regulation-select")} 
                className="btn-same px-4 py-3 rounded-xl text-sm font-semibold shadow-md transform transition hover:-translate-y-0.5" 
                style={{ background: config.primaryColor, color: "#fff" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = config.hoverColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = config.primaryColor}
                aria-label="Evaluator Login"
              >
                Evaluator Login
              </button>

              <button 
                onClick={() => navigate("/admin")} 
                className="btn-same px-4 py-3 rounded-xl text-sm font-semibold shadow-md transform transition hover:-translate-y-0.5" 
                style={{ background: config.primaryColor, color: "#fff" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = config.hoverColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = config.primaryColor}
                aria-label="Admin Login"
              >
                Admin Login
              </button>
            </div>

            {/* gallery preview + share */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">Event Gallery</h3>
                <div className="flex items-center gap-2">
                  <a href={facebookShare} target="_blank" rel="noreferrer" className="text-sm underline">Share on Facebook</a>
                  <a href={youtubeLink} target="_blank" rel="noreferrer" className="text-sm underline">Watch on YouTube</a>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {galleryImages.slice(0, 8).map((src, idx) => (
                  <button key={src} onClick={() => { setActiveImage(src); setShowGallery(true) }} className="overflow-hidden rounded-md shadow-sm bg-white">
                    {/* use img with object-cover */}
                    <img src={src} alt={`gallery-${idx}`} className="w-full h-28 object-cover" />
                  </button>
                ))}
              </div>

            </div>

          </div>
        </div>
      </main>

     

<section className="relative z-10 w-full py-12 mt-12 bg-transparent">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: config.textColor }}>
            Key Features
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Book className="h-6 w-6 mb-2" aria-hidden="true" />
                <CardTitle>Quality Education</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Ensuring high standards in technical education across India</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <GraduationCap className="h-6 w-6 mb-2" aria-hidden="true" />
                <CardTitle>Skill Development</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Promoting skill-based learning and industry-relevant curricula</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Building className="h-6 w-6 mb-2" aria-hidden="true" />
                <CardTitle>Institution Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Regulating and approving technical institutions across the country</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-6 w-6 mb-2" aria-hidden="true" />
                <CardTitle>Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Fostering industry-academia partnerships for better outcomes</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* footer */}
     {/* ---- FOOTER ---- */}
<footer
  className="relative z-10 w-full mt-16 border-t"
  style={{ background: config.backgroundColor }}
>
  <div className="max-w-6xl mx-auto px-4 py-10">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

      {/* Column 1 — Logo & About */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <img
            src="https://scontent.fccu20-1.fna.fbcdn.net/v/t39.30808-6/596620374_832688063078973_147994407975857527_n.jpg?stp=dst-jpg_p526x296_tt6&_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_ohc=gcCW1s7VxIgQ7kNvwFydmmk&_nc_oc=AdmQK4aTipAEX6pAKMWMXs4FljPGlduQbcPMvJv_gDGFfLxZW_Tav8moD-K6qAB9iYtG5so-WWyUQiwf1eYLotfc&_nc_zt=23&_nc_ht=scontent.fccu20-1.fna&_nc_gid=uJvJFqXRcMBjSRpcyEVnoA&oh=00_AfkmlvtSkpRTV8TIVF2uqd5TPMhDElrbvQSNrfxc1hw0SQ&oe=69397C0A"
            className="h-12 w-24 object-contain rounded"
          />
          <h3 className="font-semibold text-lg" style={{ color: config.textColor }}>
            AICTE
          </h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          All India Council for Technical Education — advancing quality
          technical education and academic excellence across India.
        </p>
      </div>

      {/* Column 2 — Quick Links */}
      <div>
        <h4 className="font-semibold mb-3 text-gray-800">Quick Links</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="#" className="hover:underline">About AICTE</Link></li>
          <li><Link to="#" className="hover:underline">AICTE Dashboard</Link></li>
          <li><Link to="#" className="hover:underline">AICTE Initiatives</Link></li>
          <li><Link to="#" className="hover:underline">Approval Process</Link></li>
        </ul>
      </div>

      {/* Column 3 — Resources */}
      <div>
        <h4 className="font-semibold mb-3 text-gray-800">Resources</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="#" className="hover:underline">Notifications</Link></li>
          <li><Link to="#" className="hover:underline">Circulars</Link></li>
          <li><Link to="#" className="hover:underline">Event Gallery</Link></li>
          <li><Link to="#" className="hover:underline">Grievance Cell</Link></li>
        </ul>
      </div>

      {/* Column 4 — Contact */}
      <div>
        <h4 className="font-semibold mb-3 text-gray-800">Contact</h4>
        <p className="text-sm text-gray-600">Nelson Mandela Marg, Vasant Kunj</p>
        <p className="text-sm text-gray-600">New Delhi – 110070</p>
        <p className="text-sm mt-3 text-gray-600">Email: support@aicte.gov.in</p>
      </div>

    </div>

    {/* Divider */}
    <div className="my-8 border-t"></div>

    {/* Bottom Row */}
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
      <p className="text-xs text-gray-500">
        © {new Date().getFullYear()} AICTE. All Rights Reserved.
      </p>

      <div className="flex gap-5 text-xs">
        <Link to="#" className="hover:underline">Terms & Conditions</Link>
        <Link to="#" className="hover:underline">Privacy Policy</Link>
        <Link to="#" className="hover:underline">Help Desk</Link>
      </div>
    </div>
  </div>
</footer>

      {/* Login Dialog (unchanged markup) */}
      <Dialog open={showLoginForm} onOpenChange={setShowLoginForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{loginType} Login</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required />
            </div>
            <Button 
              type="submit" 
              className="w-full transition-colors"
              style={{ 
                backgroundColor: config.primaryColor,
                color: '#fff'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = config.hoverColor}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = config.primaryColor}
            >
              Login
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gallery Dialog / Lightbox */}
      <Dialog open={showGallery} onOpenChange={(v) => { if (!v) setActiveImage(null); setShowGallery(v) }}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Event Gallery</DialogTitle>
            <DialogDescription>Click image to open original in a new tab. Use share links to post on social media.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              {activeImage ? (
                <div className="rounded-md overflow-hidden shadow">
                  <img src={activeImage} alt="active" className="w-full h-96 object-contain bg-black" />
                  <div className="p-3 flex items-center gap-2 justify-between">
                    <div className="flex gap-2">
                      <a href={facebookShare} target="_blank" rel="noreferrer" className="text-sm underline">Share on Facebook</a>
                      <a href={youtubeLink} target="_blank" rel="noreferrer" className="text-sm underline">YouTube</a>
                      <a href={activeImage} target="_blank" rel="noreferrer" className="text-sm underline">Open original</a>
                    </div>
                    <div>
                      <Button 
                        onClick={() => { window.open(facebookShare, '_blank') }} 
                        className="px-3 py-1 transition-colors"
                        style={{ 
                          backgroundColor: config.primaryColor,
                          color: '#fff'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = config.hoverColor}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = config.primaryColor}
                      >
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-md overflow-hidden shadow bg-gray-50 h-96 flex items-center justify-center text-gray-500">Select an image from the thumbnails</div>
              )}
            </div>

            <div className="space-y-2">
              <div className="grid gap-2">
                {galleryImages.map((g) => (
                  <button key={g} onClick={() => setActiveImage(g)} className={`rounded-md overflow-hidden ${activeImage === g ? 'ring-2 ring-offset-2 ring-indigo-300' : ''}`}>
                    <img src={g} alt="thumb" className="w-full h-24 object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
