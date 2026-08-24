// ============================================================================
// api/guild-tension-report.js — Vercel serverless function / Express handler
// Přijímá { guildId, day, count } od klienta a zapisuje do guild_register.json.
// Podporuje lokální vývoj i GitHub API při nasazení s tokenem CHRONICON_GITHUB_TOKEN.
// ============================================================================

const fs = require('fs');
const path = require('path');

const REPO = 'ondrex-ember/chronicon';
const FILE_PATH = 'data/guild_register.json';
const LOCAL_FILE_PATH = path.join(__dirname, '..', '..', 'chronicon', 'data', 'guild_register.json');
const BRANCH = 'main';
const MAX_RETRIES = 3;
const PRUNE_AFTER_DAYS = 10;
const GUILD_ID_RE = /^[a-z_]{1,40}$/;
// Tvrdý strop na jeden report — klient posílá qty prodeje, ale nesmí to
// jít neomezeně (public repo, endpoint bez autentizace). Server nikdy
// nevěří klientovi bez ořezu (v0.6 bod 3).
const MAX_COUNT_PER_REPORT = 5;

function isValidPayload(body) {
  return !!body
    && typeof body.guildId === 'string' && GUILD_ID_RE.test(body.guildId)
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
      'User-Agent': 'scriptorium-guild-tension-report',
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
      'User-Agent': 'scriptorium-guild-tension-report',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      message: 'guild-tension-register: daily report',
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

  if (!isValidPayload(req.body)) {
    res.status(400).json({ error: 'invalid payload' });
    return;
  }

  const { guildId, day, count } = req.body;
  const inc = (typeof count === 'number' && count > 0)
    ? Math.min(Math.floor(count), MAX_COUNT_PER_REPORT)
    : 1;

  // Local filesystem writing if local file exists
  if (fs.existsSync(path.dirname(LOCAL_FILE_PATH))) {
    try {
      let data = {};
      if (fs.existsSync(LOCAL_FILE_PATH)) {
        data = JSON.parse(fs.readFileSync(LOCAL_FILE_PATH, 'utf8'));
      }
      if (!data[day]) data[day] = {};
      data[day][guildId] = (data[day][guildId] || 0) + inc;
      pruneOldBuckets(data);
      fs.writeFileSync(LOCAL_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
      res.status(200).json({ ok: true, local: true });
      return;
    } catch (err) {
      console.warn('[guild-tension-report] local write warn:', err.message);
    }
  }

  const token = process.env.CHRONICON_GITHUB_TOKEN;
  if (!token) {
    res.status(200).json({ ok: false, reason: 'no_token_and_no_local_file' });
    return;
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { sha, data } = await githubGet(token);

      if (!data[day]) data[day] = {};
      data[day][guildId] = (data[day][guildId] || 0) + inc;
      pruneOldBuckets(data);

      const putRes = await githubPut(token, data, sha);
      if (putRes.ok) {
        res.status(200).json({ ok: true });
        return;
      }
      if (putRes.status === 409 && attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
        continue;
      }
      throw new Error(`GitHub PUT selhal: ${putRes.status}`);
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) {
        console.error('[guild-tension-report] selhalo po retry:', err.message);
        res.status(200).json({ ok: false, reason: 'github_error' });
        return;
      }
    }
  }
};
