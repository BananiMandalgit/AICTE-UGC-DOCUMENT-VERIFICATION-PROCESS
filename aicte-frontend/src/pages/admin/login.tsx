"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import AicteLogo from "@/assets/aicte-logo.webp";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email] = useState("admin@example.edu");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check credentials
      if (email !== "admin@example.edu") {
        setError("Invalid email. Please use admin@example.edu");
        setLoading(false);
        return;
      }

      if (password !== "admin123") {
        setError("Invalid password. Please check and try again.");
        setLoading(false);
        return;
      }

      // Simulate login delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Store admin session
      localStorage.setItem("authToken", "admin-token-" + Date.now());
      localStorage.setItem("authMode", "admin");
      localStorage.setItem("adminEmail", email);

      // Redirect to admin dashboard
      navigate("/admin");
    } catch (err) {
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/approval-enginex-logo.png" alt="Approval Enginex Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AICTE Portal</h1>
          <p className="text-gray-600">Admin Login</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-[#0b6e4f] to-[#095a40] text-white rounded-t-lg">
            <CardTitle>Administrator Access</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email
                </Label>
                <div className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-700">
                  {email}
                </div>
                <p className="text-xs text-gray-500">
                  Fixed email for admin access
                </p>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Error Alert */}
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-600 ml-2">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0b6e4f] hover:bg-[#095a40] text-white font-semibold py-2 h-10"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login as Admin"
                )}
              </Button>

              {/* Credentials Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-xs font-semibold text-blue-900 mb-1">
                  Demo Credentials:
                </p>
                <p className="text-xs text-blue-800">
                  <span className="font-medium">Email:</span> admin@example.edu
                </p>
                <p className="text-xs text-blue-800">
                  <span className="font-medium">Password:</span> admin123
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/aicte")}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
