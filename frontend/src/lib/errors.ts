/** Turn any thrown value (Axios, fetch, Error) into a short message we can show a user. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const err = error as any;

  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'We cannot reach the server right now. Check your connection and try again.';
  }

  if (err?.code === 'ECONNABORTED') {
    return 'The request took too long. Please try again.';
  }

  if (err?.response?.status === 413) {
    return 'That file is too large to upload. Choose a smaller file.';
  }

  const data = err?.response?.data;
  const message = data?.message ?? data?.error;

  if (Array.isArray(message) && message.length > 0) {
    return message.join(' ');
  }

  if (typeof message === 'string' && message.trim()) {
    if (message === 'Unauthorized') return 'Your session has expired. Please sign in again.';
    if (message === 'Forbidden') return 'You do not have access to that item.';
    return message;
  }

  if (typeof err?.message === 'string' && err.message.trim() && err.message !== 'Network Error') {
    return err.message;
  }

  return fallback;
}
