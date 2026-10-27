// Tofu: an offline start must leave the form usable instead of throwing to Next's error boundary.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { StartWorkoutButton } from './start-workout-button';

const { push, refresh } = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('starting a workout', () => {
  it('shows the existing error toast on a network failure and permits another attempt', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));
    render(<StartWorkoutButton workoutId="workout-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Start this session' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not start the session.'));
    expect(screen.getByRole('button', { name: 'Start this session' })).toBeEnabled();
    expect(push).not.toHaveBeenCalled();
  });

  it('opens the new workout after a successful request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ id: 'session-1' })));
    render(<StartWorkoutButton workoutId="workout-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Start this session' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/session/session-1'));
    expect(refresh).toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
