// src/features/auth/authApiSlice.js - Avaya Auth API Calls
import { apiSlice } from "@/app/api/apiSlice";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  registerSuccess,
  otpVerificationSuccess,
  logout,
} from "./authSlice";
import Cookies from "js-cookie";

// Function to clear all persistent storage
const clearAllPersistentStorage = () => {
  try {
    // Clear redux-persist storage
    localStorage.removeItem("persist:auth");
    
    // Clear cookies
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    Cookies.remove("otpToken");
    Cookies.remove("token");
    
    // Clear any other auth-related items from localStorage
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('auth') || key.includes('token') || key.includes('user')
    );
    authKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage as well
    const sessionAuthKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('auth') || key.includes('token') || key.includes('user')
    );
    sessionAuthKeys.forEach(key => sessionStorage.removeItem(key));
    
    console.log('All persistent storage cleared successfully');
  } catch (error) {
    console.error('Error clearing persistent storage:', error);
  }
};

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Check email availability for specific role
    checkEmailAvailability: builder.query({
      query: ({ email, role }) => ({
        url: `/auth/check-email?email=${encodeURIComponent(email)}&role=${role}`,
        method: "GET",
      }),
    }),

    // User login
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        dispatch(loginStart());
        try {
          const { data } = await queryFulfilled;
          dispatch(loginSuccess(data));
        } catch (error) {
          console.log('🔍 Login Error Debug:', {
            error,
            status: error?.status,
            originalStatus: error?.originalStatus,
            errorData: error?.error?.data,
            data: error?.data,
            message: error?.message
          });

          let errorMessage = "Unable to login. Please try again.";
          
          // Extract error from RTK Query error structure
          // RTK Query wraps errors in an 'error' property
          if (error?.error?.data?.message) {
            errorMessage = error.error.data.message;
          } else if (error?.data?.message) {
            errorMessage = error.data.message;
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          } else if (typeof error?.error === 'string') {
            errorMessage = error.error;
          } else if (error?.error?.data?.errors?.[0]?.message) {
            errorMessage = error.error.data.errors[0].message;
          }
          
          // Handle HTTP status codes
          const status = error?.status || error?.originalStatus || error?.error?.status;
          
          if (status === 404) {
            errorMessage = "No account found with this email. Please check your email or create a new account.";
          } else if (status === 401) {
            if (errorMessage.toLowerCase().includes('verify')) {
              errorMessage = "Your account is not verified. Please check your email for verification link.";
            } else {
              errorMessage = "Incorrect password. Please try again or reset your password.";
            }
          } else if (status === 403) {
            errorMessage = "Your account is not verified. Please check your email for verification link.";
          } else if (status === 429) {
            errorMessage = "Too many login attempts. Please try again in a few minutes.";
          } else if (status === 500 || status === 503) {
            errorMessage = "Server error. Please try again later or contact support.";
          } else if (status === 0 || error?.name === 'NetworkError') {
            errorMessage = "Network error. Please check your internet connection.";
          }
          
          // Make specific error messages more user-friendly
          if (errorMessage.toLowerCase().includes("no agent account found") || 
              errorMessage.toLowerCase().includes("agent not found")) {
            errorMessage = "No account found with this email. Please check your email or register as a new user.";
          } else if (errorMessage.toLowerCase().includes("no admin account found") || 
                     errorMessage.toLowerCase().includes("admin not found")) {
            errorMessage = "No admin account found. Please check your credentials or contact support.";
          } else if (errorMessage.toLowerCase().includes("invalid credential") || 
                     errorMessage.toLowerCase().includes("invalid password") ||
                     errorMessage.toLowerCase().includes("password incorrect")) {
            errorMessage = "Incorrect email or password. Please try again.";
          } else if (errorMessage.toLowerCase().includes("not verified") || 
                     errorMessage.toLowerCase().includes("email not verified") ||
                     errorMessage.toLowerCase().includes("verify your email")) {
            errorMessage = "Your account is not verified. Please check your email for verification instructions.";
          } else if (errorMessage.toLowerCase().includes("account disabled") || 
                     errorMessage.toLowerCase().includes("account suspended")) {
            errorMessage = "Your account has been disabled. Please contact support for assistance.";
          } else if (errorMessage.toLowerCase().includes("invalid email")) {
            errorMessage = "Please enter a valid email address.";
          }

          console.log('✅ Final error message to display:', errorMessage);
          dispatch(loginFailure(errorMessage));
        }
      },
    }),

    // User registration
    register: builder.mutation({
      query: (newUser) => ({
        url: "/auth/register",
        method: "POST",
        body: newUser,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        dispatch(loginStart());
        try {
          const { data } = await queryFulfilled;
          dispatch(registerSuccess(data));
        } catch (error) {
          console.log('🔍 Registration Error Debug:', {
            error,
            status: error?.status,
            originalStatus: error?.originalStatus,
            errorData: error?.error?.data,
            data: error?.data,
            message: error?.message
          });

          let errorMessage = "Unable to register. Please try again.";
          
          // Extract error from RTK Query error structure
          if (error?.error?.data?.message) {
            errorMessage = error.error.data.message;
          } else if (error?.data?.message) {
            errorMessage = error.data.message;
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          } else if (typeof error?.error === 'string') {
            errorMessage = error.error;
          } else if (error?.error?.data?.errors?.[0]?.message) {
            errorMessage = error.error.data.errors[0].message;
          }
          
          // Handle HTTP status codes
          const status = error?.status || error?.originalStatus || error?.error?.status;
          
          if (status === 409 || status === 400) {
            if (errorMessage.toLowerCase().includes("email")) {
              errorMessage = "An account with this email already exists. Please try logging in.";
            }
          } else if (status === 422) {
            errorMessage = "Invalid input. Please check your information and try again.";
          } else if (status === 500 || status === 503) {
            errorMessage = "Server error. Please try again later.";
          } else if (status === 0 || error?.name === 'NetworkError') {
            errorMessage = "Network error. Please check your internet connection.";
          }
          
          // Make specific error messages more user-friendly
          if (errorMessage.toLowerCase().includes("email already exists") || 
              errorMessage.toLowerCase().includes("email already in use") ||
              errorMessage.toLowerCase().includes("already exists") ||
              errorMessage.toLowerCase().includes("duplicate email")) {
            errorMessage = "An account with this email already exists. Please try logging in instead.";
          } else if (errorMessage.toLowerCase().includes("invalid email") || 
                     errorMessage.toLowerCase().includes("email format")) {
            errorMessage = "Please enter a valid email address.";
          } else if (errorMessage.toLowerCase().includes("password") && 
                     (errorMessage.toLowerCase().includes("weak") || 
                      errorMessage.toLowerCase().includes("too short") ||
                      errorMessage.toLowerCase().includes("requirements"))) {
            errorMessage = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
          } else if (errorMessage.toLowerCase().includes("phone") || 
                     errorMessage.toLowerCase().includes("invalid number")) {
            errorMessage = "Please enter a valid phone number.";
          } else if (errorMessage.toLowerCase().includes("firstname") || 
                     errorMessage.toLowerCase().includes("first name")) {
            errorMessage = "Please enter a valid first name.";
          } else if (errorMessage.toLowerCase().includes("lastname") || 
                     errorMessage.toLowerCase().includes("last name")) {
            errorMessage = "Please enter a valid last name.";
          }

          console.log('✅ Final error message to display:', errorMessage);
          dispatch(loginFailure(errorMessage));
        }
      },
    }),

    // Verify OTP
    verifyOTP: builder.mutation({
      query: ({ otp }) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: { otp },
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        dispatch(loginStart());
        try {
          const { data } = await queryFulfilled;
          dispatch(otpVerificationSuccess(data));
        } catch (error) {
          dispatch(
            loginFailure(
              error?.error?.data?.message ||
              error?.data?.message ||
              "OTP Verification failed"
            )
          );
        }
      },
    }),

    // Resend OTP
    resendOTP: builder.mutation({
      query: ({ email, role }) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body: { email, role },
      }),
    }),

    // Logout
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch }) {
        // Clear all persistent storage and cookies FIRST (like FlexiPay)
        clearAllPersistentStorage();
        // Then dispatch logout action
        dispatch(logout());
        // Note: We don't wait for the API response
        // This ensures user is logged out locally even if API fails
      },
    }),

    // Get current user
    getCurrentUser: builder.query({
      query: () => "/auth/me",
      providesTags: ['User'],
    }),

    // Refresh token
    refreshToken: builder.mutation({
      query: () => ({
        url: "/auth/refresh-token",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useCheckEmailAvailabilityQuery,
  useLoginMutation,
  useRegisterMutation,
  useVerifyOTPMutation,
  useResendOTPMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
} = authApiSlice;
