/**
 * First/Last Message Analysis Module
 * Analyzes who typically starts and ends conversations each day
 */

/**
 * Analyze first and last message patterns
 * @param {Array} messages - Array of message objects
 * @returns {Object} First/last message analysis
 */
export function analyzeFirstLast(messages) {
    if (!messages || messages.length === 0) {
        return {
            firstMessage: {},
            lastMessage: {},
            morningPerson: null,
            nightOwl: null
        };
    }

    const senders = [...new Set(messages.map(m => m.sender))];

    // Group messages by date
    const messagesByDate = {};
    messages.forEach(msg => {
        const date = new Date(msg.timestamp).toISOString().split('T')[0];
        if (!messagesByDate[date]) {
            messagesByDate[date] = [];
        }
        messagesByDate[date].push(msg);
    });

    // Sort messages within each day
    Object.keys(messagesByDate).forEach(date => {
        messagesByDate[date].sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );
    });

    // Count who sends first/last message each day
    const firstCounts = {};
    const lastCounts = {};
    senders.forEach(sender => {
        firstCounts[sender] = 0;
        lastCounts[sender] = 0;
    });

    const dates = Object.keys(messagesByDate);
    dates.forEach(date => {
        const dayMessages = messagesByDate[date];
        if (dayMessages.length > 0) {
            const firstSender = dayMessages[0].sender;
            const lastSender = dayMessages[dayMessages.length - 1].sender;

            if (firstCounts[firstSender] !== undefined) {
                firstCounts[firstSender]++;
            }
            if (lastCounts[lastSender] !== undefined) {
                lastCounts[lastSender]++;
            }
        }
    });

    // Calculate percentages
    const totalDays = dates.length;
    const firstMessage = {};
    const lastMessage = {};

    senders.forEach(sender => {
        firstMessage[sender] = {
            count: firstCounts[sender],
            percent: Math.round((firstCounts[sender] / totalDays) * 100)
        };
        lastMessage[sender] = {
            count: lastCounts[sender],
            percent: Math.round((lastCounts[sender] / totalDays) * 100)
        };
    });

    // Determine who is the "morning person" and "night owl"
    let morningPerson = null;
    let nightOwl = null;
    let maxFirst = 0;
    let maxLast = 0;

    senders.forEach(sender => {
        if (firstCounts[sender] > maxFirst) {
            maxFirst = firstCounts[sender];
            morningPerson = sender;
        }
        if (lastCounts[sender] > maxLast) {
            maxLast = lastCounts[sender];
            nightOwl = sender;
        }
    });

    // Early bird analysis (first message before 9 AM)
    const earlyBirdCounts = {};
    senders.forEach(sender => {
        earlyBirdCounts[sender] = 0;
    });

    dates.forEach(date => {
        const dayMessages = messagesByDate[date];
        if (dayMessages.length > 0) {
            const firstMsg = dayMessages[0];
            const hour = new Date(firstMsg.timestamp).getHours();
            if (hour < 9 && earlyBirdCounts[firstMsg.sender] !== undefined) {
                earlyBirdCounts[firstMsg.sender]++;
            }
        }
    });

    // Late night analysis (last message after 11 PM)
    const lateNightCounts = {};
    senders.forEach(sender => {
        lateNightCounts[sender] = 0;
    });

    dates.forEach(date => {
        const dayMessages = messagesByDate[date];
        if (dayMessages.length > 0) {
            const lastMsg = dayMessages[dayMessages.length - 1];
            const hour = new Date(lastMsg.timestamp).getHours();
            if (hour >= 23 && lateNightCounts[lastMsg.sender] !== undefined) {
                lateNightCounts[lastMsg.sender]++;
            }
        }
    });

    return {
        firstMessage,
        lastMessage,
        morningPerson,
        nightOwl,
        totalDays,
        earlyBirdCounts,
        lateNightCounts
    };
}
