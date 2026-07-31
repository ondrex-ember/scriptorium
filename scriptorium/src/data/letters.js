diff --git a/tmp/orig_letters.js b/src/data/letters.js
index b959027..2a0eb3f 100644
--- a/tmp/orig_letters.js
+++ b/src/data/letters.js
@@ -788,4 +788,138 @@ const LettersDB = [
         notify_cs: 'Prodána za 50 grošů.', notify_en: 'Sold for 50 groschen.' }
     ]
   },
+
+  // ═══ ZAKÁZKY — Kategorie D: církevní postava mimo biskupa ═══
+  // zakazky-rozsireni-ctyri-kategorie-mrd.md §5. Jen Přijmout (žádné
+  // Odmítnout — mirror biskupský vzor, viz MRD §7).
+
+  // ── D1 — Opat kláštera v Rajhradě: opis kodexu pro bratrskou knihovnu ──
+  {
+    id: 'd1_opat_exemplar',
+    sender_cs: 'Opat kláštera v Rajhradě', sender_en: 'Abbot of Rajhrad Abbey',
+    seal: 'scholars',
+    title_cs: 'Prosba bratrského domu',
+    title_en: 'A Plea from a Brother House',
+    text_cs: '„Ctihodný bratře, dozvěděli jsme se o pilnosti vašeho skriptoria. Náš dům postrádá jistý spis, jejž prý chováte. Prosíme o opis k rozšíření naší knihovny — výměnou nabízíme totéž, přijde-li kdy potřeba. Mezi domy řádu budiž vědění sdíleno, ne žárlivě střeženo. — Opat kláštera v Rajhradě\"',
+    text_en: '\"Venerable brother, we have heard of your scriptorium\'s diligence. Our house lacks a certain work said to be in your keeping. We ask for a copy to enrich our library — in exchange we offer the same, should the need ever arise. Between houses of the order, let knowledge be shared, not jealously guarded. — Abbot of Rajhrad Abbey\"',
+    trigger: function () {
+      const m = GameState.rank && GameState.rank.monastic;
+      return ['frater', 'armarius', 'prior'].includes(m)
+        && (GameState.researchedTechs || []).includes('tech_studovna')
+        && !GameState.flags.opatExemplar;
+    },
+    commitment: {
+      flagKey: 'opatExemplar',
+      deadlineFlagKey: 'opatExemplarDeadline',
+      activeStatuses: ['commissioned'],
+      forWhom_cs: 'Opat kláštera v Rajhradě', forWhom_en: 'Abbot of Rajhrad Abbey',
+      what_cs: 'Opis kodexu pro klášterní knihovnu', what_en: 'A codex copy for the abbey library',
+      reward_cs: '60 grošů + Učenci +6', reward_en: '60 groschen + Scholars +6',
+      risk_cs: 'Učenci −4 při zmeškání lhůty', risk_en: 'Scholars −4 if the deadline is missed',
+      requiredItem: { id: 'common_codex', qty: 1 },
+      reward: { grose: 60, influenceKey: 'scholars', influenceAmt: 6 },
+      penalty: { influenceKey: 'scholars', influenceAmt: -4 },
+      deliveredValue: 'delivered',
+    },
+    choices: [
+      { label_cs: '📜 Přijímám prosbu', label_en: '📜 I accept the request',
+        effect: function () {
+          GameState.flags.opatExemplar = 'commissioned';
+          GameState.flags.opatExemplarDeadline = Date.now() + 21 * 24 * 60 * 60 * 1000;
+        },
+        notify_cs: 'Zakázka běží: opis kodexu pro Rajhrad, 21 dní.',
+        notify_en: 'The commission runs: a codex copy for Rajhrad, 21 days.' }
+    ]
+  },
+
+  // ── D1b — Zmeškaná lhůta (opatExemplar: commissioned + po deadline) ──
+  {
+    id: 'd1b_opat_zmeskani',
+    sender_cs: 'Opat kláštera v Rajhradě', sender_en: 'Abbot of Rajhrad Abbey',
+    seal: 'scholars',
+    title_cs: 'Zklamaná odpověď',
+    title_en: 'A Disappointed Reply',
+    text_cs: '„Bratře, čekali jsme. Kodex nepřišel. Snad jindy — bratrská trpělivost má i své meze. — Opat kláštera v Rajhradě\"',
+    text_en: '\"Brother, we waited. The codex did not come. Perhaps another time — even brotherly patience has its limits. — Abbot of Rajhrad Abbey\"',
+    trigger: function () {
+      return GameState.flags.opatExemplar === 'commissioned'
+        && (GameState.flags.opatExemplarDeadline || 0) > 0
+        && Date.now() > GameState.flags.opatExemplarDeadline;
+    },
+    choices: [
+      { label_cs: '🕯️ Sklopit hlavu', label_en: '🕯️ Bow the head',
+        effect: function () {
+          GameState.flags.opatExemplar = 'failed';
+          if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('scholars', -4);
+          if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) PersonaSystem.addReputation('cirkev', -1);
+        },
+        notify_cs: 'Slib nesplněn. (Učenci −4, Církevní pověst −1)',
+        notify_en: 'A promise unkept. (Scholars −4, Clergy reputation −1)' }
+    ]
+  },
+
+  // ── D2 — Farář ze sousední vsi: kancionál pro chudou farnost ──
+  {
+    id: 'd2_farar_kancional',
+    sender_cs: 'Farář ze sousední vsi', sender_en: 'The Priest of the Neighbouring Village',
+    seal: 'church',
+    title_cs: 'Prosba chudé fary',
+    title_en: 'A Plea from a Poor Parish',
+    text_cs: '„Ctihodný bratře, naše fara nemá než jeden ošlapaný kancionál a ten už sotva drží hřbet. Prosíme skriptorium o nový opis — ne pro slávu, jen aby lid měl podle čeho zpívat. Farnost je chudá, víc než pár grošů nabídnout nemůže, ale modlitby za vaši dílnu budou upřímné. — Farář ze sousední vsi\"',
+    text_en: '\"Venerable brother, our parish has but one worn hymnal, and its spine barely holds. We ask the scriptorium for a fresh copy — not for glory, only so the people may have words to sing by. The parish is poor and can offer little beyond a few groschen, but the prayers for your workshop will be sincere. — The Priest of the Neighbouring Village\"',
+    trigger: function () {
+      const m = GameState.rank && GameState.rank.monastic;
+      return ['frater', 'armarius', 'prior'].includes(m)
+        && typeof TemplumSystem !== 'undefined' && TemplumSystem.isUnlocked()
+        && !GameState.flags.fararKancional;
+    },
+    commitment: {
+      flagKey: 'fararKancional',
+      deadlineFlagKey: 'fararKancionalDeadline',
+      activeStatuses: ['commissioned'],
+      forWhom_cs: 'Farář ze sousední vsi', forWhom_en: 'The Priest of the Neighbouring Village',
+      what_cs: 'Kancionál pro chudou farnost', what_en: 'A hymnal for a poor parish',
+      reward_cs: '25 grošů + Ecclesia +4', reward_en: '25 groschen + Ecclesia +4',
+      risk_cs: 'Ecclesia −2 při zmeškání lhůty', risk_en: 'Ecclesia −2 if the deadline is missed',
+      requiredItem: { id: 'common_codex', qty: 1 },
+      reward: { grose: 25, influenceKey: 'church', influenceAmt: 4 },
+      penalty: { influenceKey: 'church', influenceAmt: -2 },
+      deliveredValue: 'delivered',
+    },
+    choices: [
+      { label_cs: '📜 Přijímám prosbu', label_en: '📜 I accept the request',
+        effect: function () {
+          GameState.flags.fararKancional = 'commissioned';
+          GameState.flags.fararKancionalDeadline = Date.now() + 14 * 24 * 60 * 60 * 1000;
+        },
+        notify_cs: 'Zakázka běží: kancionál pro faru, 14 dní.',
+        notify_en: 'The commission runs: a hymnal for the parish, 14 days.' }
+    ]
+  },
+
+  // ── D2b — Zmeškaná lhůta (fararKancional: commissioned + po deadline) ──
+  {
+    id: 'd2b_farar_zmeskani',
+    sender_cs: 'Farář ze sousední vsi', sender_en: 'The Priest of the Neighbouring Village',
+    seal: 'church',
+    title_cs: 'Tichý povzdech fary',
+    title_en: 'A Quiet Sigh from the Parish',
+    text_cs: '„Bratře, kancionál nepřišel. Lid zpívá dál, jak umí, ze staré ošoupané knihy. Bůh odpouští — fara si to jen tiše pamatuje. — Farář ze sousední vsi\"',
+    text_en: '\"Brother, the hymnal did not come. The people still sing as best they can, from the old worn book. God forgives — the parish only quietly remembers. — The Priest of the Neighbouring Village\"',
+    trigger: function () {
+      return GameState.flags.fararKancional === 'commissioned'
+        && (GameState.flags.fararKancionalDeadline || 0) > 0
+        && Date.now() > GameState.flags.fararKancionalDeadline;
+    },
+    choices: [
+      { label_cs: '🕯️ Sklopit hlavu', label_en: '🕯️ Bow the head',
+        effect: function () {
+          GameState.flags.fararKancional = 'failed';
+          if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addInfluence) PersonaSystem.addInfluence('church', -2);
+          if (typeof PersonaSystem !== 'undefined' && PersonaSystem.addReputation) PersonaSystem.addReputation('lidovost', -1);
+        },
+        notify_cs: 'Slib nesplněn. (Ecclesia −2, Lid (Pověst) −1)',
+        notify_en: 'A promise unkept. (Ecclesia −2, Common folk reputation −1)' }
+    ]
+  },
 ];
\ No newline at end of file
