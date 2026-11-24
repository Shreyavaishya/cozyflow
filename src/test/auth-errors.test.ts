import { describe, expect, it } from 'vitest';
import { friendlyAuthError } from '@/lib/authErrors';

describe('friendlyAuthError', () => {
  it('explains "not authorized" and points to Google only when Google is available', () => {
    const raw = 'Email address "a@b.com" cannot be used as it is not authorized';
    expect(friendlyAuthError(raw, true)).toContain('Google');
    expect(friendlyAuthError(raw, false)).not.toContain('Google');
    expect(friendlyAuthError(raw, false)).toContain('try again later');
  });

  it('explains the hourly email limit', () => {
    expect(friendlyAuthError('email rate limit exceeded', true)).toContain('Google');
    expect(friendlyAuthError('email rate limit exceeded', false)).toContain('try again in a little while');
  });

  it('handles invalid email addresses', () => {
    expect(friendlyAuthError('Email address "x" is invalid', false)).toContain('does not look right');
  });

  it('passes unknown errors through unchanged', () => {
    expect(friendlyAuthError('Something else broke', true)).toBe('Something else broke');
  });
});