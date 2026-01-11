/**
 * Message Length Analysis Module
 * Analyzes message length patterns over time
 */

/**
 * Analyze message length trends
 * @param {Array} messages - Array of message objects
 * @returns {Object} Message length analysis
 */
export function analyzeMessageLength(messages) {
    if (!messages || messages.length === 0) {
        return {
            avgLength: 0,
            trend: 'stable',
            perSender: {},
            labels: [],
            datasets: []
        };
    }

    const senders = [...new Set(messages.map(m => m.sender))];

    // Calculate overall stats
    const lengths = messages.map(m => (m.text || '').length);
    const avgLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);

    // Per sender stats
    const perSender = {};
    senders.forEach(sender => {
        const senderMsgs = messages.filter(m => m.sender === sender);
        const senderLengths = senderMsgs.map(m => (m.text || '').length);
        const avg = senderLengths.length > 0
            ? Math.round(senderLengths.reduce((a, b) => a + b, 0) / senderLengths.length)
            : 0;

        perSender[sender] = {
            avgLength: avg,
            minLength: Math.min(...senderLengths),
            maxLength: Math.max(...senderLengths),
            totalMessages: senderMsgs.length
        };
    });

    // Group messages by time period for trend
    const sortedMessages = [...messages].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );

    const firstDate = new Date(sortedMessages[0].timestamp);
    const lastDate = new Date(sortedMessages[sortedMessages.length - 1].timestamp);
    const spanDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;

    // Determine binning (week or month)
    let binSize, binLabel;
    if (spanDays <= 60) {
        binSize = 7; // Weekly
        binLabel = 'week';
    } else {
        binSize = 30; // Monthly
        binLabel = 'month';
    }

    // Create bins
    const bins = {};
    const senderBins = {};
    senders.forEach(sender => {
        senderBins[sender] = {};
    });

    sortedMessages.forEach(msg => {
        const msgDate = new Date(msg.timestamp);
        const binIndex = Math.floor((msgDate - firstDate) / (1000 * 60 * 60 * 24 * binSize));
        const length = (msg.text || '').length;

        if (!bins[binIndex]) {
            bins[binIndex] = { total: 0, count: 0 };
        }
        bins[binIndex].total += length;
        bins[binIndex].count++;

        if (!senderBins[msg.sender][binIndex]) {
            senderBins[msg.sender][binIndex] = { total: 0, count: 0 };
        }
        senderBins[msg.sender][binIndex].total += length;
        senderBins[msg.sender][binIndex].count++;
    });

    // Create chart data
    const binKeys = Object.keys(bins).map(Number).sort((a, b) => a - b);
    const labels = binKeys.map((bin, i) => {
        if (binLabel === 'week') {
            return `Minggu ${i + 1}`;
        }
        return `Bulan ${i + 1}`;
    });

    // Overall average per bin
    const overallData = binKeys.map(bin =>
        Math.round(bins[bin].total / bins[bin].count)
    );

    // Per sender data
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    const datasets = senders.map((sender, index) => {
        const data = binKeys.map(bin => {
            if (senderBins[sender][bin]) {
                return Math.round(senderBins[sender][bin].total / senderBins[sender][bin].count);
            }
            return null;
        });

        return {
            label: sender,
            data,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            tension: 0.3,
            fill: false
        };
    });

    // Determine trend
    let trend = 'stable';
    if (overallData.length >= 3) {
        const firstHalf = overallData.slice(0, Math.floor(overallData.length / 2));
        const secondHalf = overallData.slice(Math.floor(overallData.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        const change = ((secondAvg - firstAvg) / firstAvg) * 100;

        if (change > 15) {
            trend = 'increasing';
        } else if (change < -15) {
            trend = 'decreasing';
        }
    }

    // Message type breakdown (short, medium, long)
    const shortMessages = lengths.filter(l => l <= 20).length;
    const mediumMessages = lengths.filter(l => l > 20 && l <= 100).length;
    const longMessages = lengths.filter(l => l > 100).length;

    const typeBreakdown = {
        short: Math.round((shortMessages / lengths.length) * 100),
        medium: Math.round((mediumMessages / lengths.length) * 100),
        long: Math.round((longMessages / lengths.length) * 100)
    };

    return {
        avgLength,
        trend,
        perSender,
        labels,
        datasets,
        typeBreakdown,
        binLabel
    };
}
