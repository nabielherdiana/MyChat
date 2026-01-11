/**
 * Emoji Analysis Module
 * Analyzes emoji usage patterns per participant
 */

// Common emoji regex pattern
const emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/gi;

/**
 * Extract emojis from text
 * @param {string} text - Text to extract emojis from
 * @returns {Array} Array of emojis found
 */
function extractEmojis(text) {
    if (!text) return [];
    const matches = text.match(emojiRegex);
    return matches || [];
}

/**
 * Analyze emoji usage in messages
 * @param {Array} messages - Array of message objects
 * @returns {Object} Emoji analysis results
 */
export function analyzeEmojiUsage(messages) {
    if (!messages || messages.length === 0) {
        return {
            totalEmojis: 0,
            perSender: {},
            topEmojis: [],
            emojiPerMessage: 0,
            hasEmojis: false
        };
    }

    const emojiCounts = {};
    const senderEmojis = {};
    let totalEmojis = 0;
    let messagesWithEmojis = 0;

    // Get unique senders
    const senders = [...new Set(messages.map(m => m.sender))];
    senders.forEach(sender => {
        senderEmojis[sender] = {
            count: 0,
            emojis: {},
            topEmojis: []
        };
    });

    // Count emojis
    messages.forEach(msg => {
        const emojis = extractEmojis(msg.text);

        if (emojis.length > 0) {
            messagesWithEmojis++;
            totalEmojis += emojis.length;

            emojis.forEach(emoji => {
                // Overall count
                emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;

                // Per sender count
                if (senderEmojis[msg.sender]) {
                    senderEmojis[msg.sender].count++;
                    senderEmojis[msg.sender].emojis[emoji] =
                        (senderEmojis[msg.sender].emojis[emoji] || 0) + 1;
                }
            });
        }
    });

    // Get top emojis overall
    const topEmojis = Object.entries(emojiCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([emoji, count]) => ({ emoji, count }));

    // Get top emojis per sender
    senders.forEach(sender => {
        const senderData = senderEmojis[sender];
        senderData.topEmojis = Object.entries(senderData.emojis)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([emoji, count]) => ({ emoji, count }));
    });

    return {
        totalEmojis,
        messagesWithEmojis,
        percentWithEmojis: Math.round((messagesWithEmojis / messages.length) * 100),
        emojiPerMessage: (totalEmojis / messages.length).toFixed(2),
        topEmojis,
        perSender: senderEmojis,
        hasEmojis: totalEmojis > 0
    };
}
