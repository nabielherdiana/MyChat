/**
 * Lexical Diversity Analysis
 * Measures vocabulary variety over time using Type-Token Ratio
 */

/**
 * Analyze lexical diversity over time
 * @param {Array} messages - Array of message objects
 * @returns {Object} Lexical diversity data for visualization
 */
export function analyzeLexicalDiversity(messages) {
    if (!messages || messages.length < 10) {
        return { labels: [], datasets: [], statistics: {} };
    }

    const senders = [...new Set(messages.map(m => m.sender))].sort();

    // Divide into time periods (approximately 8-10 periods)
    const numPeriods = Math.min(10, Math.max(4, Math.floor(messages.length / 20)));
    const periodSize = Math.ceil(messages.length / numPeriods);

    const periods = [];

    for (let i = 0; i < numPeriods; i++) {
        const start = i * periodSize;
        const end = Math.min((i + 1) * periodSize, messages.length);
        const periodMessages = messages.slice(start, end);

        if (periodMessages.length > 0) {
            // Calculate TTR for each sender
            const senderTTR = {};
            senders.forEach(sender => {
                const senderMessages = periodMessages.filter(m => m.sender === sender);
                senderTTR[sender] = calculateTTR(senderMessages);
            });

            // Overall TTR for the period
            const overallTTR = calculateTTR(periodMessages);

            periods.push({
                label: `Period ${i + 1}`,
                ttr: overallTTR,
                senderTTR
            });
        }
    }

    // Prepare chart data
    const labels = periods.map(p => p.label);

    const datasets = [
        {
            label: 'Vocabulary Variety (TTR)',
            data: periods.map(p => Math.round(p.ttr * 100) / 100),
            borderColor: '#40c057',
            backgroundColor: 'rgba(64, 192, 87, 0.1)',
            fill: true,
            tension: 0.3
        }
    ];

    // Calculate trend
    const firstHalf = periods.slice(0, Math.floor(periods.length / 2));
    const secondHalf = periods.slice(Math.floor(periods.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.ttr, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.ttr, 0) / secondHalf.length;

    let trend;
    if (secondHalfAvg > firstHalfAvg * 1.1) {
        trend = 'increasing';
    } else if (secondHalfAvg < firstHalfAvg * 0.9) {
        trend = 'decreasing';
    } else {
        trend = 'stable';
    }

    // Per-sender statistics
    const senderStats = {};
    senders.forEach(sender => {
        const senderMessages = messages.filter(m => m.sender === sender);
        const overallTTR = calculateTTR(senderMessages);
        senderStats[sender] = {
            ttr: Math.round(overallTTR * 100) / 100,
            totalWords: countWords(senderMessages),
            uniqueWords: countUniqueWords(senderMessages)
        };
    });

    return {
        labels,
        datasets,
        statistics: {
            overallTTR: Math.round(calculateTTR(messages) * 100) / 100,
            trend,
            firstHalfAvg: Math.round(firstHalfAvg * 100) / 100,
            secondHalfAvg: Math.round(secondHalfAvg * 100) / 100,
            senderStats
        }
    };
}

/**
 * Calculate Type-Token Ratio
 * TTR = unique words / total words
 * @param {Array} messages - Array of message objects
 * @returns {number} TTR value between 0 and 1
 */
function calculateTTR(messages) {
    if (!messages || messages.length === 0) return 0;

    const allWords = [];
    const uniqueWords = new Set();

    for (const msg of messages) {
        const words = extractWords(msg.text);
        words.forEach(word => {
            allWords.push(word);
            uniqueWords.add(word);
        });
    }

    if (allWords.length === 0) return 0;
    return uniqueWords.size / allWords.length;
}

/**
 * Count total words in messages
 */
function countWords(messages) {
    let count = 0;
    for (const msg of messages) {
        count += extractWords(msg.text).length;
    }
    return count;
}

/**
 * Count unique words in messages
 */
function countUniqueWords(messages) {
    const uniqueWords = new Set();
    for (const msg of messages) {
        extractWords(msg.text).forEach(word => uniqueWords.add(word));
    }
    return uniqueWords.size;
}

/**
 * Extract words from text
 * @param {string} text - Message text
 * @returns {string[]} Array of lowercase words
 */
function extractWords(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 1);
}
