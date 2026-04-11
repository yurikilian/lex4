/**
 * Lex4 Debug Logger
 *
 * Zero-cost when disabled. Enable in the browser console:
 *
 *   localStorage.setItem('lex4:debug', '*')            // all channels
 *   localStorage.setItem('lex4:debug', 'overflow,reducer')  // specific channels
 *   window.__LEX4_DEBUG__ = true                        // all channels (session only)
 *
 * Disable:
 *   localStorage.removeItem('lex4:debug')
 *   window.__LEX4_DEBUG__ = false
 *
 * Channels:
 *   reducer   — every dispatched action and resulting state
 *   overflow  — overflow detection, measurement, split decisions
 *   registry  — editor registry register/unregister/get
 *   page      — page creation, initial state loading, body changes
 *   toolbar   — formatting command dispatches
 *   header    — header height changes, content changes
 *   footer    — footer height changes, content changes
 *   focus     — editor focus changes, active editor/page tracking
 */

export type DebugChannel =
  | 'reducer'
  | 'overflow'
  | 'registry'
  | 'page'
  | 'toolbar'
  | 'header'
  | 'footer'
  | 'focus';

const CHANNEL_COLORS: Record<DebugChannel, string> = {
  reducer: '#e91e63',
  overflow: '#ff5722',
  registry: '#9c27b0',
  page: '#2196f3',
  toolbar: '#4caf50',
  header: '#ff9800',
  footer: '#795548',
  focus: '#607d8b',
};

declare global {
  interface Window {
    __LEX4_DEBUG__?: boolean | string;
  }
}

function getFlag(): string | boolean | null {
  if (typeof window === 'undefined') return null;

  const win = (window as Window).__LEX4_DEBUG__;
  if (win !== undefined && win !== null) return win;

  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('lex4:debug');
  }

  return null;
}

function isEnabled(channel: DebugChannel): boolean {
  const flag = getFlag();
  if (!flag) return false;
  if (flag === true || flag === '*' || flag === 'true') return true;

  if (typeof flag === 'string') {
    return flag.split(',').some(s => s.trim() === channel);
  }

  return false;
}

/**
 * Log a debug message on the given channel.
 * No-ops instantly when the channel is disabled.
 */
export function debug(channel: DebugChannel, message: string, ...data: unknown[]): void {
  if (!isEnabled(channel)) return;

  const color = CHANNEL_COLORS[channel];
  const prefix = `%c[lex4:${channel}]`;
  const style = `color: ${color}; font-weight: bold;`;

  if (data.length > 0) {
    console.log(prefix, style, message, ...data);
  } else {
    console.log(prefix, style, message);
  }
}

/**
 * Log a warning on the given channel.
 */
export function debugWarn(channel: DebugChannel, message: string, ...data: unknown[]): void {
  if (!isEnabled(channel)) return;

  const color = CHANNEL_COLORS[channel];
  const prefix = `%c[lex4:${channel}]`;
  const style = `color: ${color}; font-weight: bold;`;

  if (data.length > 0) {
    console.warn(prefix, style, message, ...data);
  } else {
    console.warn(prefix, style, message);
  }
}

/** Short-id helper: first 8 chars of a UUID for readable logs */
export function shortId(id: string): string {
  return id.substring(0, 8);
}
