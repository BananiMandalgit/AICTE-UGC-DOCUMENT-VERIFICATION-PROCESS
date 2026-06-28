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
import { ScrollArea } from "@/components/ui/scroll-area"

const galleryImages = [
  'https://tse4.mm.bing.net/th/id/OIP.-zLDekd2XBDwmfd0m_pxywHaE8?pid=Api&P=0&h=180',
  'https://www.thestatesman.com/wp-content/uploads/2023/08/820142160-aicte-margdarshan_850x478.jpg',
  'https://www.aicte.gov.in/sites/default/files/images/slideshow/Banner-4_0.jpg',
  'https://scontent.fccu27-2.fna.fbcdn.net/v/t39.30808-6/588699752_1155963856726383_1334451745312803748_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=127cfc&_nc_ohc=FY-yfi2VIz8Q7kNvwHZsdOC&_nc_oc=AdmK8Flsk1rTdnVZ5s0929Ce73W9g1HU7NFHHWnd9lF9HlouduFBaydM0ZX3P5CRSQLlAVRG-nbqNn5ky-vFiNvG&_nc_zt=23&_nc_ht=scontent.fccu27-2.fna&_nc_gid=1PxO0GjDP5WYYldFhM202A&oh=00_AfgkXuwwzi_pyeMOpVhA_gQPdwvqcIHmFOcOSnWh85AfwQ&oe=69320FB8',
  'https://scontent.fccu27-2.fna.fbcdn.net/v/t39.30808-6/592068881_1155963966726372_263672633861692394_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=127cfc&_nc_ohc=xaj_8kZTrbEQ7kNvwFXWHjb&_nc_oc=AdkFDgcLkosUbwBPrjIQHSS4NOqOZABuHVXzyRjGrgeUHTUEl7k4LsmZMbG5Z7ibOeoPFEnNuttu7XWlKbQO1f5E&_nc_zt=23&_nc_ht=scontent.fccu27-2.fna&_nc_gid=WRas_n09FaExQokz0Eqpmg&oh=00_AfiOV4RUNx76xbrx-YN5uXtMp6IYJhkJhZUBC-LnaTQB7w&oe=69322322',
  'https://scontent.fccu27-2.fna.fbcdn.net/v/t39.30808-6/585587994_1150568593932576_1744386464857986547_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=D6b08V6gnkMQ7kNvwF09Ooq&_nc_oc=AdnsVP65uMt7kOvls4Sgpf6k9adki4coYe93zOT0oNYTJU1OssBm2sUWibPzfw_WO8deN3WS2SF1jDHpuh5bzicl&_nc_zt=23&_nc_ht=scontent.fccu27-2.fna&_nc_gid=40TbXVX13MYCUiNswU4qmA&oh=00_AfitecOgP_EXN4OGD8qClksqr0bB5_0pJ8qozBrj9MDf9w&oe=693212B4',
]

const config = {
  primaryColor: "#1e3a8a",
  hoverColor: "#1e40af",
  secondaryColor: "#0284c7",
  surfaceColor: "#ffffff",
  backgroundColor: "#f0f9ff",
  textColor: "#0f172a",
  portalTitle: "UGC Document Verification Portal",
}

