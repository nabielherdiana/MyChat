/**
 * Response Timing Analysis
 * Calculates response time patterns between participants
 * OPTIMIZED for large datasets (15k+ messages)
 */

/**
 * Analyze response timing patterns
 * @param {Array} messages - Array of message objects
 * @returns {Object} Response timing data for visualization
 */
export function analyzeResponseTiming(messages) {
    if (!messages || messages.length < 2) {
        return { labels: [], datasets: [], statistics: {} };
    }

    const senders = [...new Set(messages.map(m => m.sender))].sort();

    // Process ALL messages - no sampling
    console.log(`📊 Processing ALL ${messages.length} messages for response timing`);

    // Calculate response times
    const responseTimes = {};
    senders.forEach(s => responseTimes[s] = []);

    for (let i = 1; i < messages.length; i++) {
        const current = messages[i];
        const previous = messages[i - 1];

        // Only count if different sender (this is a response)
        if (current.sender !== previous.sender) {
            const currentTime = new Date(current.timestamp).getTime();
            const previousTime = new Date(previous.timestamp).getTime();
            const responseTime = (currentTime - previousTime) / (1000 * 60); // in minutes

            // Cap at 24 hours to avoid skewing from long gaps
            if (responseTime <= 1440 && responseTime >= 0) {
                if (responseTimes[current.sender]) {
                    responseTimes[current.sender].push({
                        time: responseTime,
                        timestamp: currentTime
                    });
                }
            }
        }
    }

    // Collect all response times for periods
    const allResponses = [];
    senders.forEach(sender => {
        responseTimes[sender].forEach(r => {
            allResponses.push({ ...r, sender });
        });
    });
    allResponses.sort((a, b) => a.timestamp - b.timestamp);

    // Divide into time periods (approximately 10 periods)
    const numPeriods = Math.min(10, Math.max(3, Math.floor(allResponses.length / 5)));
    const periodSize = Math.ceil(allResponses.length / numPeriods);

    const periods = [];
    for (let i = 0; i < numPeriods; i++) {
        const start = i * periodSize;
        const end = Math.min((i + 1) * periodSize, allResponses.length);
        const periodResponses = allResponses.slice(start, end);

        if (periodResponses.length > 0) {
            const overallAvg = periodResponses.reduce((sum, r) => sum + r.time, 0) / periodResponses.length;

            periods.push({
                label: `Period ${i + 1}`,
                overallAvg: overallAvg
            });
        }
    }

    // Prepare chart data
    const labels = periods.map(p => p.label);

    const datasets = [
        {
            label: 'Average Response Time (minutes)',
            data: periods.map(p => Math.round(p.overallAvg * 10) / 10),
            borderColor: '#5c7cfa',
            backgroundColor: 'rgba(92, 124, 250, 0.1)',
            fill: true,
            tension: 0.3
        }
    ];

    // Calculate statistics
    const allTimes = allResponses.map(r => r.time);
    const overallAvg = allTimes.length > 0
        ? allTimes.reduce((sum, t) => sum + t, 0) / allTimes.length
        : 0;

    // Per-sender averages
    const senderStats = {};
    senders.forEach(sender => {
        const times = responseTimes[sender].map(r => r.time);
        senderStats[sender] = {
            avg: times.length > 0 ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length * 10) / 10 : 0,
            count: times.length
        };
    });

    // Trend: compare first half vs second half
    let trend = 'stable';
    if (periods.length >= 2) {
        const firstHalf = periods.slice(0, Math.floor(periods.length / 2));
        const secondHalf = periods.slice(Math.floor(periods.length / 2));

        const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.overallAvg, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.overallAvg, 0) / secondHalf.length;

        trend = secondHalfAvg > firstHalfAvg * 1.5 ? 'slowing' :
            secondHalfAvg < firstHalfAvg * 0.7 ? 'quickening' : 'stable';
    }

    return {
        labels,
        datasets,
        statistics: {
            overallAvgMinutes: Math.round(overallAvg * 10) / 10,
            senderStats,
            trend,
            totalResponses: allResponses.length
        }
    };
}

/**
 * Format minutes to human-readable string
 */
export function formatDuration(minutes) {
    if (minutes < 1) return 'less than a minute';
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours < 24) {
        return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
    }
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
}
