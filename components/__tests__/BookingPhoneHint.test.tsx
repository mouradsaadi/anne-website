import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import BookingCalendar from '../BookingCalendar';

describe('booking phone hint', () => {
  it('shows a hint when phone number looks invalid', () => {
    render(
      <MemoryRouter>
        <BookingCalendar />
      </MemoryRouter>
    );

    const phoneInput = screen.getByPlaceholderText('06 12 34 56 78');
    fireEvent.change(phoneInput, { target: { value: '123' } });

    expect(screen.getByText(/Numéro incomplet/i)).toBeInTheDocument();
  });
});