export default function UGCLanding() {
  const [showAboutInfo, setShowAboutInfo] = useState(false)
  const [showInitiatives, setShowInitiatives] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [showAnnouncements, setShowAnnouncements] = useState(true)
  const navigate = useNavigate()

  const announcements = [
    { id: 1, title: 'New UGC Guidelines', body: 'UGC has released updated guidelines for higher education. Check the official notification for details.', date: '2025-11-25' },
    { id: 2, title: 'Research Grant Announcement', body: 'Apply for UGC research grants before Dec 20. Eligible research areas include STEM, Social Sciences, and Humanities.', date: '2025-10-15' },
    { id: 3, title: 'University Accreditation', body: 'Accreditation process for 2025 batch has started. Submit your applications now.', date: '2025-09-20' },
  ]

  const facebookShare = 'https://www.facebook.com/ugc.gov.in/'
  const youtubeLink = 'https://www.youtube.com/@ugcnetwork'

  const handleLogin = (type: string) => {
    if (type === "Institution") {
      localStorage.setItem('loginSource', 'ugc');
      navigate("/institute/login?source=ugc");
    }
    if (type === "Evaluator") navigate("/evaluator")
    if (type === "Admin") navigate("/admin")
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden p-6"
      style={{
        background: `linear-gradient(135deg, ${config.backgroundColor} 0%, #E0F2FE 50%, ${config.backgroundColor} 100%)`,
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
        <Link to="/" className="flex items-center gap-4" aria-label="UGC Home">
          <img
            src="https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/University_Grants_Commission_logo.svg/1200px-University_Grants_Commission_logo.svg.png"
            alt="UGC logo"
            className="h-16 w-16 object-contain"
          />
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base md:text-lg" style={{ color: config.textColor }}>
              University Grants Commission
            </span>
            <span className="text-xs sm:text-sm md:text-base text-gray-600">विश्वविद्यालय अनुदान आयोग</span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <button onClick={() => setShowAboutInfo(true)} className="text-sm px-3 py-2 rounded-lg hover:shadow-sm transition" style={{ color: config.textColor }}>About</button>
          <Dialog open={showAboutInfo} onOpenChange={setShowAboutInfo}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>About UGC</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                The University Grants Commission (UGC) is a statutory body established in 1953 under the Department of Higher Education, Ministry of Education, Government of India. UGC is responsible for coordinating the development of higher education in India and advising the Central and State Governments on measures necessary for the promotion and improvement of higher education.
              </DialogDescription>
            </DialogContent>
          </Dialog>

          <button onClick={() => setShowInitiatives(true)} className="text-sm px-3 py-2 rounded-lg hover:shadow-sm transition" style={{ color: config.textColor }}>Initiatives</button>
          <Dialog open={showInitiatives} onOpenChange={setShowInitiatives}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>UGC Initiatives</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  <h3 className="font-bold">National Research Foundation (NRF)</h3>
                  <p>Established to promote research across all science and engineering disciplines, NRF aims to foster a culture of research excellence.</p>
                  
                  <h3 className="font-bold">Prime Minister Research Fellowship (PMRF)</h3>
                  <p>A prestigious scholarship program for PhD research in science and engineering disciplines at Indian institutions.</p>
                  
                  <h3 className="font-bold">Academic Bank of Credits (ABC)</h3>
                  <p>A digital repository to store and credit academic accomplishments of students for flexible and seamless mobility.</p>
                  
                  <h3 className="font-bold">National Education Policy Implementation</h3>
                  <p>UGC is actively implementing NEP 2020 across higher education institutions to strengthen education quality.</p>
                  
                  <h3 className="font-bold">RUSA - Rashtriya Uchchtar Shiksha Abhiyaan</h3>
                  <p>A centrally sponsored scheme aimed at promoting excellence and equity in higher education institutions.</p>
                  
                  <h3 className="font-bold">University Quality Improvement Programme</h3>
                  <p>A comprehensive program to enhance the quality of teaching, research, and institutional management.</p>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <button onClick={() => setShowContact(true)} className="text-sm px-3 py-2 rounded-lg hover:shadow-sm transition" style={{ color: config.textColor }}>Contact</button>
          <Dialog open={showContact} onOpenChange={setShowContact}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contact UGC</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p><strong>Helpline Numbers:</strong></p>
                <p>011-40101500</p>
                <p>1800-2000-120 (Toll Free)</p>
                <p><strong>Email:</strong> support@ugc.gov.in</p>
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
              <DropdownMenuItem onSelect={() => handleLogin("Institution")}>Institution</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleLogin("Evaluator")}>Evaluator</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleLogin("Admin")}>Admin</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </header>

      {/* announcement strip */}
      <div className="relative z-10 mb-6">
        <div className="rounded-lg p-3 bg-white shadow-sm flex items-center gap-4">
          <Megaphone className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold">Announcements</div>
              <div className="text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
            </div>

            <div className="mt-2 text-sm text-gray-700">
              <div className="whitespace-nowrap overflow-hidden">
                <div>
                  {announcements.map(a => `${a.date} — ${a.title} • `).join(' ')}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowAnnouncements(!showAnnouncements)} 
              className="px-3 py-1 transition-colors"
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

        {showAnnouncements && (
          <div className="mt-3 grid md:grid-cols-3 gap-3">
            {announcements.map(a => (
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
        <div className="max-w-6xl w-full grid md:grid-cols-1 gap-8 items-start">
          <div className="space-y-6 animate-[fadeInLeft_700ms_ease]">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white shadow-sm">
              <span className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />
              Advancing Higher Education in India
            </span>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: config.textColor }}>
              {config.portalTitle}
            </h1>

            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Streamline <span className="font-semibold">UGC document verification</span> with intelligent assessment,
              comprehensive review, and seamless compliance tracking.
            </p>

            {/* THREE LOGIN BUTTONS */}
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <button 
                onClick={() => handleLogin("Institution")} 
                className="btn-same px-4 py-3 rounded-xl shadow-md text-sm font-semibold transform transition hover:-translate-y-0.5" 
                style={{ background: config.primaryColor, color: "#fff" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = config.hoverColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = config.primaryColor}
                aria-label="Institution Login"
              >
                Institution Login
              </button>

              <button 
                onClick={() => handleLogin("Evaluator")} 
                className="btn-same px-4 py-3 rounded-xl text-sm font-semibold shadow-md transform transition hover:-translate-y-0.5" 
                style={{ background: config.primaryColor, color: "#fff" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = config.hoverColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = config.primaryColor}
                aria-label="Evaluator Login"
              >
                Evaluator Login
              </button>

              <button 
                onClick={() => handleLogin("Admin")} 
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
                <CardTitle>Excellence in Higher Ed</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Promoting quality and excellence across Indian universities</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <GraduationCap className="h-6 w-6 mb-2" aria-hidden="true" />
                <CardTitle>Research Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Funding and supporting cutting-edge research initiatives</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Building className="h-6 w-6 mb-2" aria-hidden="true" />
                <CardTitle>Institution Development</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Supporting academic and administrative development of universities</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-6 w-6 mb-2" aria-hidden="true" />
                <CardTitle>National Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Coordinating higher education development across India</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 w-full mt-16 border-t" style={{ background: config.backgroundColor }}>
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src="https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/University_Grants_Commission_logo.svg/1200px-University_Grants_Commission_logo.svg.png"
                  alt="UGC"
                  className="h-12 w-12 object-contain"
                />
                <div>
                  <div className="text-sm font-bold">UGC</div>
                  <div className="text-xs text-gray-600">Document Verification</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Home</a></li>
                <li><a href="#" className="hover:underline">About</a></li>
                <li><a href="#" className="hover:underline">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Help Center</a></li>
                <li><a href="#" className="hover:underline">FAQ</a></li>
                <li><a href="#" className="hover:underline">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Follow Us</h4>
              <ul className="space-y-2 text-sm">
                <li><a href={facebookShare} target="_blank" rel="noreferrer" className="hover:underline">Facebook</a></li>
                <li><a href={youtubeLink} target="_blank" rel="noreferrer" className="hover:underline">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t text-center text-xs text-gray-600">
            <p>&copy; 2025 UGC. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* gallery modal */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Gallery</DialogTitle>
          </DialogHeader>
          {activeImage && (
            <img src={activeImage} alt="gallery" className="w-full h-auto rounded-lg" />
          )}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {galleryImages.map((src, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(src)}
                className="overflow-hidden rounded"
              >
                <img src={src} alt={`gallery-${idx}`} className="w-full h-16 object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
