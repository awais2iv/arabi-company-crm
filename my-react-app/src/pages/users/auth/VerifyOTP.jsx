// src/pages/auth/VerifyOTP.jsx - Simple OTP Verification Page
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useVerifyOTPMutation, useResendOTPMutation } from '@/features/auth/authApiSlice';
import { clearError } from '@/features/auth/authSlice';
import Modal from '@/components/auth/Modal';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, user, isAuthenticated } = useSelector((state) => state.auth);

  const [verifyOTP] = useVerifyOTPMutation();
  const [resendOTP, { isLoading: resendLoading, isSuccess: resendSuccess }] = useResendOTPMutation();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(283); // 4:43 as requested
  const [canResend, setCanResend] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '' });
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!user) {
      navigate('/register');
      return;
    }

    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const digits = pastedData.split('').filter((char) => /\d/.test(char));

    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit;
      }
    });
    setOtp(newOtp);

    // Focus on the next empty input or last input
    const nextIndex = Math.min(digits.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      return;
    }

    try {
      await verifyOTP({ otp: otpCode }).unwrap();
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Registration Successful!',
        message: 'Your account has been created and verified. Redirecting to login...'
      });
      setTimeout(() => {
        setModal({ isOpen: false, type: 'info', title: '', message: '' });
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('OTP verification failed:', err);

      let errorTitle = 'Verification Failed';
      let errorMessage = 'Something went wrong. Please try again.';

      if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      // Handle specific error cases
      if (errorMessage.includes('expired') || errorMessage.includes('OTP has expired')) {
        errorTitle = 'OTP Expired';
        errorMessage = 'Your verification code has expired. Please request a new one.';
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('incorrect')) {
        errorTitle = 'Invalid Code';
        errorMessage = 'The code you entered is incorrect. Please check and try again.';
      }

      setModal({
        isOpen: true,
        type: 'error',
        title: errorTitle,
        message: errorMessage
      });

      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (!user || !canResend) return;

    try {
      await resendOTP({
        email: user.email,
        role: user.role,
      }).unwrap();

      setTimer(300); // Reset timer
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Code Sent!',
        message: 'A new verification code has been sent to your email.'
      });
    } catch (err) {
      console.error('Resend OTP failed:', err);

      setModal({
        isOpen: true,
        type: 'error',
        title: 'Failed to Resend',
        message: err?.data?.message || 'Could not resend the code. Please try again.'
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />

      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Company Logo */}
          <div className="text-center mb-8">
            <img 
              src="/arabicompanylogo.png" 
              alt="Arabic Company Logo" 
              className="w-32 h-32 object-contain mx-auto"
            />
          </div>

          {/* OTP Verification Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
              <p className="text-gray-600">
                We've sent a 6-digit code to {user?.email || 'mohamadawais942@gmail.com'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-center mb-4">
                  Enter verification code
                </label>
                <div className="flex justify-center gap-3" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  ))}
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendLoading}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {resendLoading ? 'Sending...' : 'Resend code'}
                    </button>
                  ) : (
                    <>
                      Resend code in{' '}
                      <span className="font-semibold text-blue-600">{formatTime(timer)}</span>
                    </>
                  )}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Wrong email? Go back
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-500 text-sm">
            © 2026 Arabic Company. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyOTP;
