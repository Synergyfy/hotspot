const DISMISSED_KEY = 'clicksip_onboarding_dismissed';
const PREVIEWED_KEY = 'clicksip_previewed';
const SHARED_KEY = 'clicksip_shared';

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable (private mode); onboarding still works for the session.
  }
}

export const onboarding = {
  isDismissed: () => safeGet(DISMISSED_KEY) === '1',
  dismiss: () => safeSet(DISMISSED_KEY, '1'),

  hasPreviewed: () => safeGet(PREVIEWED_KEY) === '1',
  markPreviewed: () => safeSet(PREVIEWED_KEY, '1'),

  hasShared: () => safeGet(SHARED_KEY) === '1',
  markShared: () => safeSet(SHARED_KEY, '1'),
};

/** Key used to remember that a visitor has seen the "tap the dots" hint for a campaign. */
export const viewerHintKey = (campaignId: string | number) => `clicksip_viewer_hint_${campaignId}`;

export const viewerHint = {
  isDismissed: (campaignId: string | number) => safeGet(viewerHintKey(campaignId)) === '1',
  dismiss: (campaignId: string | number) => safeSet(viewerHintKey(campaignId), '1'),
};
