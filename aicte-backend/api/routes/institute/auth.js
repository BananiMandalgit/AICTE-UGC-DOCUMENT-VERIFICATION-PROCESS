const express = require("express");
const jwt = require("jsonwebtoken");
const prisma = require("../../utils/db");

const InstitueAuth = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined.");
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Minimal dummy handler for /register
InstitueAuth.post("/register", (req, res) => {
  res.status(200).json({ success: true, message: "Register endpoint working" });
});

// /login handler: authenticate, issue JWT and return it nested under `data.token`
const buildInstituteWhereClause = (rawKey = "") => {
  const trimmed = rawKey.trim();
  if (!trimmed) {
    return null;
  }

  return {
    OR: [
      { email: trimmed.toLowerCase() },
      { phone: trimmed },
      {
        universityName: {
          equals: trimmed,
          mode: "insensitive",
        },
      },
    ],
  };
};

InstitueAuth.post("/login", async (req, res) => {
  try {
    const { authKey, password, otp } = req.body || {};
    const credential = password || otp;

    // Basic/placeholder authentication logic for now:
    // - In production replace this with real user lookup and password check (e.g., prisma + argon2)
    if (!authKey || !credential) {
      return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    const whereClause = buildInstituteWhereClause(authKey);
    if (!whereClause) {
      return res.status(401).json({ success: false, message: "Institute not found" });
    }

    const university = await prisma.university.findFirst({ where: whereClause });
    if (!university) {
      return res.status(401).json({ success: false, message: "Institute not found" });
    }

    // Generate JWT payload
    const payload = {
      sub: university.id,
      role: "institute",
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Return token nested under `data.token` as frontend expects
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        userId: university.id,
        institute: {
          id: university.id,
          universityName: university.universityName,
          instituteType: university.universityType,
          email: university.email,
          phone: university.phone,
          state: university.state,
          district: university.district,
          pincode: university.pincode,
          status: university.status,
        },
      },
    });
  } catch (err) {
    console.error("/institute/auth/login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Minimal handler for /institute_exists that checks against known institutes
InstitueAuth.post("/institute_exists", async (req, res) => {
  const { authKey, email } = req.body || {};
  const rawKey = authKey || email || "";
  try {
    if (!rawKey || !rawKey.trim()) {
      return res.status(200).json({ exists: false });
    }

    const whereClause = buildInstituteWhereClause(rawKey);
    if (!whereClause) {
      return res.status(200).json({ exists: false });
    }

    const institute = await prisma.university.findFirst({ where: whereClause });
    return res.json({ exists: !!institute });
  } catch (err) {
    console.error("/institute/auth/institute_exists error:", err);
    return res.status(500).json({ exists: false });
  }
});

// Dev handler for /send-otp to keep frontend flow unblocked
InstitueAuth.post("/send-otp", (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    otp: "123456",
  });
});

// Minimal dummy handler for /forgot
InstitueAuth.post("/forgot", (req, res) => {
  res.status(200).json({ success: true, message: "Forgot password endpoint working" });
});

module.exports = { InstitueAuth };
