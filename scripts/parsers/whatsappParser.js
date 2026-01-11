/**
 * WhatsApp Chat Parser
 * Parses WhatsApp exported .txt files
 * 
 * Supports multiple date formats:
 * - 1/1/24, 10:00 AM - Alice: message
 * - [1/1/24, 10:00 AM] Alice: message
 * - 01-01-2024 10:00 - Alice: message
 * - 1/1/24, 10:00 - Alice: message (24h format)
 */

/**
 * Parse WhatsApp chat export
 * @param {string} content - Raw file content
 * @returns {Object} Parsed messages with metadata
 */
export function parseWhatsApp(content) {
    const lines = content.split('\n');
    const messages = [];

    // Multiple regex patterns for different WhatsApp export formats
    const patterns = [
        // Format: 1/1/24, 10:00 AM - Sender: Message
        /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s*[AP]M)?)\s*[-–]\s*([^:]+):\s*(.*)$/i,
        // Format: [1/1/24, 10:00:00 AM] Sender: Message
        /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.*)$/i,
        // Format: 01-01-2024 10:00 - Sender: Message
        /^(\d{1,2}-\d{1,2}-\d{2,4})\s+(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?)\s*[-–]\s*([^:]+):\s*(.*)$/i,
    ];

    let currentMessage = null;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        let matched = false;

        for (const pattern of patterns) {
            const match = trimmedLine.match(pattern);
            if (match) {
                // Save previous message if exists
                if (currentMessage) {
                    messages.push(currentMessage);
                }

                const [, dateStr, timeStr, sender, text] = match;
                const timestamp = parseDateTime(dateStr, timeStr);

                // Skip system messages
                if (isSystemMessage(sender, text)) {
                    currentMessage = null;
                } else {
                    currentMessage = {
                        timestamp,
                        sender: sender.trim(),
                        text: text.trim()
                    };
                }

                matched = true;
                break;
            }
        }

        // If no pattern matched and we have a current message, this is a continuation
        if (!matched && currentMessage) {
            currentMessage.text += '\n' + trimmedLine;
        }
    }

    // Don't forget the last message
    if (currentMessage) {
        messages.push(currentMessage);
    }

    if (messages.length === 0) {
        throw new Error('No valid messages found in WhatsApp export. Please check the file format.');
    }

    // Sort by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);

    // Generate metadata
    const senders = [...new Set(messages.map(m => m.sender))];
    const timestamps = messages.map(m => m.timestamp);

    return {
        messages,
        metadata: {
            totalMessages: messages.length,
            participants: senders,
            dateRange: {
                start: new Date(Math.min(...timestamps)),
                end: new Date(Math.max(...timestamps))
            }
        }
    };
}

/**
 * Parse date and time strings into a Date object
 * @param {string} dateStr - Date string
 * @param {string} timeStr - Time string
 * @returns {Date}
 */
function parseDateTime(dateStr, timeStr) {
    // Normalize separators
    const normalizedDate = dateStr.replace(/-/g, '/');
    const parts = normalizedDate.split('/');

    let day, month, year;

    // Handle different date formats
    if (parts[0].length === 4) {
        // YYYY/MM/DD
        [year, month, day] = parts;
    } else if (parts[2] && parts[2].length === 4) {
        // DD/MM/YYYY or MM/DD/YYYY - assume MM/DD/YYYY for WhatsApp
        [month, day, year] = parts;
    } else {
        // DD/MM/YY or MM/DD/YY - assume MM/DD/YY for WhatsApp
        [month, day, year] = parts;
        year = parseInt(year) < 50 ? '20' + year : '19' + year;
    }

    // Parse time
    let hours, minutes, seconds = 0;
    const timeParts = timeStr.replace(/[:.]/g, ':').split(':');
    hours = parseInt(timeParts[0]);
    minutes = parseInt(timeParts[1]);
    if (timeParts[2]) {
        seconds = parseInt(timeParts[2]);
    }

    // Handle AM/PM
    const isPM = /PM/i.test(timeStr);
    const isAM = /AM/i.test(timeStr);

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hours,
        minutes,
        seconds
    );
}

/**
 * Check if a message is a system message (not from a user)
 * @param {string} sender - Sender name
 * @param {string} text - Message text
 * @returns {boolean}
 */
function isSystemMessage(sender, text) {
    const systemIndicators = [
        'created group',
        'added you',
        'changed the subject',
        'changed this group',
        'left the group',
        'removed',
        'security code changed',
        'messages and calls are end-to-end encrypted',
        'you deleted this message',
        'this message was deleted',
        'media omitted',
        '<Media omitted>',
        'missed voice call',
        'missed video call',
        'joined using this group'
    ];

    const lowerText = text.toLowerCase();
    const lowerSender = sender.toLowerCase();

    // Check sender name for system indicators
    if (lowerSender.includes('system') || lowerSender === '') {
        return true;
    }

    // Check message content
    return systemIndicators.some(indicator => lowerText.includes(indicator.toLowerCase()));
}
