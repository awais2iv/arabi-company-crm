// src/features/auth/authSlice.js - Avaya Auth State Management
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  role: null, // agent or admin
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.data.user || action.payload.data;
      state.role = (action.payload.data.user || action.payload.data).role;
      state.token = action.payload.data.accessToken;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    registerSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.data;
      state.role = action.payload.data.role;
      state.token = action.payload.data.accessToken || action.payload.token;
      state.error = null;
    },
    otpVerificationSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.data.user;
      state.role = action.payload.data.user.role;
      state.token = action.payload.data.accessToken;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.role = null;
    },
    tokenExpired: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = "Session expired. Please login again.";
      state.role = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerSuccess,
  otpVerificationSuccess,
  logout,
  tokenExpired,
  clearError,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;
