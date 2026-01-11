/**
 * Telegram HTML Parser Module
 * Parses Telegram Desktop HTML export files
 * 
 * Based on Telegram Desktop export CSS structure:
 * - .history - container for all messages
 * - .message.default - each message block
 * - .from_name - sender name
 * - .text - message text
 * - .pull_right.date - timestamp
 */

/**
 * Parse Telegram HTML export content
 * @param {string} content - HTML content from messages.html
 * @returns {Object} Parsed messages and metadata
 */
export function parseTelegramExport(content) {
    const messages = [];
    const participants = new Set();

    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    // Get chat name from header
    const headerEl = doc.querySelector('.page_header .text');
    const chatName = headerEl ? headerEl.textContent.trim() : 'Telegram Chat';

    // Find the history container
    const historyEl = doc.querySelector('.history');

    if (!historyEl) {
        console.log('📱 No .history container found, trying alternative parsing');
        return parseAlternativeFormat(doc);
    }

    // Track current date for messages that don't have date headers
    let currentDate = new Date();
    let lastSender = null;

    // Get all child elements in history
    const children = historyEl.children;

    for (let i = 0; i < children.length; i++) {
        const el = children[i];

        // Check if it's a service message (date divider, notifications, etc.)
        if (el.classList.contains('service')) {
            // Try to extract date from service message
            const bodyText = el.querySelector('.body')?.textContent?.trim() || '';
            const dateFromService = parseDateFromText(bodyText);
            if (dateFromService) {
                currentDate = dateFromService;
            }
            continue;
        }

        // Check if it's a regular message
        if (el.classList.contains('message') && el.classList.contains('default')) {
            const msgData = parseDefaultMessage(el, currentDate, lastSender);
            if (msgData) {
                messages.push(msgData);
                participants.add(msgData.sender);
                lastSender = msgData.sender;

                // Extract date from message if available
                if (msgData.extractedDate) {
                    currentDate = msgData.extractedDate;
                }
            }
        }
    }

    console.log(`📱 Parsed ${messages.length} messages from Telegram HTML`);

    // Sort messages by timestamp
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Build metadata
    const participantArray = Array.from(participants);
    const metadata = {
        format: 'telegram',
        totalMessages: messages.length,
        participants: participantArray,
        chatName: chatName,
        dateRange: messages.length > 0 ? {
            start: messages[0].timestamp,
            end: messages[messages.length - 1].timestamp
        } : null
    };

    return { messages, metadata };
}

/**
 * Parse a .message.default element
 */
function parseDefaultMessage(el, currentDate, lastSender) {
    try {
        // Get sender name - if not present, use lastSender (for joined messages)
        const fromNameEl = el.querySelector('.from_name');
        let sender = fromNameEl ? fromNameEl.textContent.trim() : lastSender;

        // Clean up sender name (remove any trailing details)
        if (sender) {
            sender = sender.split('\n')[0].trim();
        }

        // If still no sender, skip
        if (!sender) {
            return null;
        }

        // Get message text
        const textEl = el.querySelector('.text');
        let text = textEl ? textEl.textContent.trim() : '';

        // If no text, check for media
        if (!text) {
            const mediaEl = el.querySelector('.media .title, .media .description');
            if (mediaEl) {
                text = '[Media: ' + mediaEl.textContent.trim() + ']';
            } else {
                text = '[Media]';
            }
        }

        // Get timestamp
        let timestamp = new Date(currentDate);
        let extractedDate = null;

        // Look for date in pull_right class or date attribute
        const dateEl = el.querySelector('.pull_right.date, .date, [title]');

        if (dateEl) {
            // First try the title attribute (has full datetime)
            const titleAttr = dateEl.getAttribute('title');
            if (titleAttr) {
                const parsed = parseFullDateTime(titleAttr);
                if (parsed) {
                    timestamp = parsed;
                    extractedDate = new Date(parsed);
                    extractedDate.setHours(0, 0, 0, 0);
                }
            } else {
                // Parse time from text content (e.g., "01:24")
                const timeText = dateEl.textContent.trim();
                const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                    timestamp = new Date(currentDate);
                    timestamp.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
                }
            }
        }

        return {
            timestamp: timestamp.toISOString(),
            sender: sender,
            text: text,
            extractedDate: extractedDate
        };
    } catch (error) {
        console.warn('Error parsing Telegram message:', error);
        return null;
    }
}

/**
 * Parse date from service message text
 * @param {string} text - Text like "3 August 2025"
 */
