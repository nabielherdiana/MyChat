/**
 * Parser Router
 * Detects file type and routes to appropriate parser
 */

import { parseWhatsApp } from './whatsappParser.js';
import { parseCSV } from './csvParser.js';
import { parseTelegramExport, isTelegramFormat } from './telegramParser.js';

/**
 * Detect file type from content and extension
 * @param {string} content - File content
 * @param {string} filename - Original filename
 * @returns {'whatsapp' | 'csv' | 'telegram' | 'unknown'}
 */
function detectFileType(content, filename) {
    const extension = filename.toLowerCase().split('.').pop();

    // Check by extension first
    if (extension === 'csv') {
        return 'csv';
    }

    // Check for Telegram HTML format
    if (extension === 'html' || extension === 'htm') {
        if (isTelegramFormat(content)) {
            return 'telegram';
        }
    }

    // For .txt files, check if it matches WhatsApp format
    if (extension === 'txt') {
        // WhatsApp patterns: date/time - sender: message
        // Multiple formats supported
        const whatsappPatterns = [
            /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}[:.]\d{2}/m,  // US/EU format
            /^\[\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}[:.]\d{2}/m, // Bracketed format
            /^\d{1,2}-\d{1,2}-\d{2,4}\s+\d{1,2}[:.]\d{2}/m,       // Dash format
        ];

        for (const pattern of whatsappPatterns) {
            if (pattern.test(content)) {
                return 'whatsapp';
            }
        }
    }

    return 'unknown';
}

/**
 * Parse chat file and return standardized schema
 * @param {string} content - File content
 * @param {string} filename - Original filename
 * @returns {Object} Standardized chat data
 */
export function parseFile(content, filename) {
    const fileType = detectFileType(content, filename);

    switch (fileType) {
        case 'whatsapp':
            return parseWhatsApp(content);
        case 'csv':
            return parseCSV(content);
        case 'telegram':
            return parseTelegramExport(content);
        default:
            throw new Error('Unsupported file format. Please upload a WhatsApp export (.txt), Telegram export (.html), or CSV file.');
    }
}

/**
 * Anonymize participant names
 * @param {Array} messages - Array of message objects
 * @returns {Object} Messages with name mapping (keeping original names)
 */
export function anonymizeParticipants(messages) {
    const uniqueSenders = [...new Set(messages.map(m => m.sender))];

    // Keep original names - no anonymization
    const nameMap = {};
    uniqueSenders.forEach((name) => {
        nameMap[name] = name; // Keep original name
    });

    return {
        messages: messages,
        nameMap
    };
}
