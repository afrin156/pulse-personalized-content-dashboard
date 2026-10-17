import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type RootState } from '@/store';
import { initialPreferences } from '@/store/preferencesSlice';

/** Renders with a fresh store whose preferences are already "hydrated". */
export function renderWithStore(ui: ReactElement, preloaded: Partial<RootState> = {}) {
  const store = makeStore({
    preferences: { ...initialPreferences, hydrated: true },
    ...preloaded,
  });
  const result = render(<Provider store={store}>{ui}</Provider>);
  return { store, ...result };
}
