/**
 * Summary & Interpretation Engine
 * Generates plain-language summaries for each analysis module
 * Supports bilingual output (EN/ID)
 */

import { formatDuration } from '../analytics/responseTiming.js';
import { getRhythmEmoji } from '../analytics/conversationRhythm.js';

/**
 * Generate interpretation for message activity analysis
 * @param {Object} data - Activity analysis data
 * @param {string} lang - Language code ('en' or 'id')
 * @returns {string} Plain-language interpretation
 */
export function interpretActivity(data, lang = 'en') {
    const { statistics } = data;
    if (!statistics) return '';

    const { trend, avgPerBin, firstHalfAvg, secondHalfAvg } = statistics;

    const templates = {
        en: {
            increasing: `Message frequency increased over time. In the earlier period, there were about ${firstHalfAvg} messages per period, while later this grew to about ${secondHalfAvg}.`,
            decreasing: `Message frequency decreased over time. Earlier, there were about ${firstHalfAvg} messages per period, but this dropped to about ${secondHalfAvg} later on.`,
            stable: `Message frequency remained relatively consistent throughout, averaging about ${avgPerBin} messages per period.`
        },
        id: {
            increasing: `Frekuensi pesan meningkat seiring waktu. Pada periode awal, ada sekitar ${firstHalfAvg} pesan per periode, kemudian meningkat menjadi sekitar ${secondHalfAvg}.`,
            decreasing: `Frekuensi pesan menurun seiring waktu. Awalnya ada sekitar ${firstHalfAvg} pesan per periode, kemudian turun menjadi sekitar ${secondHalfAvg}.`,
            stable: `Frekuensi pesan relatif konsisten, rata-rata sekitar ${avgPerBin} pesan per periode.`
        }
    };

    return templates[lang][trend] || templates[lang].stable;
}

/**
 * Generate interpretation for response timing analysis
 * @param {Object} data - Response timing analysis data
 * @param {string} lang - Language code ('en' or 'id')
 * @returns {string} Plain-language interpretation
 */
export function interpretResponseTiming(data, lang = 'en') {
    const { statistics } = data;
    if (!statistics) return '';

    const { overallAvgMinutes, trend, firstHalfAvg, secondHalfAvg } = statistics;
    const avgFormatted = formatDuration(overallAvgMinutes);

    const templates = {
        en: {
            slowing: `Response times became longer over time. Earlier, the average response time was about ${formatDuration(firstHalfAvg)}, but later it grew to about ${formatDuration(secondHalfAvg)}.`,
            quickening: `Response times became shorter over time. Earlier, the average was about ${formatDuration(firstHalfAvg)}, improving to about ${formatDuration(secondHalfAvg)} later.`,
            stable: `Response times remained fairly consistent, averaging about ${avgFormatted}.`
        },
        id: {
            slowing: `Waktu respons menjadi lebih lama seiring waktu. Awalnya rata-rata sekitar ${formatDuration(firstHalfAvg)}, kemudian menjadi sekitar ${formatDuration(secondHalfAvg)}.`,
            quickening: `Waktu respons menjadi lebih cepat seiring waktu. Awalnya rata-rata sekitar ${formatDuration(firstHalfAvg)}, kemudian membaik menjadi sekitar ${formatDuration(secondHalfAvg)}.`,
            stable: `Waktu respons cukup konsisten, rata-rata sekitar ${avgFormatted}.`
        }
    };

    return templates[lang][trend] || templates[lang].stable;
}

/**
 * Generate interpretation for initiation balance analysis
 * @param {Object} data - Initiation balance analysis data
 * @param {string} lang - Language code ('en' or 'id')
 * @returns {string} Plain-language interpretation
 */
export function interpretInitiation(data, lang = 'en') {
    const { statistics } = data;
    if (!statistics) return '';

    const { balance, moreInitiator, percentages, total } = statistics;
    const morePercent = percentages[moreInitiator];

    const templates = {
        en: {
            balanced: `Conversation initiations were fairly balanced between both participants, with each starting conversations about equally often across ${total} conversation starts.`,
            slightly_unbalanced: `${moreInitiator} initiated conversations more often (about ${morePercent}% of the time), though both participants started conversations.`,
            unbalanced: `${moreInitiator} initiated conversations significantly more often, starting about ${morePercent}% of the ${total} conversation threads.`
        },
        id: {
            balanced: `Inisiasi percakapan cukup seimbang antara kedua peserta, masing-masing memulai percakapan dengan frekuensi yang hampir sama dari ${total} percakapan.`,
            slightly_unbalanced: `${moreInitiator} lebih sering memulai percakapan (sekitar ${morePercent}% dari keseluruhan), meskipun kedua peserta sama-sama pernah memulai.`,
            unbalanced: `${moreInitiator} jauh lebih sering memulai percakapan, memulai sekitar ${morePercent}% dari ${total} percakapan.`
        }
    };

    return templates[lang][balance] || templates[lang].balanced;
}

