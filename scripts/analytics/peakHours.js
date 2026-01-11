/**
 * Peak Hours Analysis Module
 * Analyzes when conversations happen most
 */

/**
 * Analyze peak activity hours
 * @param {Array} messages - Array of message objects
 * @returns {Object} Peak hours analysis with heatmap data
 */
export function analyzePeakHours(messages) {
    if (!messages || messages.length === 0) {
        return {
            heatmapData: [],
            peakHour: null,
            peakDay: null,
            perSender: {}
        };
    }

    // Initialize hour x day matrix (7 days x 24 hours)
    const dayNamesEN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNamesID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const heatmap = {};
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);

    // Per sender activity
    const senders = [...new Set(messages.map(m => m.sender))];
    const senderHours = {};
    senders.forEach(sender => {
        senderHours[sender] = new Array(24).fill(0);
    });

    // Initialize heatmap
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const key = `${day}-${hour}`;
            heatmap[key] = 0;
        }
    }

    // Count messages per hour and day
    messages.forEach(msg => {
        const date = new Date(msg.timestamp);
        const hour = date.getHours();
        const day = date.getDay();

        const key = `${day}-${hour}`;
        heatmap[key]++;
        hourCounts[hour]++;
        dayCounts[day]++;

        if (senderHours[msg.sender]) {
            senderHours[msg.sender][hour]++;
        }
    });

    // Convert to heatmap array format
    const heatmapData = [];
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const key = `${day}-${hour}`;
            heatmapData.push({
                day,
                dayNameEN: dayNamesEN[day],
                dayNameID: dayNamesID[day],
                hour,
                count: heatmap[key]
            });
        }
    }

    // Find peak hour and day
    const peakHourIndex = hourCounts.indexOf(Math.max(...hourCounts));
    const peakDayIndex = dayCounts.indexOf(Math.max(...dayCounts));

    // Find peak hour per sender
    const perSender = {};
    senders.forEach(sender => {
        const hours = senderHours[sender];
        const peakHour = hours.indexOf(Math.max(...hours));
        perSender[sender] = {
            peakHour,
            peakHourLabel: formatHour(peakHour),
            hourDistribution: hours
        };
    });

    // Calculate morning/afternoon/evening/night distribution
    const timeOfDay = {
        pagi: hourCounts.slice(6, 12).reduce((a, b) => a + b, 0),      // 6-11
        siang: hourCounts.slice(12, 17).reduce((a, b) => a + b, 0),    // 12-16
        malam: hourCounts.slice(17, 22).reduce((a, b) => a + b, 0),    // 17-21
        larut: hourCounts.slice(22, 24).reduce((a, b) => a + b, 0) +
            hourCounts.slice(0, 6).reduce((a, b) => a + b, 0)       // 22-5
    };

    const totalTimeOfDay = Object.values(timeOfDay).reduce((a, b) => a + b, 0);
    const timeOfDayPercent = {
        pagi: Math.round((timeOfDay.pagi / totalTimeOfDay) * 100),
        siang: Math.round((timeOfDay.siang / totalTimeOfDay) * 100),
        malam: Math.round((timeOfDay.malam / totalTimeOfDay) * 100),
        larut: Math.round((timeOfDay.larut / totalTimeOfDay) * 100)
    };

    return {
        heatmapData,
        hourCounts,
        dayCounts,
        peakHour: peakHourIndex,
        peakHourLabel: formatHour(peakHourIndex),
        peakDay: peakDayIndex,
        peakDayLabelEN: dayNamesEN[peakDayIndex],
        peakDayLabelID: dayNamesID[peakDayIndex],
        perSender,
        timeOfDay,
        timeOfDayPercent,
        dayNamesEN,
        dayNamesID
    };
}

/**
 * Format hour to readable string
 */
function formatHour(hour) {
    if (hour === 0) return '00:00';
    if (hour === 12) return '12:00';
    return hour < 10 ? `0${hour}:00` : `${hour}:00`;
}
