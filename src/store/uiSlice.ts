import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Section } from '@/lib/types';

export interface UiState {
  section: Section;
  settingsOpen: boolean;
  sidebarOpen: boolean;
  /** Increments on every navigation click; the search box listens to reset itself. */
  navCount: number;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { section: 'feed', settingsOpen: false, sidebarOpen: false, navCount: 0 } as UiState,
  reducers: {
    setSection(state, action: PayloadAction<Section>) {
      state.section = action.payload;
      state.sidebarOpen = false;
      state.navCount += 1;
    },
    setSettingsOpen(state, action: PayloadAction<boolean>) {
      state.settingsOpen = action.payload;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { setSection, setSettingsOpen, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;
