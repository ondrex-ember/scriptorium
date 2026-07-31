diff --git a/tmp/orig_game.js b/src/core/game.js
index b66526c..b429681 100644
--- a/tmp/orig_game.js
+++ b/src/core/game.js
@@ -5220,6 +5220,7 @@ const Game = {
                         PersonaSystem.addInfluence('church', 2);
                         PersonaSystem.addInfluence('village', 2);
                     }
+                    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) PersonaSystem.addReputation('lidovost', 1);
                     if (type === 'wedding' && typeof CellariumSystem !== 'undefined' && CellariumSystem.addGrose) {
                         CellariumSystem.addGrose(5 + Math.floor(Math.random() * 10));
                     }
@@ -5255,6 +5256,7 @@ const Game = {
                 }},
                 { label: (lang==='en'?'🚪 Decline':'🚪 Odmítnout'), effect: () => {
                     if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', -2);
+                    if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) PersonaSystem.addReputation('lidovost', -1);
                     Game._templumLog({ type: 'parish', eventType: type, surname: surname, officiated: false });
                     Game.addKronikaEntry('minor',
                         '🚪 ' + titleMap[type][0] + ': rodina ' + surname + ' odmítnuta.',
@@ -5305,12 +5307,21 @@ const Game = {
                 this.addItem('reliquia', 1);
                 if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 10);
             }
+            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) {
+                PersonaSystem.addReputation('slechta', 3);
+                PersonaSystem.addReputation('cirkev', 3);
+            }
             GameState.flags.visitatioLaudatio = true;
             if (GameState.rank) GameState.rank.priorNomination = true; // MRD 6.5: biskupova chvála = jmenovací akt (Prior)
         } else if (band === 'neutrum') {
             if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', 3);
         } else {
             if (typeof PersonaSystem !== 'undefined') PersonaSystem.addInfluence('church', -5);
+            if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) {
+                PersonaSystem.addReputation('lidovost', -1);
+                PersonaSystem.addReputation('slechta', -3);
+                PersonaSystem.addReputation('cirkev', -3);
+            }
             // Jednotlivec, ne plošný trest: biskup jmenuje jednoho „nedbalého" bratra (MRD 6.6)
             const pool = (GameState.conversi || []).filter(k => !(k.penanceUntil && k.penanceUntil > now));
             if (pool.length) {
@@ -5726,6 +5737,12 @@ const Game = {
         const zboz = 1;
         if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('village', vill);
         if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addZboznost) PersonaSystem.addZboznost(zboz);
+        // Pověst — Lidovost, tiered diminishing returns (povest-frakcni-reputace-mrd.md R3)
+        if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) {
+            const _curLid = (GameState.persona && GameState.persona.reputation && GameState.persona.reputation.lidovost) || 0;
+            const _repDelta = _curLid < 50 ? 2 : _curLid < 80 ? 1 : 0;
+            if (_repDelta > 0) PersonaSystem.addReputation('lidovost', _repDelta);
+        }
 
         t.nextAlms = now + 7 * 24 * 60 * 60 * 1000;
         t.lastAlms = { ts: now };
