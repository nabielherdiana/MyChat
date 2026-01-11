/**
 * Conversation Streaks Module
 * Analyzes consecutive days of chatting
 */

/**
 * Analyze conversation streaks
 * @param {Array} messages - Array of message objects
 * @returns {Object} Streak analysis results
 */
export function analyzeStreaks(messages) {
    if (!messages || messages.length === 0) {
        return {
            longestStreak: 0,
            currentStreak: 0,
            totalActiveDays: 0,
            streakHistory: []
        };
    }

    // Get unique dates (normalized to day only)
    const activeDates = new Set();
    messages.forEach(msg => {
        const date = new Date(msg.timestamp);
        const dateStr = date.toISOString().split('T')[0];
        activeDates.add(dateStr);
    });

    // Sort dates
    const sortedDates = [...activeDates].sort();
    const totalActiveDays = sortedDates.length;

    if (totalActiveDays === 0) {
        return {
            longestStreak: 0,
            currentStreak: 0,
            totalActiveDays: 0,
            streakHistory: []
        };
    }

    // Calculate streaks
    const streaks = [];
    let currentStreak = 1;
    let streakStart = sortedDates[0];

    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Consecutive day
            currentStreak++;
        } else {
            // Streak broken
            streaks.push({
                start: streakStart,
                end: sortedDates[i - 1],
                length: currentStreak
            });
            currentStreak = 1;
            streakStart = sortedDates[i];
        }
    }

    // Don't forget the last streak
    streaks.push({
        start: streakStart,
        end: sortedDates[sortedDates.length - 1],
        length: currentStreak
    });

    // Find longest streak
    const longestStreak = Math.max(...streaks.map(s => s.length));
    const longestStreakInfo = streaks.find(s => s.length === longestStreak);

    // Check if current streak is still active (last message was today or yesterday)
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);
    const daysSinceLastMessage = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

    const isStreakActive = daysSinceLastMessage <= 1;
    const currentStreakValue = isStreakActive ? streaks[streaks.length - 1].length : 0;

    // Calculate average gap between conversations
    let totalGaps = 0;
    let gapCount = 0;
    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
            totalGaps += diffDays;
            gapCount++;
        }
    }
    const avgGap = gapCount > 0 ? (totalGaps / gapCount).toFixed(1) : 0;

    // Calculate conversation frequency
    const firstDate = new Date(sortedDates[0]);
    const lastDateEnd = new Date(sortedDates[sortedDates.length - 1]);
    const totalSpanDays = Math.round((lastDateEnd - firstDate) / (1000 * 60 * 60 * 24)) + 1;
    const activeDayPercent = Math.round((totalActiveDays / totalSpanDays) * 100);

    return {
        longestStreak,
        longestStreakInfo,
        currentStreak: currentStreakValue,
        isStreakActive,
        totalActiveDays,
        totalSpanDays,
        activeDayPercent,
        avgGapDays: parseFloat(avgGap),
        streakHistory: streaks.filter(s => s.length >= 3) // Only show significant streaks
    };
}