/**
 * Generate interpretation for language usage analysis
 * @param {Object} data - Language usage analysis data
 * @param {string} lang - Language code ('en' or 'id')
 * @returns {string} Plain-language interpretation
 */
export function interpretLanguageUsage(data, lang = 'en') {
    const { statistics, topWords } = data;
    if (!statistics || !topWords) return '';

    const { uniqueWords, totalWords } = statistics;
    const topWordsList = topWords.slice(0, 5).map(w => w.word).join(', ');

    const templates = {
        en: `The conversation used ${uniqueWords} unique words across ${totalWords} total words. The most frequently used words were: ${topWordsList}.`,
        id: `Percakapan menggunakan ${uniqueWords} kata unik dari total ${totalWords} kata. Kata-kata yang paling sering digunakan adalah: ${topWordsList}.`
    };

    return templates[lang];
}

/**
 * Generate interpretation for lexical diversity analysis
 * @param {Object} data - Lexical diversity analysis data
 * @param {string} lang - Language code ('en' or 'id')
 * @returns {string} Plain-language interpretation
 */
export function interpretDiversity(data, lang = 'en') {
    const { statistics } = data;
    if (!statistics) return '';

    const { overallTTR, trend, firstHalfAvg, secondHalfAvg } = statistics;

    // TTR interpretation: higher = more diverse, lower = more repetitive
    const diversityLevel = overallTTR > 0.6 ? 'high' : overallTTR > 0.4 ? 'moderate' : 'low';

    const templates = {
        en: {
            increasing: `Vocabulary variety increased over time. Earlier messages had a diversity score of ${firstHalfAvg}, which grew to ${secondHalfAvg}. This suggests the conversation used more varied language as it progressed.`,
            decreasing: `Vocabulary variety decreased over time. Earlier messages had a diversity score of ${firstHalfAvg}, which dropped to ${secondHalfAvg}. This suggests the conversation became more repetitive in word choice.`,
            stable: `Vocabulary variety remained consistent throughout (overall score: ${overallTTR}). The conversation maintained a ${diversityLevel} level of word variety.`
        },
        id: {
            increasing: `Variasi kosakata meningkat seiring waktu. Pesan awal memiliki skor keragaman ${firstHalfAvg}, yang meningkat menjadi ${secondHalfAvg}. Ini menunjukkan percakapan menggunakan bahasa yang lebih bervariasi.`,
            decreasing: `Variasi kosakata menurun seiring waktu. Pesan awal memiliki skor keragaman ${firstHalfAvg}, yang turun menjadi ${secondHalfAvg}. Ini menunjukkan percakapan menjadi lebih repetitif.`,
            stable: `Variasi kosakata tetap konsisten (skor keseluruhan: ${overallTTR}). Percakapan mempertahankan tingkat variasi kata yang ${diversityLevel === 'high' ? 'tinggi' : diversityLevel === 'moderate' ? 'sedang' : 'rendah'}.`
        }
    };

    return templates[lang][trend] || templates[lang].stable;
}

/**
 * Generate interpretation for conversation rhythm analysis
 * @param {Object} data - Rhythm analysis data
 * @param {string} lang - Language code ('en' or 'id')
 * @returns {string} Plain-language interpretation
 */
