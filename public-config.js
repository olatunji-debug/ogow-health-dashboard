function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(payload)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod && !['GET', 'HEAD'].includes(event.httpMethod)) {
    return json(405, { ok: false, message: 'Method not allowed.' });
  }

  return json(200, {
    ok: true,
    googleClientId: process.env.GOOGLE_CLIENT_ID || '433735217842-72ao49diubclpcf4gpdjmh5ecumq17fr.apps.googleusercontent.com',
    allowedDomain: '@ogowhealth.com'
  });
};
