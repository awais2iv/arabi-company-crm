// src/store/store.js - Avaya Redux Store Configuration
import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "@/app/api/apiSlice";
import authReducer from "../features/auth/authSlice";
import importProgressReducer from "../features/importProgress/importProgressSlice";
import { setupListeners } from "@reduxjs/toolkit/query";
import storage from "redux-persist/lib/storage";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

// Persist configuration for auth
const persistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "token", "isAuthenticated", "role"],
  migrate: (state) => {
    return new Promise((resolve) => {
      if (state && state.token) {
        import("../utils/tokenUtils").then(({ isTokenExpired }) => {
          if (isTokenExpired(state.token)) {
            // Token expired, reset auth state
            resolve({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
              error: "Session expired. Please login again.",
              role: null,
            });
          } else {
            resolve(state);
          }
        });
      } else {
        resolve(state);
      }
    });
  },
};

// Persist configuration for import progress
const importProgressPersistConfig = {
  key: "importProgress",
  storage,
  whitelist: ["isImporting", "progress", "cancelled", "showDetails"],
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);
const persistedImportProgressReducer = persistReducer(importProgressPersistConfig, importProgressReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    importProgress: persistedImportProgressReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(apiSlice.middleware),
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);
