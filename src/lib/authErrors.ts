export const friendlyAuthError = (message: string, googleAvailable: boolean): string => {
  const m = message.toLowerCase();

  if (m.includes('not authorized')) {
    return googleAvailable
      ? 'Email sign-in is not open to everyone yet. Please continue with Google instead.'
      : 'Email sign-in is not open to everyone yet. Please try again later.';
  }
  if (m.includes('rate limit')) {
    return googleAvailable
      ? 'Too many sign-in emails were sent. Try again in a little while, or continue with Google.'
      : 'Too many sign-in emails were sent. Please try again in a little while.';
  }
  if (m.includes('invalid') && m.includes('email')) return 'That email address does not look right. Please check it and try again.';
  return message;
};