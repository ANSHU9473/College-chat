let otpStore = {}; // in-memory (temporary, per server run)

function generateOtp(email) {
  // make 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // store with timestamp
  otpStore[email] = { otp, createdAt: Date.now() };

  // For now, just log it instead of sending mail
  console.log(`📩 OTP for ${email}: ${otp}`);

  return otp;
}

function verifyOtp(email, otp) {
  if (!otpStore[email]) return false;

  const { otp: storedOtp, createdAt } = otpStore[email];

  // check if expired (10 min = 600000 ms)
  const isExpired = Date.now() - createdAt > 10 * 60 * 1000;

  return !isExpired && storedOtp === otp;
}

module.exports = { generateOtp, verifyOtp };
