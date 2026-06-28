const nodemailer = require('nodemailer');
const { checkEmailForInstitute } = require('../institute/auth');

// Utility to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Email Template
const getOtpEmailTemplate = (otp) => `
 <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
   <h2 style="text-align: center; color: #4CAF50;">Your OTP Code</h2>
   <p>Dear User,</p>
   <p>Use the following OTP to proceed:</p>
   <div style="text-align: center; margin: 20px;">
     <span style="display: inline-block; padding: 10px 20px; 
     font-size: 24px; font-weight: bold; color: #fff; 
     background-color: #4CAF50; border-radius: 5px;">
       ${otp}
     </span>
   </div>
   <p>This OTP is valid for 10 minutes.</p>
 </div>
`;

const sendOtpEmail = async (req, res) => {
  let { email, user_type } = req.body;

  if (user_type) {
    let t = await checkEmailForInstitute(email, user_type);
    if (t) email = t;
    else email = undefined;
  }

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required or No accounts found.' });
  }

  // ---------- PERMANENT OTP (TEST MODE) ----------
  const IS_TESTING = process.env.NODE_ENV !== 'production';
  const FIXED_TEST_OTP = '123456';

  const otp = IS_TESTING ? FIXED_TEST_OTP : generateOTP();

  if (IS_TESTING) console.log(`[TEST MODE] Using Fixed OTP: ${otp}`);
  // -------------------------------------------------

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "sharmavipul01002@gmail.com",
      pass: "bvjr tyll odcg ooqx",
    },
  });

  const mailOptions = {
    from: `"AICTE APPROVAL PORTAL" <${process.env.EMAIL_USER}>`,  // FIXED
    to: email,
    subject: 'Your OTP Code',
    html: getOtpEmailTemplate(otp),
  };

  try {
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp, // 👈 permanent OTP returned to frontend
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
    });
  }
};

module.exports = {
  sendOtpEmail,
};
