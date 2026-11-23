const MCOM_URL = process.env.MCOM_SOLUTIONS_URL;
const CLIENT_ID = process.env.MCOM_CLIENT_ID;
const CLIENT_SECRET = process.env.MCOM_CLIENT_SECRET;
const TARGET_PEER = process.env.MCOM_TARGET_PEER || 'mcom-rewards';

if (!MCOM_URL || !CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing MCOM_SOLUTIONS_URL, MCOM_CLIENT_ID or MCOM_CLIENT_SECRET');
  process.exit(1);
}

console.log('\n[1/3] Testing ecosystem discovery at ' + MCOM_URL + '...');
try {
  const discRes = await fetch(MCOM_URL + '/api/v1/ecosystem/discovery');
  const discovery = await discRes.json();
  console.log('Discovery OK! Issuer:', discovery.issuer, '| Signing Alg:', discovery.signing_alg);

  console.log('\n[2/3] Requesting service token for audience "' + TARGET_PEER + '"...');
  const basicAuth = Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');
  const tokenRes = await fetch(MCOM_URL + '/api/v1/auth/service-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + basicAuth,
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      audience: TARGET_PEER,
      scope: 'profile',
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error('Service token failed (' + tokenRes.status + '):', tokenData);
    console.error('Hint: check Allowed Audiences in MCOM Console for "' + TARGET_PEER + '".');
  } else {
    console.log('Service token minted successfully.');
    console.log('Type:', tokenData.token_type, '| Expires in:', tokenData.expires_in + 's');

    console.log('\n[3/3] Fetching ecosystem peer directory...');
    const peerRes = await fetch(MCOM_URL + '/api/v1/ecosystem/services');
    const peers = await peerRes.json();
    console.log('Connected to ecosystem mesh. Active peers:', peers.length);
    console.log('Peers found:', peers.map((p) => p.clientId).join(', '));
  }
} catch (err) {
  console.error('Connectivity test failed:', err.message, err.cause?.code || '');
  console.error('MCOM Central is unreachable from this network; SSO and mesh calls will fail until it is available.');
  process.exitCode = 1;
}
