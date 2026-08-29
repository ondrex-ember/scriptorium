// ============================================================================
// api/library-fond-report.js — Vercel serverless function
// Přijímá {count, day} jednou/den od klienta (počet odemčených knih,
// GameState.library.unlockedBooks.length) a zapisuje MAX za daný den do
// chronicon repa (mirror api/actor-favor-report.js, ale ukládá číslo, ne
// boolean flag — víc hráčů reportuje stejný den, bereme nejvyšší hlášenou
// hodnotu jako "nejproslulejší knihovna regionu", viz vypujcky-gradient-mrd
// §C, 29.8.2026).
// Vyžaduje env proměnnou CHRONICON_GITHUB_TOKEN — stejný token jako
// registrum-report.js / rescue-report.js / vrchnost-report.js / actor-favor-report.js.
//
// Tiché selhání směrem k hráči vždy (200 { ok:false }).
// ============================================================================

const REPO = 'ondrex-ember/chronicon';
const FILE_PATH = 'data/library_fond_register.json';
const BRANCH = 'main';
const MAX_RETRIES = 3;
const PRUNE_AFTER_DAYS = 21; // fond bonus čte klidně 14 dní zpět, ať má rezervu
const MAX_COUNT = 500; // bezpečnostní strop proti nesmyslné/podvržené hodnotě

function isValidPayload(body) {
  return !!body
    && typeof body.count === 'number' && Number.isFinite(body.count) && body.count >= 0 && body.count <= MAX_COUNT
    && typeof body.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.day);
}

function pruneOldBuckets(data) {
  const cutoff = Date.now() - PRUNE_AFTER_DAYS * 86400000;
  for (const key of Object.keys(data)) {
    if (Date.parse(key + 'T00:00:00Z') < cutoff) delete data[key];
  }
}

async function githubGet(token) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'scriptorium-library-fond-report',
      Accept: 'application/vnd.github+json',
    },
  });
  if (res.status === 404) return { sha: null, data: {} };
  if (!res.ok) throw new Error(`GitHub GET selhal: ${res.status}`);
  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf8');
  let data;
  try { data = JSON.parse(content); } catch { data = {}; }
  return { sha: json.sha, data };
}

async function githubPut(token, data, sha) {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  return fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'scriptorium-library-fond-report',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      message: 'library-fond-registrum: daily sample',
      content,
      sha: sha || undefined,
      branch: BRANCH,
    }),
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const token = process.env.CHRONICON_GITHUB_TOKEN;
  if (!token) {
    res.status(200).json({ ok: false, reason: 'no_token' });
    return;
  }

  if (!isValidPayload(req.body)) {
    res.status(400).json({ error: 'invalid payload' });
    return;
  }

  const { count, day } = req.body;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { sha, data } = await githubGet(token);

      data[day] = Math.max(data[day] || 0, Math.round(count));
      pruneOldBuckets(data);

      const putRes = await githubPut(token, data, sha);
      if (putRes.ok) {
        res.status(200).json({ ok: true });
        return;
      }
      if (putRes.status === 409 && attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
        continue; // souběžný zápis — SHA se mezitím změnilo, zkusit znovu
      }
      throw new Error(`GitHub PUT selhal: ${putRes.status}`);
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) {
        console.error('[library-fond-report] selhalo po retry:', err.message);
        res.status(200).json({ ok: false, reason: 'github_error' });
        return;
      }
    }
  }
};
