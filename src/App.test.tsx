import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import Station from './pages/Station'

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText("WMATA Information Hub");
  expect(linkElement).toBeInTheDocument();
});

test('renders learn react link', () => {
  render(<Station  station="Tysons"/>);
  const linkElement = screen.getByText("Tysons");
  expect(linkElement).toBeInTheDocument();
});