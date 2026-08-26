import { describe, expect, it, vi } from 'vitest';
import { createOverflowCheckGate } from '../lexical/utils/overflow-check-gate';

describe('overflow check gate', () => {
  it('replays a second overflow check on the next frame after processing finishes', () => {
    let scheduledFrame: FrameRequestCallback | null = null;
    const gate = createOverflowCheckGate<string>({
      request: vi.fn(callback => {
        scheduledFrame = callback;
        return 17;
      }),
      cancel: vi.fn(),
    });
    const replay = vi.fn();

    expect(gate.start()).toBe(true);
    expect(gate.deferIfProcessing({ target: 'latest-page-layout', cause: 'content' })).toBe(true);

    gate.finish(replay);

    expect(replay).not.toHaveBeenCalled();
    expect(scheduledFrame).not.toBeNull();
    scheduledFrame?.(0);
    expect(replay).toHaveBeenCalledOnce();
    expect(replay).toHaveBeenCalledWith({
      target: 'latest-page-layout',
      cause: 'content',
    });
  });

  it('coalesces pending checks while preserving an immediate paste cause', () => {
    let scheduledFrame: FrameRequestCallback | null = null;
    const gate = createOverflowCheckGate<string>({
      request: callback => {
        scheduledFrame = callback;
        return 23;
      },
      cancel: vi.fn(),
    });
    const replay = vi.fn();

    gate.start();
    gate.deferIfProcessing({ target: 'old-layout', cause: 'paste' });
    gate.deferIfProcessing({ target: 'new-layout', cause: 'content' });
    gate.finish(replay);
    scheduledFrame?.(0);

    expect(replay).toHaveBeenCalledWith({
      target: 'new-layout',
      cause: 'paste',
    });
  });
});
