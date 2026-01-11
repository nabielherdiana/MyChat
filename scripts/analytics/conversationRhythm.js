/**
 * Conversation Rhythm Analysis
 * Characterizes the overall flow and pattern of the conversation
 */

/**
 * Analyze conversation rhythm
 * @param {Array} messages - Array of message objects
 * @returns {Object} Rhythm characterization
 */
export function analyzeConversationRhythm(messages) {
    if (!messages || messages.length < 5) {
        return {
            rhythm: 'insufficient_data',
            confidence: 0,
            details: {}
        };
    }

    // Calculate gaps between consecutive messages
    const gaps = [];
    for (let i = 1; i < messages.length; i++) {
        const gap = (new Date(messages[i].timestamp) - new Date(messages[i - 1].timestamp)) / (1000 * 60); // minutes
        gaps.push(gap);
    }

    // Statistics on gaps
    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    const sortedGaps = [...gaps].sort((a, b) => a - b);
    const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)];

    // Calculate coefficient of variation (CV) for irregularity detection
    const variance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgGap;

    // Divide into thirds to check for slowing trend
    const thirdLength = Math.floor(gaps.length / 3);
    const firstThird = gaps.slice(0, thirdLength);
    const lastThird = gaps.slice(-thirdLength);

    const firstThirdAvg = firstThird.reduce((sum, g) => sum + g, 0) / firstThird.length;
    const lastThirdAvg = lastThird.reduce((sum, g) => sum + g, 0) / lastThird.length;

    // Calculate message frequency trend
    const firstThirdMessages = thirdLength;
    const lastThirdMessages = thirdLength;

    // Determine rhythm type
    let rhythm;
    let confidence;

    // Check for slowing
    if (lastThirdAvg > firstThirdAvg * 2) {
        rhythm = 'slowing';
        confidence = Math.min(0.9, (lastThirdAvg / firstThirdAvg - 1) / 3);
    }
    // Check for high variability
    else if (cv > 1.5) {
        rhythm = 'irregular';
        confidence = Math.min(0.9, (cv - 1) / 2);
    }
    // Check for accelerating
    else if (lastThirdAvg < firstThirdAvg * 0.5) {
        rhythm = 'accelerating';
        confidence = Math.min(0.9, (1 - lastThirdAvg / firstThirdAvg));
    }
    // Stable pattern
    else if (cv < 0.8) {
        rhythm = 'stable';
        confidence = Math.min(0.9, 1 - cv);
    }
    // Variable but not irregular
    else {
        rhythm = 'variable';
        confidence = 0.5;
    }

    // Detailed breakdown by phase
    const phases = analyzePhases(messages);

    return {
        rhythm,
        confidence: Math.round(confidence * 100) / 100,
        details: {
            avgGapMinutes: Math.round(avgGap * 10) / 10,
            medianGapMinutes: Math.round(medianGap * 10) / 10,
            variabilityCoefficient: Math.round(cv * 100) / 100,
            firstPhaseAvgGap: Math.round(firstThirdAvg * 10) / 10,
            lastPhaseAvgGap: Math.round(lastThirdAvg * 10) / 10,
            phases
        }
    };
}

/**
 * Analyze conversation phases
 * @param {Array} messages - Array of message objects
 * @returns {Object} Phase analysis
 */
function analyzePhases(messages) {
    const thirdLength = Math.floor(messages.length / 3);

    const phases = ['early', 'middle', 'late'];
    const result = {};

    phases.forEach((phase, index) => {
        const start = index * thirdLength;
        const end = index === 2 ? messages.length : (index + 1) * thirdLength;
        const phaseMessages = messages.slice(start, end);

        // Calculate phase statistics
        const gaps = [];
        for (let i = 1; i < phaseMessages.length; i++) {
            const gap = (new Date(phaseMessages[i].timestamp) - new Date(phaseMessages[i - 1].timestamp)) / (1000 * 60);
            gaps.push(gap);
        }

        const avgGap = gaps.length > 0 ? gaps.reduce((sum, g) => sum + g, 0) / gaps.length : 0;

        // Calculate messages per participant
        const senders = [...new Set(phaseMessages.map(m => m.sender))];
        const senderCounts = {};
        senders.forEach(s => {
            senderCounts[s] = phaseMessages.filter(m => m.sender === s).length;
        });

        result[phase] = {
            messageCount: phaseMessages.length,
            avgGapMinutes: Math.round(avgGap * 10) / 10,
            senderCounts
        };
    });

    return result;
}

/**
 * Get rhythm emoji
 * @param {string} rhythm - Rhythm type
 * @returns {string} Emoji representation
 */
export function getRhythmEmoji(rhythm) {
    const emojis = {
        'stable': '📊',
        'slowing': '📉',
        'accelerating': '📈',
        'irregular': '📶',
        'variable': '〰️',
        'insufficient_data': '❓'
    };
    return emojis[rhythm] || '📊';
}
