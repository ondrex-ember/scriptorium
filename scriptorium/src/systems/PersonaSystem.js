diff --git a/tmp/orig_persona.js b/src/systems/PersonaSystem.js
index 546bc1b..16ed6ef 100644
--- a/tmp/orig_persona.js
+++ b/src/systems/PersonaSystem.js
@@ -82,6 +82,14 @@ const PersonaSystem = {
         if (GameState.persona.influence.bartolomej === undefined) GameState.persona.influence.bartolomej = 0;
         // Migrace v4 — Vrchnost (Studovna, studovna-vrchnost-mrd.md)
         if (GameState.persona.influence.vrchnost === undefined) GameState.persona.influence.vrchnost = 0;
+        // Migrace v5 — Pověst (Frakční reputace, povest-frakcni-reputace-mrd.md)
+        // Pasivní, NEERODUJE (na rozdíl od influence) — mění jen konkrétní činy/eventy.
+        // Seed dle ranku: rozjetý save s pokročilým rankem nezačíná na "nikdo tě nezná".
+        if (!GameState.persona.reputation) {
+            const _advancedRank = GameState.rank && ['armarius', 'prior'].includes(GameState.rank.monastic);
+            const _repSeed = _advancedRank ? 50 : 0;
+            GameState.persona.reputation = { lidovost: _repSeed, slechta: _repSeed, cirkev: _repSeed };
+        }
 
         // Zkontrolovat zda zobrazit origin modal
         this.checkOriginModal();
@@ -691,6 +699,18 @@ const PersonaSystem = {
             inf.scholars || 0,
             lang==='en'?'Prvotisk customers, Library bonuses, manuscript reputation.':'Zákazníci Prvotisku, bonusy Knihovny, reputace rukopisů.', (inf.scholars || 0) === 0);
 
+        h += `<div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.55;margin:14px 0 10px;">${lang==='en'?'Reputation — passive':'Pověst — pasivní'}</div>`;
+        const rep = (GameState.persona && GameState.persona.reputation) || {};
+        h += bar('🗣️', lang==='en'?'Common folk':'Lid',
+            rep.lidovost || 0,
+            lang==='en'?'What the village whispers about you. Does not decay — moved only by deeds.':'Co se o tobě šeptá ve vsi. Neeroduje — hýbou jí jen činy.', false);
+        h += bar('👑', lang==='en'?'Nobility':'Šlechta',
+            rep.slechta || 0,
+            lang==='en'?'Standing among lords and patricians. Does not decay.':'Postavení u šlechty a patriciátu. Neeroduje.', false);
+        h += bar('📿', lang==='en'?'Clergy network':'Církevní síť',
+            rep.cirkev || 0,
+            lang==='en'?'What is said of you among priests and abbots. Does not decay.':'Co se o tobě říká mezi kněžími a opaty. Neeroduje.', false);
+
         h += `<div style="font-size:0.75rem;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;opacity:0.55;margin:14px 0 10px;">${lang==='en'?'Inner life':'Vnitřní život'}</div>`;
         h += bar('🙏', lang==='en'?'Piety':'Zbožnost',
             (GameState.persona && GameState.persona.zboznost) || 0,
@@ -1202,6 +1222,17 @@ const PersonaSystem = {
         Game.save();
     },
 
+    // Pověst — pasivní frakční reputace (povest-frakcni-reputace-mrd.md)
+    // Odlišné od addInfluence: NEERODUJE (žádný hák v tickDecay), mění ji jen
+    // konkrétní činy/eventy volající tuhle funkci přímo.
+    // axis: 'lidovost' | 'slechta' | 'cirkev'
+    addReputation: function(axis, amount) {
+        if (!GameState.persona || !GameState.persona.reputation) return;
+        if (!(axis in GameState.persona.reputation)) return;
+        GameState.persona.reputation[axis] = Math.max(0, Math.min(100, (GameState.persona.reputation[axis]||0) + amount));
+        Game.save();
+    },
+
     // Decay influence — volat z game.js daily tick
     // Každých 7 reálných dní odečte -1 od každé osy influence
     // Osy s hodnotou 0 se nemění (nevznikají záporné)
