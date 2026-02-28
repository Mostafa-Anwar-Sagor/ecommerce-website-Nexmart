import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark';
  searchQuery: string;
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  isAIChatOpen: boolean;
  compareProducts: string[];
}

const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';

const initialState: UIState = {
  theme: savedTheme,
  searchQuery: '',
  isSearchOpen: false,
  isMobileMenuOpen: false,
  isAIChatOpen: false,
  compareProducts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      document.documentElement.classList.toggle('dark', action.payload === 'dark');
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    toggleSearch(state) {
      state.isSearchOpen = !state.isSearchOpen;
    },
    toggleMobileMenu(state) {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    closeMobileMenu(state) {
      state.isMobileMenuOpen = false;
    },
    toggleAIChat(state) {
      state.isAIChatOpen = !state.isAIChatOpen;
    },
    addToCompare(state, action: PayloadAction<string>) {
      if (state.compareProducts.length < 4 && !state.compareProducts.includes(action.payload)) {
        state.compareProducts.push(action.payload);
      }
    },
    removeFromCompare(state, action: PayloadAction<string>) {
      state.compareProducts = state.compareProducts.filter((id) => id !== action.payload);
    },
    clearCompare(state) {
      state.compareProducts = [];
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  setSearchQuery,
  toggleSearch,
  toggleMobileMenu,
  closeMobileMenu,
  toggleAIChat,
  addToCompare,
  removeFromCompare,
  clearCompare,
} = uiSlice.actions;
export default uiSlice.reducer;
