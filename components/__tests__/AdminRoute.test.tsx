import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../../App';

vi.mock('../../config', () => ({
  config: {
    useSupabase: true,
  },
}));

describe('admin route', () => {
  it('shows disabled message when Supabase is enabled', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/Espace admin indisponible/i)).toBeInTheDocument();
  });
});
