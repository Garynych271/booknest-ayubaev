// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RequireAuth } from '../src/app/RequireAuth';
import { AuthContext, localUser } from '../src/shared/contexts/auth';
import { readCatalogParams, writeCatalogParams } from '../src/features/catalog/searchParams';
import type { AuthContextValue } from '../src/shared/contexts/auth';

function LocationView() {
  const location = useLocation();
  return <p>{`${location.pathname}|${location.search}`}</p>;
}

function renderProtected(user: AuthContextValue['user']) {
  const auth: AuthContextValue = { user, signIn: vi.fn(), signOut: vi.fn() };
  return render(
    <MemoryRouter initialEntries={['/wishlist']}>
      <AuthContext.Provider value={auth}>
        <Routes>
          <Route path="/wishlist" element={<RequireAuth><h1>Wishlist</h1></RequireAuth>} />
          <Route path="/login" element={<LocationView />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('routing contracts', () => {
  it('redirects a guest from a protected route', async () => {
    renderProtected(null);
    await waitFor(() => expect(screen.getByText('/login|')).toBeTruthy());
  });

  it('renders a protected route for the local user', () => {
    renderProtected(localUser);
    expect(screen.getByRole('heading', { name: 'Wishlist' })).toBeTruthy();
  });

  it('round-trips filters and page through URLSearchParams', () => {
    const parsed = readCatalogParams(new URLSearchParams('q=Solaris&genre=science-fiction&available=1&sort=rating-desc&page=3'));
    expect(parsed).toEqual({
      filters: { query: 'Solaris', genre: 'science-fiction', available: true, sort: 'rating-desc' },
      page: 3,
    });
    expect(writeCatalogParams(parsed.filters, parsed.page).toString()).toBe('q=Solaris&genre=science-fiction&available=1&sort=rating-desc&page=3');
  });
});
