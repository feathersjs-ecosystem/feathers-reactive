import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import App from './App';

describe('App', () => {
  it('renders headline', () => {
    render(<App />);

    const h1Element = screen.queryAllByText(/todos/i);

    expect(h1Element).toHaveLength(1);
    expect(h1Element[0]).toHaveTextContent('Feathers real-time Todos');
  });
});
