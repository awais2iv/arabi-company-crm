import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isImporting: false,
  progress: null, // { total, processed, errors, warnings }
  cancelled: false,
  showDetails: false
};

const importProgressSlice = createSlice({
  name: 'importProgress',
  initialState,
  reducers: {
    startImport: (state, action) => {
      state.isImporting = true;
      state.progress = action.payload || { total: 0, processed: 0, errors: [], warnings: [] };
      state.cancelled = false;
      state.showDetails = false;
    },
    updateProgress: (state, action) => {
      state.progress = action.payload;
    },
    cancelImport: (state) => {
      state.cancelled = true;
    },
    completeImport: (state) => {
      state.isImporting = false;
    },
    clearImport: (state) => {
      state.isImporting = false;
      state.progress = null;
      state.cancelled = false;
      state.showDetails = false;
    },
    toggleDetails: (state) => {
      state.showDetails = !state.showDetails;
    },
    setShowDetails: (state, action) => {
      state.showDetails = action.payload;
    }
  }
});

export const { 
  startImport, 
  updateProgress, 
  cancelImport, 
  completeImport, 
  clearImport,
  toggleDetails,
  setShowDetails
} = importProgressSlice.actions;

export default importProgressSlice.reducer;
