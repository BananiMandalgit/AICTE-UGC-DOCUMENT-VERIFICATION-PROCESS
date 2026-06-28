'use client'

import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function RegulationSelect() {
  const navigate = useNavigate()

  const handleSelectRegulation = (regulation: string) => {
    // Store the selected regulation in localStorage
    localStorage.setItem('selectedRegulation', regulation)
    // Navigate to login page
    navigate('/institute/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="px-4 lg:px-6 py-4 flex items-center justify-between border-b">
        <Link to="/" className="flex items-center" aria-label="AICTE Home">
          <img
            src="https://scontent.fccu20-1.fna.fbcdn.net/v/t39.30808-6/596620374_832688063078973_147994407975857527_n.jpg?stp=dst-jpg_p526x296_tt6&_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_ohc=gcCW1s7VxIgQ7kNvwFydmmk&_nc_oc=AdmQK4aTipAEX6pAKMWMXs4FljPGlduQbcPMvJv_gDGFfLxZW_Tav8moD-K6qAB9iYtG5so-WWyUQiwf1eYLotfc&_nc_zt=23&_nc_ht=scontent.fccu20-1.fna&_nc_gid=uJvJFqXRcMBjSRpcyEVnoA&oh=00_AfkmlvtSkpRTV8TIVF2uqd5TPMhDElrbvQSNrfxc1hw0SQ&oe=69397C0A"
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
              Select Regulation Type
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Choose your institution's regulatory body
            </p>
            <p className="text-gray-500">
              Select the regulation under which your institution operates
            </p>
          </div>

          {/* Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* AICTE Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-300 border-2"
              onClick={() => handleSelectRegulation('AICTE')}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <Building2 className="w-16 h-16 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-600">AICTE</CardTitle>
                <CardDescription className="text-base mt-2">
                  All India Council for Technical Education
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  For institutions regulated by AICTE. Select this if your institution is accredited or approved by AICTE.
                </p>
                <Button 
                  className="w-full bg-[#0b6e4f] hover:bg-[#095a40] text-white"
                  onClick={() => handleSelectRegulation('AICTE')}
                >
                  Continue with AICTE
                </Button>
              </CardContent>
            </Card>

            {/* UGC Card */}
            <Card 
              className="cursor-not-allowed hover:shadow-lg hover:border-purple-400 transition-all duration-300 border-2 opacity-60"
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <BookOpen className="w-16 h-16 text-purple-600" />
                </div>
                <CardTitle className="text-2xl text-purple-600">UGC</CardTitle>
                <CardDescription className="text-base mt-2">
                  University Grants Commission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  For institutions regulated by UGC. Select this if your institution is accredited or approved by UGC.
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
              onClick={() => navigate('/aicte')}
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
