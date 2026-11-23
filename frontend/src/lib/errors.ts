/** Turn any thrown value (Axios, fetch, Error) into a short message we can show a user. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const err = error as any;

  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'We cannot reach the server right now. Check your connection and try again.';
  }

  if (err?.code === 'ECONNABORTED') {
    return 'The request took too long. Please try again.';
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

const SSO_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: 'Authentication failed. Please try again.',
  missing_code: 'Authorization code missing. Please try again.',
  invalid_state: 'Invalid security state. Please try again.',
  access_denied: 'You do not have permission to access this application.',
  missing_token: 'Authentication token missing. Please try again.',
  invalid_token: 'Invalid authentication token. Please try again.',
  session_expired: 'Your session has expired. Please sign in again.',
  server_error: 'We could not complete sign-in right now. Please try again.',
  not_configured: 'Shared sign-in is not configured for this application.',
  WHITELABEL_BUSINESS_ONLY: 'White-label access is available to Business accounts only.',
  WHITELABEL_ACCESS_DENIED: 'Your account does not have white-label access to this application.',
  SUBSCRIPTION_REQUIRED: 'An active subscription is required to access this application.',
  NO_ACTIVE_PLAN: 'An active plan is required to access this application.',
  PLAN_REQUIRED: 'An active plan is required to access this application.',
  TRIAL_EXPIRED: 'Your trial has ended. Upgrade your plan to continue.',
  PAYMENT_FAILED: 'Your last payment failed. Update your payment method to continue.',
  ACCOUNT_SUSPENDED: 'Your account has been suspended. Contact support for help.',
  MEMBERSHIP_INACTIVE: 'Your membership is inactive. Contact support for help.',
};

export function getSsoErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return SSO_ERROR_MESSAGES[code] || 'We could not sign you in right now. Please try again.';
}
