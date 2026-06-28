'use client'

import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function EvaluatorRegulationSelect() {
  const navigate = useNavigate()

  const handleSelectRegulation = (regulation: string) => {
    // Store the selected regulation in localStorage
    localStorage.setItem('selectedEvaluatorRegulation', regulation)
    // Navigate to evaluator login page
    navigate('/evaluator')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="px-4 lg:px-6 py-4 flex items-center justify-between border-b">
        <Link to="/" className="flex items-center" aria-label="AICTE Home">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202024-09-25%20at%207.22.28%E2%80%AFPM-0Ir4wvA8bwC3c08CyM4NVgTIa5Ky8V.png"
            className="mr-4 h-12 w-16"
          />
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base">AICTE</span>
            <span className="text-xs text-gray-500">Document Verification</span>
          </div>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Select Evaluator Type
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Choose your evaluator regulatory body
            </p>
            <p className="text-gray-500">
              Select the regulation under which you evaluate
            </p>
          </div>

          {/* Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* AICTE Evaluator Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg hover:border-[#095a40] transition-all duration-300 border-2"
              onClick={() => handleSelectRegulation('AICTE')}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <Building2 className="w-16 h-16 text-[#0b6e4f]" />
                </div>
                <CardTitle className="text-2xl text-[#0b6e4f]">AICTE Evaluator</CardTitle>
                <CardDescription className="text-base mt-2">
                  All India Council for Technical Education
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  For evaluators working under AICTE regulation. Select this if you evaluate institutions accredited by AICTE.
                </p>
                <Button 
                  className="w-full bg-[#0b6e4f] hover:bg-[#095a40] text-white"
                  onClick={() => handleSelectRegulation('AICTE')}
                >
                  Continue as AICTE Evaluator
                </Button>
              </CardContent>
            </Card>

            {/* UGC Evaluator Card */}
            <Card 
              className="cursor-not-allowed hover:shadow-lg hover:border-purple-400 transition-all duration-300 border-2 opacity-60"
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <BookOpen className="w-16 h-16 text-purple-600" />
                </div>
                <CardTitle className="text-2xl text-purple-600">UGC Evaluator</CardTitle>
                <CardDescription className="text-base mt-2">
                  University Grants Commission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  For evaluators working under UGC regulation. Select this if you evaluate institutions accredited by UGC.
                </p>
                <Button 
                  disabled
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white cursor-not-allowed"
                >
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Back Link */}
          <div className="text-center mt-12">
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="text-gray-600"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
