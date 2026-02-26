export const getVastuDetails = (room: string, dir: string, facing: string = "") => {
    if (!room || !dir) return { status: "neutral", score: 0.5, note: "Please select both room and direction for analysis." }
    if (dir === "N/A") return { status: "neutral", score: 0.5, note: "Not available in this unit. (Ignored in scoring)" }
    const r = room.toLowerCase(); const d = dir.toLowerCase(); const f = facing.toLowerCase() === 'none' ? '' : facing.toLowerCase();

    // 1. MAIN ENTRANCE
    if (r === 'main entrance' || r === 'cash / reception') {
        let score = 1.0; let status = 'excellent'; let note = r === 'main entrance' ? "Highly auspicious. Attracts wealth and positive energy." : "Highly auspicious for cash flow.";
        if (['north', 'east', 'north-east'].includes(d)) { }
        else if (['west', 'north-west'].includes(d)) { status = 'good'; score = 0.75; note = "Generally favorable, brings stability and steady progress." }
        else { status = 'avoid'; score = 0.0; note = "Not recommended. May cause struggles. Requires Vastu remedies." }

        if (f) {
            if (['east', 'north', 'north-east'].includes(f)) note += " Opening towards North/East is perfect.";
            else { score -= 0.3; note += " Opening direction is not ideal."; }
        }
        if (score <= 0.3) status = 'avoid'; else if (score < 0.8) status = 'good';
        return { status, score, note };
    }

    // 2. KITCHEN
    if (r === 'kitchen' || r === 'pantry') {
        let score = 1.0; let status = 'excellent'; let note = "Perfect 'Agni' (Fire) zone. Brings health and prosperity.";
        if (d === 'south-east') { }
        else if (d === 'north-west') { status = 'good'; score = 0.8; note = "Secondary favorable zone for fire element." }
        else if (['north-east', 'south-west', 'center'].includes(d)) { return { status: 'avoid', score: 0.0, note: "Highly detrimental. Can cause severe health and financial drains." } }
        else { status = 'neutral'; score = 0.5; note = "Average placement. Keep stove facing east while cooking." }

        if (f) {
            if (['east'].includes(f)) note += " Cooking facing East is highly auspicious.";
            else { score -= 0.2; note += " Cook should ideally face East."; }
        }
        if (score <= 0) status = 'avoid'; else if (score < 0.8) status = 'good';
        return { status, score, note };
    }

    // BED HEADBOARD
    if (r.includes('headboard')) {
        if (['south', 'west'].includes(d)) return { status: 'excellent', score: 1.0, note: "Deep rest and longevity. Aligns with Earth's magnetic field." }
        if (['east'].includes(d)) return { status: 'good', score: 0.8, note: "Good for students and unmarried children." }
        if (['north'].includes(d)) return { status: 'avoid', score: 0.0, note: "Never sleep with head towards North. Causes sleep disorders." }
        return { status: 'neutral', score: 0.5, note: "South or West is the best." }
    }

    // 3. MASTER BEDROOM
    if (r === 'master bedroom') {
        let score = 1.0; let status = 'excellent'; let note = "Ideal zone of strength/stability for the head of family.";
        if (d === 'south-west') { }
        else if (['south', 'west'].includes(d)) { status = 'good'; score = 0.75; note = "Good alternative, promotes peace." }
        else if (['north-east', 'south-east'].includes(d)) { return { status: 'avoid', score: 0.0, note: "Avoid here. Represents water/fire clashes leading to unrest." } }
        else { status = 'neutral'; score = 0.5; note = "Acceptable placement." }

        if (f) {
            if (['south', 'west'].includes(f)) note += " Sleeping with head towards South/West ensures deep rest.";
            else if (f === 'north') { score = 0.0; status = 'avoid'; note += " NEVER sleep with head towards North."; }
        }
        if (score <= 0) status = 'avoid'; else if (score < 0.8) status = 'good';
        return { status, score, note };
    }

    // BEDROOMS (KIDS, GUEST, BEDROOM 4/5, SERVANT)
    if (r.includes('kids') || r.includes('guest') || r.includes('bedroom 4') || r.includes('bedroom 5') || r.includes('servant') || r.includes('study room') || r.includes('workspace')) {
        let score = 1.0; let status = 'excellent'; let note = "Perfect for movement and growth.";
        if (['north-west', 'west'].includes(d)) { }
        else if (['south', 'east'].includes(d)) { status = 'good'; score = 0.75; note = "Favorable, keeps the mind active." }
        else if (d === 'south-west') { return { status: 'avoid', score: 0.0, note: "Reserved for Master Bedroom ideally. Secondary room." } }
        else { status = 'neutral'; score = 0.5; note = "Acceptable layout." }

        if (f) {
            if (['south', 'west'].includes(f)) note += " Bed towards South/West ensures deep rest.";
            else if (f === 'north') { score = 0.0; status = 'avoid'; note += " NEVER sleep with head towards North."; }
        }
        if (score <= 0) status = 'avoid'; else if (score < 0.8) status = 'good';
        return { status, score, note };
    }

    // 4. POOJA ROOM
    if (r === 'pooja room') {
        let score = 1.0; let status = 'excellent'; let note = "Divine 'Ishan' corner. Maximizes spiritual energy.";
        if (['north-east', 'east', 'north'].includes(d)) { }
        else if (['south', 'south-west'].includes(d)) { return { status: 'avoid', score: 0.0, note: "Inauspicious for worship. Strongly avoid." } }
        else { status = 'neutral'; score = 0.5; note = "Acceptable placement." }

        if (f) {
            if (['east', 'west'].includes(f)) note += " Idols facing East or West is auspicious.";
            else { score -= 0.2; note += " Worshipper should ideally face East or North."; }
        }
        if (score <= 0.3) status = 'avoid'; else if (score < 0.8) status = 'good';
        return { status, score, note };
    }

    // 5. WASHROOMS
    if (r.includes('washroom')) {
        let score = 1.0; let status = 'excellent'; let note = "Ideal zone for disposal of waste energies.";
        if (['north-west', 'west', 'south-south-west'].includes(d)) { }
        else if (r.includes('attached washroom') && d === 'south') { status = 'good'; score = 0.8; note = "Acceptable for attached baths." }
        else if (['north-east', 'south-west', 'center'].includes(d)) { return { status: 'avoid', score: 0.0, note: "Severe Vastu Dosha. Contaminates wealth and health zones." } }
        else { status = 'neutral'; score = 0.5; note = "Acceptable placement." }

        if (f) {
            if (['north', 'south'].includes(f)) note += " Toilet seat (Commode) facing North or South is correct.";
            else { score -= 0.3; note += " Toilet seat MUST face North or South."; }
        }
        if (score <= 0.3) status = 'avoid'; else if (score < 0.8) status = 'good';
        return { status, score, note };
    }

    // BALCONY / SUNLIGHT / WINDOWS
    if (r.includes('balcony') || r.includes('window') || r.includes('sunlight')) {
        if (['north', 'east', 'north-east'].includes(d)) return { status: 'excellent', score: 1.0, note: "Welcomes positive morning rays and magnetic energy." }
        if (d === 'west') return { status: 'good', score: 0.75, note: "Good for evening light." }
        if (['south', 'south-west'].includes(d)) return { status: 'avoid', score: 0.2, note: "Brings harsh afternoon heat. Close with heavy curtains." }
        return { status: 'neutral', score: 0.5, note: "Standard setup." }
    }

    // LIVING / DINING ROOM
    if (['living room', 'dining room'].includes(r)) {
        if (['north', 'east', 'north-east', 'north-west'].includes(d) || (r === 'dining room' && d === 'west')) return { status: 'excellent', score: 1.0, note: "Excellent for socializing and gathering positive energy." }
        if (['south', 'south-west'].includes(d)) return { status: 'avoid', score: 0.2, note: "Makes guests stay too long / domineering." }
        return { status: 'neutral', score: 0.5, note: "Keep heavy furniture in West/South." }
    }

    // SAFE / LOCKER
    if (r === 'safe / locker') {
        let score = 1.0; let status = 'excellent'; let note = "Earth element stabilizes wealth.";
        if (['south-west', 'south'].includes(d)) { }
        else if (['west'].includes(d)) { status = 'good'; score = 0.8; note = "Good for financial gains." }
        else if (['north-east', 'north-west', 'center'].includes(d)) { return { status: 'avoid', score: 0.0, note: "Wealth will not accumulate here." } }
        else { status = 'neutral'; score = 0.5; note = "Acceptable placement." }

        if (f) {
            if (f === 'north') note += " Opening towards North (Kuber's direction) is perfect.";
            else { score -= 0.3; note += " Must open towards North."; }
        }
        if (score <= 0.3) status = 'avoid'; else if (score < 0.8) status = 'good';
        return { status, score, note };
    }

    // STUDY TABLE
    if (r === 'study table') {
        let score = 1.0; let status = 'excellent'; let note = "Enhances concentration, memory, and clear thinking.";
        if (['east', 'north', 'north-east'].includes(d)) { }
        else if (['west'].includes(d)) { status = 'good'; score = 0.75; note = "Acceptable for older students." }
        else if (['south', 'south-west'].includes(d)) { return { status: 'avoid', score: 0.0, note: "Reduces focus, causes lethargy." } }
        else { status = 'neutral'; score = 0.5; note = "Acceptable placement." }

        if (f) {
            if (['east', 'north'].includes(f)) note += " Facing East or North while studying is best.";
            else { score -= 0.2; note += " Should ideally face East/North."; }
        }
        if (score <= 0.3) status = 'avoid'; else if (score < 0.8) status = 'good';
        return { status, score, note };
    }

    return { status: 'neutral', score: 0.5, note: "General acceptable placement." }
}
