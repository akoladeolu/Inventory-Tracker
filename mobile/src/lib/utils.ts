/**
 * Formats low-level errors (network failures, socket resets, RPC errors)
 * into clean, user-friendly strings for mobile UI alerts.
 */
export const formatAppError = (err: any): string => {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const message = typeof err === 'string' ? err : err.message || String(err);

  if (
    message.includes('SocketException') ||
    message.includes('Connection reset') ||
    message.includes('Network request failed') ||
    message.includes('fetch failed') ||
    message.includes('NetworkError')
  ) {
    return 'Network Connection Error: Unable to reach the server. Please check your internet connection and try again.';
  }

  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }

  if (message.includes('Email not confirmed')) {
    return 'Email address has not been confirmed yet. Please check your inbox.';
  }

  // Remove raw Java exception prefix if present
  const cleanMsg = message.replace(/^java\.[a-zA-Z0-9_.]+:?\s*/i, '').trim();
  return cleanMsg || 'Operation failed. Please try again.';
};
