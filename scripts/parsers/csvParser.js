/**
 * CSV Chat Parser
 * Parses generic CSV files with timestamp, sender, message_text columns
 * 
 * Flexible column name matching:
 * - timestamp: timestamp, date, time, datetime, created_at
 * - sender: sender, from, author, user, name, participant
 * - message: message, text, content, body, message_text
 */

/**
 * Parse CSV chat file
 * @param {string} content - Raw file content
 * @returns {Object} Parsed messages with metadata
 */
export function parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
        throw new Error('CSV file appears to be empty or has no data rows.');
    }

    // Parse header
    const header = parseCSVLine(lines[0]);
    const columnMap = mapColumns(header);

    if (!columnMap.timestamp || !columnMap.sender || !columnMap.message) {
        throw new Error(
            'CSV file must have columns for timestamp, sender, and message. ' +
            'Found columns: ' + header.join(', ')
        );
    }

    // Parse data rows
    const messages = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        if (values.length < Math.max(columnMap.timestamp, columnMap.sender, columnMap.message) + 1) {
            continue; // Skip incomplete rows
        }

        const timestampStr = values[columnMap.timestamp];
        const sender = values[columnMap.sender];
        const text = values[columnMap.message];

        // Skip empty messages
        if (!sender || !text || !timestampStr) continue;

        const timestamp = parseTimestamp(timestampStr);

        if (timestamp) {
            messages.push({
                timestamp,
                sender: sender.trim(),
                text: text.trim()
            });
        }
    }

    if (messages.length === 0) {
        throw new Error('No valid messages found in CSV file. Please check the file format.');
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
 * Parse a single CSV line, handling quoted values
 * @param {string} line - CSV line
 * @returns {string[]} Array of values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                // Toggle quote mode
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

/**
 * Map column names to indices
 * @param {string[]} header - Header row values
 * @returns {Object} Column index mapping
 */
function mapColumns(header) {
    const timestampNames = ['timestamp', 'date', 'time', 'datetime', 'created_at', 'date_time', 'sent_at'];
    const senderNames = ['sender', 'from', 'author', 'user', 'name', 'participant', 'from_user', 'username'];
    const messageNames = ['message', 'text', 'content', 'body', 'message_text', 'msg', 'message_content'];

    const lowerHeader = header.map(h => h.toLowerCase().trim());

    return {
        timestamp: findColumnIndex(lowerHeader, timestampNames),
        sender: findColumnIndex(lowerHeader, senderNames),
        message: findColumnIndex(lowerHeader, messageNames)
    };
}

/**
 * Find column index by matching against possible names
 * @param {string[]} header - Lowercase header values
 * @param {string[]} possibleNames - Possible column names
 * @returns {number|null} Column index or null if not found
 */
function findColumnIndex(header, possibleNames) {
    for (const name of possibleNames) {
        const index = header.indexOf(name);
        if (index !== -1) return index;
    }
    return null;
}

/**
 * Parse timestamp string into Date object
 * @param {string} str - Timestamp string
 * @returns {Date|null}
 */
function parseTimestamp(str) {
    // Try native parsing first
    const native = new Date(str);
    if (!isNaN(native.getTime())) {
        return native;
    }

    // Try common formats
    const formats = [
        // YYYY-MM-DD HH:MM:SS
        /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):?(\d{2})?$/,
        // DD/MM/YYYY HH:MM:SS
        /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):?(\d{2})?$/,
        // MM/DD/YYYY HH:MM:SS
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):?(\d{2})?$/,
    ];

    for (const format of formats) {
        const match = str.match(format);
        if (match) {
            // This is a simplified approach - actual format detection would need more logic
            return new Date(str);
        }
    }

    return null;
}
