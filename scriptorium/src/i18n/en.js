// Scriptorium i18n — English (Olde)
// Základ: STRINGS_cs. Chybějící klíče → fallback na CS automaticky.

const STRINGS_en = {
        nav: { home:'Workshop', garden:'Garden', craft:'Craft', inv:'Satchel', lore:'Scriptorium', library:'Library' },
        screens: { home:'The Workshop', garden:'The Garden', craft:'Crafting', inv:'Thy Satchel', lore:'Scriptorium', library:'The Library', settings:'Settings' },
        fireplace: {
            cold:'The Hearth Lies Cold', coldDesc:'A bitter chill claimeth the chamber.', kindle:'KINDLE',
            lit:'The Hearth Burns', litDesc:'Warmth and light fill the scriptorium.'
        },
        light: {
            none:'No Light', noneDesc:'Darkness claimeth this place.',
            candle:'Candle (Burning)', torch:'Torch (Crackling)',
            btnTorch:'LIGHT TORCH', btnCandle:'LIGHT CANDLE'
        },
        craft: { filterAll:'All', filterMat:'Materials', filterFood:'Provisions', filterAlchemy:'Alchemy', filterLore:'Knowledge', btn:'Craft' },
        inv:   { filterAll:'All', filterMat:'Materials', filterTool:'Tools', filterLore:'Other' },
        settings: { langLabel:'🗺️ Language / Jazyk' },
        actions: {
            hunt:'Hunt', bark:'Cut', default:'Search',
            cancel:'CANCEL', claim:'COLLECT',
            quick:'Quick!', quickDesc:'Gather by hand',
            done:'Done!', waiting:'Waiting...', remaining:'Remaining:'
        },
        game: {
            eat:'Eat', required:'(Required)',
            techDone:'DONE',
            techStudy:'Study',
            techRequired:'Required:',
            noTinderbox:'Thou hast no tinderbox!',
            fireKindled:'The hearth is kindled.',
            needFire:'The hearth must burn first!',
            plotLocked:'Locked! (Tech required)',
            needHoe:'A hoe is needed!',
            needFertilizer:'Fertilizer is needed!',
            needSeeds:'Seeds are needed!',
            needWater:'Water is needed!',
            growing:'Growing...',
            needWell:'❌ Thou must first build a well in Crafting!',
            frozenHands:'Thy hands are too cold to work!',
            missingMats:'Materials are wanting!',
            notEnoughResearch:'More study is needed!',
            notFood:'That cannot be eaten!',
            noFood:'Thou hast none!',
            busy:'Already occupied!',
            quickScavenge:'Quick gather!',
            rareFind:'⭐ Rare find: Netolický\'s bitter legacy!',
            candleBurnedOut:'The candle hath burned out.',
            hungry:'⚠️ Hunger claimeth thee!',
            saveExported:'💾 Save exported!',
            saveExportFail:'❌ Export failed!',
            saveImported:'✅ Save imported! Reloading...',
            saveImportFail:'❌ Invalid save file!'
        },
        notify: {
            langSwitched:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 Language set to English.',
            kindleHint:'🔥 Kindle the hearth — drive out the cold.'
        },
        langPicker: {
            heading:'Scriptorium',
            sub:'Anno Domini 1465 · Olomouc',
            prompt:'Choose thy tongue',
            btnCs:'🇨🇿 Česky',
            btnEn:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 English'
        },
        consent: {
            text:'📜 <strong>Scriptorium doth employ Google Analytics</strong> to measure thy progress through the craft — which arts thou dost master, how long thou remainest at the desk. No personal tidings are shared.',
            moreInfo:'Learn more',
            grant:'I consent',
            deny:'I refuse',
            policyTitle:'Scriptorium Analytics — what we observe:',
            policyBody:'• Thy progress (unlocked arts, achievements)\n• Session length and return visits\n• Which parts of the scriptorium thou dost frequent\n\nWhat we do NOT observe:\n• No personal data\n• IP addresses are anonymised\n• Naught is shared beyond Google Analytics\n\nConsent may be revoked by removing the localStorage key "scriptorium_consent".'
        },
        welcome: {
            text:'Thou hast found an abandoned workshop.<br><br>Upon the desk: a cold tinderbox, a shard of flint, a few sheets of parchment thick with dust. Through the shutter comes a steady knocking — someone in the next street works a new machine. They call it a <em>printing press</em>.<br><br>That is outside. In here there is only dark and cold.<br><br><strong>Begin with what thou hast.</strong>',
            btn:'Enter →'
        },
        fireout: {
            heading:'The Workshop Lies Cold',
            btn:'Seek the flame →',
            absence:'Away for:',
            texts: [
                'The ash in the hearth is cold. Utterly cold.<br><br>It took thee time — yet thou art returned. The workshop waits as thou didst leave it. Parchment on the desk. Ink congealed. Quill dry.<br><br>Only the fire needeth to be kindled anew.',
                'Thou hast been away {days} {dayWord}.<br><br>The scriptorium is silent and cold. The candle burned out, the torch long spent. Yet the manuscripts remain. Parchment waiteth more patiently than men.<br><br>The desk is ready. Only warmth is wanting.',
                'Three days gone. Perhaps more.<br><br>The abbot would say: <em>"Acedia — sloth of spirit — is the scribe\'s true enemy."</em> Yet thou art here now. And that doth count for something.<br><br>Strike the tinder. Begin where thou left off.'
            ],
            dayWord: { one:'day', few:'days', many:'days' }
        },
        meta: {
            title:'Scriptorium — Medieval Monastery Idle Game',
            desc:'A medieval idle game set in a monastery scriptorium. Copy manuscripts, tend thy garden, and unlock the secrets of parchment and ink.',
            ogLocale:'en_US'
        }
};
