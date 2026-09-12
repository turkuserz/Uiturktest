const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=UTF-8'
};

let sessionId = '';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '*';
    const headers = { ...CORS_HEADERS, 'Access-Control-Allow-Origin': allowed };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/verify' || request.method !== 'POST') {
      return reply({ success: false, message: 'Not found' }, 404, headers);
    }

    if (allowed !== '*' && origin && origin !== allowed) {
      return reply({ success: false, message: 'Origin not allowed' }, 403, headers);
    }

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return reply({ success: false, message: 'ข้อมูลไม่ถูกต้อง' }, 400, headers);
    }

    const key = String(body?.key || '').trim();
    const clientId = String(body?.clientId || '').trim();

    if (!key) return reply({ success: false, message: 'กรุณาใส่ Key' }, 400, headers);
    if (key.length > 128) return reply({ success: false, message: 'Key ไม่ถูกต้อง' }, 400, headers);

    try {
      let result = await checkLicense(env, key, clientId);

      // A KeyAuth session can expire. Start a fresh session once and retry.
      if (!result.success && /session/i.test(result.message || '')) {
        sessionId = '';
        result = await checkLicense(env, key, clientId);
      }

      if (!result.success) {
        return reply({ success: false, message: cleanMessage(result.message) }, 401, headers);
      }

      return reply({ success: true, message: 'เข้าสู่ระบบสำเร็จ' }, 200, headers);
    } catch (error) {
      return reply({ success: false, message: 'เซิร์ฟเวอร์ตรวจสอบ Key ไม่พร้อมใช้งาน' }, 502, headers);
    }
  }
};

async function checkLicense(env, key, clientId) {
  const session = await getSession(env);
  if (!session.success) return session;

  const params = new URLSearchParams({
    type: 'license',
    key,
    sessionid: session.sessionid,
    name: env.KEYAUTH_APP_NAME,
    ownerid: env.KEYAUTH_OWNER_ID
  });

  if (clientId) params.set('hwid', clientId.slice(0, 64));

  const response = await fetch('https://keyauth.win/api/1.3/?' + params.toString(), {
    method: 'GET',
    signal: AbortSignal.timeout(4000)
  });

  const data = await response.json();
  return {
    success: data?.success === true,
    message: data?.message || 'Key ไม่ถูกต้อง'
  };
}

async function getSession(env) {
  if (sessionId) return { success: true, sessionid: sessionId };

  const params = new URLSearchParams({
    type: 'init',
    ver: '1.0',
    name: env.KEYAUTH_APP_NAME,
    ownerid: env.KEYAUTH_OWNER_ID
  });

  const response = await fetch('https://keyauth.win/api/1.3/?' + params.toString(), {
    method: 'GET',
    signal: AbortSignal.timeout(4000)
  });

  const data = await response.json();
  if (!data?.success || !data?.sessionid) {
    return { success: false, message: data?.message || 'KeyAuth เริ่มระบบไม่สำเร็จ' };
  }

  sessionId = data.sessionid;
  return { success: true, sessionid: sessionId };
}

function cleanMessage(message) {
  const text = String(message || 'Key ไม่ถูกต้อง');
  if (/invalid|not found|key/i.test(text)) return 'Key ไม่ถูกต้อง หรือไม่มีอยู่ในระบบ';
  if (/expired/i.test(text)) return 'Key หมดอายุแล้ว';
  if (/banned/i.test(text)) return 'Key ถูกระงับ';
  return text.slice(0, 120);
}

function reply(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}