export function interpretRhythm(data, lang = 'en') {
    const { rhythm, details } = data;
    if (!rhythm || !details) return '';

    const emoji = getRhythmEmoji(rhythm);

    const templates = {
        en: {
            stable: `${emoji} The conversation had a stable rhythm with consistent gaps between messages (average: ${formatDuration(details.avgGapMinutes)}).`,
            slowing: `${emoji} The conversation rhythm slowed down over time. Early messages had gaps of about ${formatDuration(details.firstPhaseAvgGap)}, while later gaps grew to about ${formatDuration(details.lastPhaseAvgGap)}.`,
            accelerating: `${emoji} The conversation rhythm sped up over time, with messages becoming more frequent as the conversation progressed.`,
            irregular: `${emoji} The conversation had an irregular rhythm with varying gaps between responses. Some exchanges were quick, while others had longer pauses.`,
            variable: `${emoji} The conversation rhythm varied throughout, with some periods of active exchange and others with slower responses.`,
            insufficient_data: `Not enough messages to analyze conversation rhythm.`
        },
        id: {
            stable: `${emoji} Percakapan memiliki ritme yang stabil dengan jeda yang konsisten antar pesan (rata-rata: ${formatDuration(details.avgGapMinutes)}).`,
            slowing: `${emoji} Ritme percakapan melambat seiring waktu. Pesan awal memiliki jeda sekitar ${formatDuration(details.firstPhaseAvgGap)}, sementara jeda kemudian menjadi sekitar ${formatDuration(details.lastPhaseAvgGap)}.`,
            accelerating: `${emoji} Ritme percakapan menjadi lebih cepat seiring waktu, dengan pesan yang semakin sering.`,
            irregular: `${emoji} Percakapan memiliki ritme yang tidak teratur dengan jeda yang bervariasi. Beberapa pertukaran cepat, sementara yang lain memiliki jeda lebih lama.`,
            variable: `${emoji} Ritme percakapan bervariasi, dengan beberapa periode pertukaran aktif dan yang lain dengan respons lebih lambat.`,
            insufficient_data: `Tidak cukup pesan untuk menganalisis ritme percakapan.`
        }
    };

    return templates[lang][rhythm] || templates[lang].stable;
}

/**
 * Get rhythm label for display
 * @param {string} rhythm - Rhythm type
 * @param {string} lang - Language code
 * @returns {string} Localized rhythm label
 */
export function getRhythmLabel(rhythm, lang = 'en') {
    const labels = {
        en: {
            stable: 'Stable',
            slowing: 'Slowing',
            accelerating: 'Accelerating',
            irregular: 'Irregular',
            variable: 'Variable',
            insufficient_data: 'Insufficient Data'
        },
        id: {
            stable: 'Stabil',
            slowing: 'Melambat',
            accelerating: 'Mempercepat',
            irregular: 'Tidak Teratur',
            variable: 'Bervariasi',
            insufficient_data: 'Data Tidak Cukup'
        }
    };

    return labels[lang][rhythm] || rhythm;
}

/**
 * Generate reflection summary covering all phases
 * @param {Object} allData - All analysis data
 * @param {string} lang - Language code
 * @returns {string} Reflection summary paragraph
 */
export function generateReflectionSummary(allData, lang = 'en') {
    const { activity, response, initiation, rhythm } = allData;

    if (!activity?.statistics || !response?.statistics || !rhythm) {
        return lang === 'en'
            ? 'Not enough data to generate a complete reflection summary.'
            : 'Data tidak cukup untuk menghasilkan ringkasan refleksi yang lengkap.';
    }

    const activityTrend = activity.statistics.trend;
    const responseTrend = response.statistics.trend;
    const rhythmType = rhythm.rhythm;
    const balance = initiation?.statistics?.balance || 'balanced';

    const templates = {
        en: {
            default: `This conversation showed a ${rhythmType} pattern overall. Message frequency ${activityTrend === 'increasing' ? 'increased' : activityTrend === 'decreasing' ? 'decreased' : 'remained stable'} over time, while response times ${responseTrend === 'slowing' ? 'became longer' : responseTrend === 'quickening' ? 'became shorter' : 'stayed consistent'}. The initiation pattern was ${balance === 'balanced' ? 'fairly balanced' : balance === 'slightly_unbalanced' ? 'slightly uneven' : 'noticeably one-sided'}. These patterns reflect the observable flow of the conversation — they describe what happened, not why.`
        },
        id: {
            default: `Percakapan ini menunjukkan pola yang ${rhythmType === 'stable' ? 'stabil' : rhythmType === 'slowing' ? 'melambat' : rhythmType === 'irregular' ? 'tidak teratur' : 'bervariasi'} secara keseluruhan. Frekuensi pesan ${activityTrend === 'increasing' ? 'meningkat' : activityTrend === 'decreasing' ? 'menurun' : 'tetap stabil'} seiring waktu, sementara waktu respons ${responseTrend === 'slowing' ? 'menjadi lebih lama' : responseTrend === 'quickening' ? 'menjadi lebih cepat' : 'tetap konsisten'}. Pola inisiasi percakapan ${balance === 'balanced' ? 'cukup seimbang' : balance === 'slightly_unbalanced' ? 'sedikit tidak merata' : 'cenderung satu arah'}. Pola-pola ini menggambarkan alur percakapan yang teramati — menjelaskan apa yang terjadi, bukan mengapa.`
        }
    };

    return templates[lang].default;
}
