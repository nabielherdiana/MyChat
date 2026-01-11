/**
 * Initiation Balance Analysis
 * Analyzes who initiates conversations more often
 */

// Gap threshold for considering a new conversation start (in hours)
const CONVERSATION_GAP_HOURS = 4;

/**
 * Analyze conversation initiation patterns
 * @param {Array} messages - Array of message objects
 * @returns {Object} Initiation data for visualization
 */
export function analyzeInitiationBalance(messages) {
    if (!messages || messages.length < 2) {
        return { labels: [], data: [], statistics: {} };
    }

    const senders = [...new Set(messages.map(m => m.sender))].sort();
    const gapThreshold = CONVERSATION_GAP_HOURS * 60 * 60 * 1000; // Convert to milliseconds

    // Track initiations
    const initiations = {};
    senders.forEach(s => initiations[s] = 0);

    // First message is always an initiation
    initiations[messages[0].sender]++;

    // Check each message for conversation starts
    for (let i = 1; i < messages.length; i++) {
        const current = messages[i];
        const previous = messages[i - 1];

        const gap = new Date(current.timestamp) - new Date(previous.timestamp);

        // If gap is larger than threshold, this is a conversation initiation
        if (gap >= gapThreshold) {
            initiations[current.sender]++;
        }
    }

    const totalInitiations = Object.values(initiations).reduce((sum, count) => sum + count, 0);

    // Calculate percentages
    const percentages = {};
    senders.forEach(sender => {
        percentages[sender] = totalInitiations > 0
            ? Math.round(initiations[sender] / totalInitiations * 100)
            : 0;
    });

    // Determine balance
    let balance;
    const diff = Math.abs(percentages[senders[0]] - percentages[senders[1]]);
    if (diff <= 10) {
        balance = 'balanced';
    } else if (diff <= 25) {
        balance = 'slightly_unbalanced';
    } else {
        balance = 'unbalanced';
    }

    // Find who initiates more
    const moreInitiator = initiations[senders[0]] > initiations[senders[1]] ? senders[0] : senders[1];
    const lessInitiator = initiations[senders[0]] > initiations[senders[1]] ? senders[1] : senders[0];

    return {
        labels: senders,
        data: senders.map(s => initiations[s]),
        backgroundColor: ['#5c7cfa', '#ff6b6b'],
        statistics: {
            total: totalInitiations,
            counts: initiations,
            percentages,
            balance,
            moreInitiator,
            lessInitiator,
            difference: diff
        }
    };
}

/**
 * Analyze initiation trends over time
 * @param {Array} messages - Array of message objects
 * @returns {Object} Initiation trend data
 */
export function analyzeInitiationTrend(messages) {
    if (!messages || messages.length < 2) {
        return { periods: [] };
    }

    const senders = [...new Set(messages.map(m => m.sender))].sort();
    const gapThreshold = CONVERSATION_GAP_HOURS * 60 * 60 * 1000;

    // Divide messages into 3 periods: early, middle, late
    const thirdLength = Math.floor(messages.length / 3);
    const periods = [
        { name: 'early', messages: messages.slice(0, thirdLength), initiations: {} },
        { name: 'middle', messages: messages.slice(thirdLength, thirdLength * 2), initiations: {} },
        { name: 'late', messages: messages.slice(thirdLength * 2), initiations: {} }
    ];

    periods.forEach(period => {
        senders.forEach(s => period.initiations[s] = 0);

        // First message of period (if big gap from previous) counts as initiation
        if (period.messages.length > 0) {
            period.initiations[period.messages[0].sender]++;
        }

        for (let i = 1; i < period.messages.length; i++) {
            const current = period.messages[i];
            const previous = period.messages[i - 1];
            const gap = new Date(current.timestamp) - new Date(previous.timestamp);

            if (gap >= gapThreshold) {
                period.initiations[current.sender]++;
            }
        }
    });

    return {
        periods: periods.map(p => ({
            name: p.name,
            initiations: p.initiations,
            messageCount: p.messages.length
        }))
    };
}
