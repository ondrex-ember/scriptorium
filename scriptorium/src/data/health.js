// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CONDITIONS DB (Valetudo)
// Vzor jako ItemsDB — objekt klíčovaný podle id.
// Viz health-system-reference.md v0.2 pro plný popis modelu.
// ═══════════════════════════════════════════════════════════════════════════

const HealthConditionsDB = {
    "water_sickness": {
        name: "Nevolnost z vody", name_en: "Water Sickness", icon: "🤢",
        desc: "Něco s tou vodou nebylo v pořádku.",
        desc_en: "Something about that water was not right.",
        durationHours: 36,
        onApply: { satiety: -15, fatigue: 15 },
        tickHour: { satiety: -1 },
        cures: ["antidote"],
    },
    "cold": {
        name: "Nachlazení", name_en: "Cold", icon: "🤧",
        desc: "Zima a mokro se podepsaly na těle.",
        desc_en: "Cold and damp have taken their toll.",
        durationHours: 72,
        onApply: { satiety: -10, fatigue: 15 },
        tickHour: { fatigue: 2 },
        cures: ["potion_heal", "herbal_tea", "hildegard_tisane", "linden_tea", "sleep_potion"],
    },
    "mosquito_bites": {
        name: "Komáří štípance", name_en: "Mosquito Bites", icon: "🦟",
        desc: "Komáři z kalné vody tě štípali celou noc.",
        desc_en: "Mosquitoes from the murky water bit you all night.",
        durationHours: 24,
        onApply: { fatigue: 10 },
        tickHour: { fatigue: 1 },
        cures: [],
    },
};
