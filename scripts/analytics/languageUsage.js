/**
 * Language Usage Analysis
 * Analyzes word frequency without sentiment or intent inference
 */

// Common stopwords in English and Indonesian
const STOPWORDS = new Set([
    // English
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
    'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose',
    'when', 'where', 'why', 'how', 'if', 'then', 'than', 'so', 'as', 'just', 'also',
    'not', 'no', 'yes', 'ok', 'okay', 'oh', 'ah', 'um', 'uh', 'like', 'just', 'really',
    'very', 'too', 'all', 'any', 'some', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'another', 'such', 'only', 'own', 'same', 'can', 'now', 'out', 'get', 'got',
    'about', 'after', 'before', 'up', 'down', 'over', 'under', 'again', 'here', 'there',
    'from', 'into', 'through', 'during', 'until', 'while', 'because', 'although',
    'im', "i'm", "it's", "don't", "doesn't", "didn't", "can't", "won't", "wouldn't",
    "couldn't", "shouldn't", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't",
    'll', 've', 're', 'd', 's', 't', 'm',
    // Indonesian
    'dan', 'atau', 'tapi', 'di', 'ke', 'dari', 'untuk', 'dengan', 'yang', 'ini', 'itu',
    'ada', 'adalah', 'akan', 'bisa', 'sudah', 'belum', 'juga', 'saja', 'hanya', 'masih',
    'aku', 'kamu', 'dia', 'kita', 'kami', 'mereka', 'saya', 'anda', 'nya', 'mu', 'ku',
    'apa', 'siapa', 'mana', 'kapan', 'kenapa', 'mengapa', 'bagaimana', 'gimana',
    'ya', 'yah', 'iya', 'nggak', 'ngga', 'gak', 'ga', 'enggak', 'tidak', 'bukan',
    'dong', 'deh', 'sih', 'kok', 'kan', 'lah', 'lo', 'loh', 'nih', 'tuh', 'wkwk', 'haha',
    'oh', 'eh', 'ah', 'uh', 'yg', 'dgn', 'utk', 'jd', 'jdi', 'lg', 'lagi', 'udah', 'udh',
    'mau', 'mo', 'tau', 'tahu', 'juga', 'kalo', 'kalau', 'pas', 'banget', 'bgt', 'aja',
    'gue', 'gw', 'lo', 'lu', 'emang', 'emg', 'sm', 'sama', 'bener', 'bnr'
]);

/**
 * Analyze word frequency in messages
 * @param {Array} messages - Array of message objects
 * @param {Object} options - Analysis options
 * @returns {Object} Word frequency data
 */
export function analyzeLanguageUsage(messages, options = {}) {
    const { topN = 20, filterBySender = null } = options;

    if (!messages || messages.length === 0) {
        return { wordCloud: [], topWords: [], statistics: {} };
    }

    // Filter by sender if specified
    const filteredMessages = filterBySender
        ? messages.filter(m => m.sender === filterBySender)
        : messages;

    // Count word frequencies
    const wordFreq = {};
    let totalWords = 0;

    for (const msg of filteredMessages) {
        const words = extractWords(msg.text);
        totalWords += words.length;

        for (const word of words) {
            if (!STOPWORDS.has(word) && word.length > 1) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        }
    }

    // Sort by frequency
    const sortedWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1]);

    // Prepare word cloud data
    const maxFreq = sortedWords.length > 0 ? sortedWords[0][1] : 1;
    const wordCloud = sortedWords.slice(0, 50).map(([word, count]) => [
        word,
        Math.max(12, Math.round((count / maxFreq) * 60)) // Size between 12-60
    ]);

    // Top N words for bar chart
    const topWords = sortedWords.slice(0, topN).map(([word, count]) => ({
        word,
        count,
        percentage: Math.round(count / totalWords * 1000) / 10
    }));

    // Calculate per-sender statistics
    const senders = [...new Set(messages.map(m => m.sender))].sort();
    const senderStats = {};

    senders.forEach(sender => {
        const senderMessages = messages.filter(m => m.sender === sender);
        const senderWordFreq = {};
        let senderTotalWords = 0;

        for (const msg of senderMessages) {
            const words = extractWords(msg.text);
            senderTotalWords += words.length;
            for (const word of words) {
                if (!STOPWORDS.has(word) && word.length > 1) {
                    senderWordFreq[word] = (senderWordFreq[word] || 0) + 1;
                }
            }
        }

        const senderTopWords = Object.entries(senderWordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        senderStats[sender] = {
            totalWords: senderTotalWords,
            avgWordsPerMessage: Math.round(senderTotalWords / senderMessages.length * 10) / 10,
            topWords: senderTopWords.map(([word]) => word)
        };
    });

    return {
        wordCloud,
        topWords,
        statistics: {
            uniqueWords: Object.keys(wordFreq).length,
            totalWords,
            senderStats
        }
    };
}

/**
 * Extract words from text
 * @param {string} text - Message text
 * @returns {string[]} Array of lowercase words
 */
function extractWords(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s']/g, ' ')  // Remove punctuation except apostrophe
        .split(/\s+/)
        .filter(word => word.length > 0);
}

/**
 * Get top words for a specific time phase
 * @param {Array} messages - Array of message objects
 * @param {string} phase - 'early', 'middle', or 'late'
 * @returns {Array} Top words for that phase
 */
export function getPhaseTopWords(messages, phase) {
    const thirdLength = Math.floor(messages.length / 3);
    let phaseMessages;

    switch (phase) {
        case 'early':
            phaseMessages = messages.slice(0, thirdLength);
            break;
        case 'middle':
            phaseMessages = messages.slice(thirdLength, thirdLength * 2);
            break;
        case 'late':
            phaseMessages = messages.slice(thirdLength * 2);
            break;
        default:
            phaseMessages = messages;
    }

    const result = analyzeLanguageUsage(phaseMessages, { topN: 10 });
    return result.topWords;
}
