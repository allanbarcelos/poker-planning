import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './Home';
import { renderWithI18n } from '../test/test-utils';

describe('Home', () => {
  it('creates room as PM with name', async () => {
    const user = userEvent.setup();
    const startAsPm = vi.fn().mockResolvedValue(undefined);
    const startAsDev = vi.fn();

    renderWithI18n(
      <Home startAsPm={startAsPm} startAsDev={startAsDev} error="" />
    );

    await user.type(screen.getByLabelText(/your name/i), 'Ana');
    await user.click(
      screen.getByRole('button', { name: /create room as project manager/i })
    );

    expect(startAsPm).toHaveBeenCalledWith('Ana');
    expect(startAsDev).not.toHaveBeenCalled();
  });

  it('joins room as dev with code', async () => {
    const user = userEvent.setup();
    const startAsPm = vi.fn();
    const startAsDev = vi.fn().mockResolvedValue(undefined);

    renderWithI18n(
      <Home startAsPm={startAsPm} startAsDev={startAsDev} error="" />
    );

    await user.click(screen.getByRole('tab', { name: /join/i }));
    await user.type(screen.getByLabelText(/your name/i), 'Bruno');
    await user.type(screen.getByLabelText(/room code/i), 'abcd1234');
    await user.click(screen.getByRole('button', { name: /join room/i }));

    expect(startAsDev).toHaveBeenCalledWith('Bruno', 'ABCD1234');
  });

  it('shows error banner', () => {
    renderWithI18n(
      <Home
        startAsPm={vi.fn()}
        startAsDev={vi.fn()}
        error="error.invalidCode"
      />
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not submit empty name', async () => {
    const user = userEvent.setup();
    const startAsPm = vi.fn();
    renderWithI18n(
      <Home startAsPm={startAsPm} startAsDev={vi.fn()} error="" />
    );

    await user.click(
      screen.getByRole('button', { name: /create room as project manager/i })
    );
    expect(startAsPm).not.toHaveBeenCalled();
  });

  it('shows how-it-works steps', () => {
    renderWithI18n(
      <Home startAsPm={vi.fn()} startAsDev={vi.fn()} error="" />
    );
    expect(screen.getByText(/how it works/i)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(5);
  });
});
