/**
 * Generate a random 6-digit OTP
 * @param {Set} generatedOtps - Set to track already generated OTPs (for uniqueness)
 * @returns {string} - 6-digit OTP string
 */
const generateOTP = (generatedOtps = new Set()) => {
    let otp;
    
    // Keep generating until we get a unique OTP
    do {
        otp = Math.floor(100000 + Math.random() * 900000).toString();
    } while (generatedOtps.has(otp));
    
    generatedOtps.add(otp);
    
    // Auto-cleanup after 10 minutes to prevent memory leak
    setTimeout(() => {
        generatedOtps.delete(otp);
    }, 10 * 60 * 1000);
    
    return otp;
}

export default generateOTP;
