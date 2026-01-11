/**
 * Message Activity Analysis
 * Calculates message volume over time
 */

/**
 * Analyze message activity over time
 * @param {Array} messages - Array of message objects
 * @returns {Object} Activity data for visualization
 */
export function analyzeMessageActivity(messages) {
    if (!messages || messages.length === 0) {
        return { labels: [], datasets: [] };
    }

    // Determine appropriate time binning based on conversation length
    const startDate = new Date(messages[0].timestamp);
    const endDate = new Date(messages[messages.length - 1].timestamp);
    const durationDays = (endDate - startDate) / (1000 * 60 * 60 * 24);

    let binType = 'day';
    if (durationDays > 365) {
        binType = 'month';
    } else if (durationDays > 60) {
        binType = 'week';
    }

    // Get unique senders
    const senders = [...new Set(messages.map(m => m.sender))].sort();

    // Create bins
    const bins = {};

    for (const msg of messages) {
        const date = new Date(msg.timestamp);
        const binKey = getBinKey(date, binType);

        if (!bins[binKey]) {
            bins[binKey] = {};
            senders.forEach(s => bins[binKey][s] = 0);
            bins[binKey].total = 0;
        }

        bins[binKey][msg.sender]++;
        bins[binKey].total++;
    }

    // Sort bins by date
    const sortedKeys = Object.keys(bins).sort();

    // Prepare chart data
    const labels = sortedKeys.map(key => formatBinLabel(key, binType));

    const datasets = senders.map((sender, index) => ({
        label: sender,
        data: sortedKeys.map(key => bins[key][sender]),
        borderColor: index === 0 ? '#5c7cfa' : '#ff6b6b',
        backgroundColor: index === 0 ? 'rgba(92, 124, 250, 0.1)' : 'rgba(255, 107, 107, 0.1)',
        fill: true,
        tension: 0.3
    }));

    // Calculate statistics
    const totalMessages = messages.length;
    const avgPerBin = totalMessages / sortedKeys.length;

    // Trend analysis
    const firstHalf = sortedKeys.slice(0, Math.floor(sortedKeys.length / 2));
    const secondHalf = sortedKeys.slice(Math.floor(sortedKeys.length / 2));

    const firstHalfTotal = firstHalf.reduce((sum, key) => sum + bins[key].total, 0);
    const secondHalfTotal = secondHalf.reduce((sum, key) => sum + bins[key].total, 0);

    const trend = secondHalfTotal > firstHalfTotal * 1.2 ? 'increasing' :
        secondHalfTotal < firstHalfTotal * 0.8 ? 'decreasing' : 'stable';

    return {
        labels,
        datasets,
        binType,
        statistics: {
            totalMessages,
            avgPerBin: Math.round(avgPerBin * 10) / 10,
            trend,
            firstHalfAvg: Math.round(firstHalfTotal / firstHalf.length * 10) / 10,
            secondHalfAvg: Math.round(secondHalfTotal / secondHalf.length * 10) / 10
        }
    };
}

/**
 * Get bin key for a date
 */
function getBinKey(date, binType) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (binType) {
        case 'month':
            return `${year}-${month}`;
        case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        default:
            return `${year}-${month}-${day}`;
    }
}

/**
 * Format bin key for display
 */
function formatBinLabel(key, binType) {
    const parts = key.split('-');
    switch (binType) {
        case 'month':
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[parseInt(parts[1]) - 1]} ${parts[0]}`;
        case 'week':
            return `${parts[2]}/${parts[1]}`;
        default:
            return `${parts[2]}/${parts[1]}`;
    }
}
