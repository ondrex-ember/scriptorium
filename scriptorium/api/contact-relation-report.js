// ============================================================================
// api/contact-relation-report.js — Vercel serverless function
// Přijímá {relations: {actorId: value, ...}, weight, day} jednou/den od
// klienta a zapisuje vážený vzorek pro KAŽDÉHO aktéra v `relations` do
// chronicon repa. Mirror api/registrum-report.js (Krok B,
// clientela-chronicon-most-mrd.md §5) — stejná Varianta A architektura
// (GitHub Contents API, retry na 409, tiché selhání), jen generalizováno
// z pevného lux/umbra páru na libovolný počet aktérů.
//
// Vyžaduje env proměnnou CHRONICON_GITHUB_TOKEN — scoped GitHub token,
// jen contents:write na ondrex-ember/chronicon.
//
// Tiché selhání směrem k hráči vždy (200 { ok:false }) — chybějící
// token nebo GitHub výpadek nesmí hráči nic rozbít ani zpomalit.
// ============================================================================

const REPO = 'ondrex-ember/chronicon';
const FILE_PATH = 'data/contact_relation_register.json';
const BRANCH = 'main';
const MAX_RETRIES = 3;
const PRUNE_AFTER_DAYS = 10; // ochrana proti nekonečnému růstu souboru
const MAX_ACTORS_PER_REPORT = 20; // ochrana proti zneužití payloadu

function isValidPayload(body) {
  if (!body) return false;
  if (typeof body.weight !== 'number' || body.weight < 1 || body.weight > 4) return false;
  if (typeof body.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.day)) return false;
  if (!body.relations || typeof body.relations !== 'object') return false;
  const entries = Object.entries(body.relations);
  if (entries.length === 0 || entries.length > MAX_ACTORS_PER_REPORT) return false;
  return entries.every(([actorId, val]) =>
    typeof actorId === 'string' && actorId.length > 0 && actorId.length < 40
    && typeof val === 'number' && val >= 0 && val <= 100
  );
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
      'User-Agent': 'scriptorium-contact-relation-report',
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
      'User-Agent': 'scriptorium-contact-relation-report',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      message: 'contact-relation: daily weighted sample',
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

  const { relations, weight, day } = req.body;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { sha, data } = await githubGet(token);

      if (!data[day]) data[day] = {};
      Object.entries(relations).forEach(([actorId, val]) => {
        if (!data[day][actorId]) data[day][actorId] = { wsum: 0, wcount: 0 };
        data[day][actorId].wsum += val * weight;
        data[day][actorId].wcount += weight;
      });
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
        console.error('[contact-relation-report] selhalo po retry:', err.message);
        res.status(200).json({ ok: false, reason: 'github_error' });
        return;
      }
    }
  }
};