function parseDateFromText(text) {
    const months = {
        'january': 0, 'jan': 0,
        'february': 1, 'feb': 1, 'februari': 1,
        'march': 2, 'mar': 2, 'maret': 2,
        'april': 3, 'apr': 3,
        'may': 4, 'mei': 4,
        'june': 5, 'jun': 5, 'juni': 5,
        'july': 6, 'jul': 6, 'juli': 6,
        'august': 7, 'aug': 7, 'agustus': 7,
        'september': 8, 'sep': 8, 'sept': 8,
        'october': 9, 'oct': 9, 'oktober': 9,
        'november': 10, 'nov': 10,
        'december': 11, 'dec': 11, 'desember': 11
    };

    // Match "3 August 2025" pattern
    const match = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (match) {
        const [, day, monthStr, year] = match;
        const month = months[monthStr.toLowerCase()];
        if (month !== undefined) {
            return new Date(parseInt(year), month, parseInt(day));
        }
    }

    return null;
}

/**
 * Parse full datetime from title attribute
 * Formats: "11.01.2026 09:32:45" or "11 Jan 2026 09:32"
 */
function parseFullDateTime(dateStr) {
    if (!dateStr) return null;

    // Try standard Date parse first
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date;
    }

    // Try DD.MM.YYYY HH:mm:ss format
    const dotFormat = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):?(\d{2})?/);
    if (dotFormat) {
        const [, day, month, year, hour, minute, second = '0'] = dotFormat;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day),
            parseInt(hour), parseInt(minute), parseInt(second));
    }

    // Try DD Month YYYY HH:mm format
    const textMonth = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})\s+(\d{2}):(\d{2})/);
    if (textMonth) {
        const [, day, monthStr, year, hour, minute] = textMonth;
        const monthNum = getMonthNumber(monthStr);
        if (monthNum !== null) {
            return new Date(parseInt(year), monthNum, parseInt(day),
                parseInt(hour), parseInt(minute), 0);
        }
    }

    return null;
}

/**
 * Get month number from name
 */
function getMonthNumber(monthStr) {
    const months = {
        'january': 0, 'jan': 0, 'januari': 0,
        'february': 1, 'feb': 1, 'februari': 1,
        'march': 2, 'mar': 2, 'maret': 2,
        'april': 3, 'apr': 3,
        'may': 4, 'mei': 4,
        'june': 5, 'jun': 5, 'juni': 5,
        'july': 6, 'jul': 6, 'juli': 6,
        'august': 7, 'aug': 7, 'agustus': 7,
        'september': 8, 'sep': 8, 'sept': 8,
        'october': 9, 'oct': 9, 'oktober': 9,
        'november': 10, 'nov': 10,
        'december': 11, 'dec': 11, 'desember': 11
    };
    return months[monthStr.toLowerCase()] ?? null;
}

/**
 * Alternative parsing for different HTML structures
 */
function parseAlternativeFormat(doc) {
    const messages = [];
    const participants = new Set();

    // Try to find messages by looking for common patterns
    const allDivs = doc.querySelectorAll('div');
    let currentDate = new Date();

    allDivs.forEach(div => {
        // Look for date headers
        const text = div.textContent.trim();
        const dateMatch = parseDateFromText(text);
        if (dateMatch && text.length < 30) {
            currentDate = dateMatch;
            return;
        }

        // Look for message-like structures
        const fromName = div.querySelector('.from_name');
        const textEl = div.querySelector('.text');

        if (fromName && textEl) {
            const sender = fromName.textContent.trim().split('\n')[0];
            const msgText = textEl.textContent.trim();

            if (sender && msgText) {
                messages.push({
                    timestamp: currentDate.toISOString(),
                    sender: sender,
                    text: msgText
                });
                participants.add(sender);
            }
        }
    });

    return {
        messages,
        metadata: {
            format: 'telegram',
            totalMessages: messages.length,
            participants: Array.from(participants),
            dateRange: messages.length > 0 ? {
                start: messages[0].timestamp,
                end: messages[messages.length - 1].timestamp
            } : null
        }
    };
}

/**
 * Check if content is Telegram HTML export
 */
export function isTelegramFormat(content) {
    // Check for Telegram-specific CSS classes
    return content.includes('page_wrap') ||
        content.includes('message default') ||
        content.includes('class="history"') ||
        content.includes('from_name') ||
        content.includes('Telegram');
}

/**
 * Merge multiple Telegram parsed results
 */
export function mergeTelegramResults(results) {
    const allMessages = [];
    const allParticipants = new Set();
    let chatName = 'Telegram Chat';

    results.forEach(result => {
        if (result && result.messages) {
            allMessages.push(...result.messages);
            result.metadata?.participants?.forEach(p => allParticipants.add(p));
            if (result.metadata?.chatName && result.metadata.chatName !== 'Telegram Chat') {
                chatName = result.metadata.chatName;
            }
        }
    });

    // Sort all messages by timestamp
    allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    console.log(`📱 Merged ${allMessages.length} total messages from ${results.length} files`);

    const metadata = {
        format: 'telegram',
        totalMessages: allMessages.length,
        participants: Array.from(allParticipants),
        chatName: chatName,
        dateRange: allMessages.length > 0 ? {
            start: allMessages[0].timestamp,
            end: allMessages[allMessages.length - 1].timestamp
        } : null
    };

    return { messages: allMessages, metadata };
}
