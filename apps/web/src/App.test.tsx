import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders hero content', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /post your ad board/i })).toBeInTheDocument();
    expect(screen.getByText(/Launch Canvas/)).toBeInTheDocument();
  });
});
