/**
 * MyChat — Main Application
 * Human-Centered Communication Explorer
 */

// Import modules
import { parseFile, anonymizeParticipants } from './parsers/parserRouter.js';
import { parseTelegramExport, mergeTelegramResults } from './parsers/telegramParser.js';
import { isZipFile, extractZip, getFileType } from './parsers/zipHandler.js';
import { analyzeMessageActivity } from './analytics/messageActivity.js';
import { analyzeResponseTiming } from './analytics/responseTiming.js';
import { analyzeInitiationBalance } from './analytics/initiationBalance.js';
import { analyzeLanguageUsage } from './analytics/languageUsage.js';
import { analyzeConversationRhythm } from './analytics/conversationRhythm.js';
import { analyzeEmojiUsage } from './analytics/emojiAnalysis.js';
import { analyzePeakHours } from './analytics/peakHours.js';
import { analyzeStreaks } from './analytics/streakAnalysis.js';
import { analyzeMessageLength } from './analytics/messageLength.js';
import { analyzeFirstLast } from './analytics/firstLastMessage.js';
import {
    createLineChart,
    createDoughnutChart,
    createWordCloud,
    createTopWordsChart,
    destroyAllCharts
} from './visualization/charts.js';
import {
    t,
    getCurrentLanguage,
    applyTranslations
} from './i18n/translations.js';
import { generateSummaryCards, downloadCard } from './components/summaryCards.js';

// Application State
let currentFile = null;
let parsedData = null; // Contains original messages and metadata
let analysisResults = null;
let currentLang = getCurrentLanguage();
let allParticipants = [];
let excludedParticipants = new Set();
let isReanalyzing = false;

// DOM Elements object (populated on init)
const DOM = {
    uploadArea: null,
    fileInput: null,
    fileInfo: null,
    fileName: null,
    removeFileBtn: null,
    analyzeBtn: null,
    loadingSection: null,
    resultsSection: null,
    newAnalysisBtn: null
};

// Initialize application
function init() {
    try {
        console.log("🚀 Initializing MyChat...");

        // Populate DOM elements
        DOM.uploadArea = document.getElementById('uploadArea');
        DOM.fileInput = document.getElementById('fileInput');
        DOM.fileInfo = document.getElementById('fileInfo');
        DOM.fileName = document.getElementById('fileName');
        DOM.removeFileBtn = document.getElementById('removeFile');
        DOM.analyzeBtn = document.getElementById('analyzeBtn');
        DOM.loadingSection = document.getElementById('loadingSection');
        DOM.resultsSection = document.getElementById('resultsSection');
        DOM.newAnalysisBtn = document.getElementById('newAnalysisBtn');

        // Verify critical elements
        if (!DOM.uploadArea || !DOM.resultsSection) {
            throw new Error("Critical DOM elements missing");
        }

        loadThemePreference();
        applyTranslations(currentLang);
        setupEventListeners();

        console.log("✅ Initialization complete");
    } catch (error) {
        console.error("Initialization Failed:", error);
        alert("UI Initialization Failed: " + error.message);
    }
}

// Load theme preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('ghosting-analytics-theme') || 'dark';
    setTheme(savedTheme);
}

// Chart Colors Palette
const CHART_COLORS = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#84cc16', // Lime
    '#06b6d4', // Cyan
    '#d946ef', // Fuchsia
    '#64748b', // Slate
    '#a855f7', // Purple
    '#22c55e', // Green
    '#eab308', // Yellow
    '#f43f5e', // Rose
    '#0ea5e9', // Sky
    '#8b5cf6', // Violet
    '#db2777', // Pink-700
];

// Set theme
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    localStorage.setItem('ghosting-analytics-theme', theme);
}

// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });

    // Language toggle
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLang = btn.dataset.lang;
            applyTranslations(currentLang);
            if (analysisResults) renderInterpretations();
        });
    });

    // File upload - click
    DOM.uploadArea.addEventListener('click', () => DOM.fileInput.click());

    // File upload - drag and drop
    DOM.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.uploadArea.classList.add('dragover');
    });

    DOM.uploadArea.addEventListener('dragleave', () => {
        DOM.uploadArea.classList.remove('dragover');
    });

    DOM.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    DOM.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    DOM.removeFileBtn.addEventListener('click', resetFileSelection);
    DOM.analyzeBtn.addEventListener('click', analyzeConversation);
    DOM.newAnalysisBtn.addEventListener('click', resetApplication);
}

// Handle file selection
function handleFileSelect(file) {
    const validExtensions = ['.txt', '.csv', '.html', '.htm', '.zip'];
    const extension = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(extension)) {
        showError(t('errorUnsupportedFormat', currentLang));
        return;
    }

    currentFile = file;
    DOM.fileName.textContent = file.name;
    DOM.fileInfo.hidden = false;
    DOM.uploadArea.hidden = true;
    DOM.analyzeBtn.disabled = false;
}

// Reset file selection
function resetFileSelection() {
    currentFile = null;
    DOM.fileInput.value = '';
    DOM.fileInfo.hidden = true;
    DOM.uploadArea.hidden = false;
    DOM.analyzeBtn.disabled = true;
}

/**
 * Filter and Analyze (Core Logic)
 * Separated from file loading to allow re-running with filters
 */
let currentFilteredMessages = [];

function runAnalysis() {
    if (!parsedData) return;

    // Filter messages based on excludedParticipants AND Date Range
    const startInput = document.getElementById('startDate').value;
    const endInput = document.getElementById('endDate').value;
    const startTime = startInput ? new Date(startInput).getTime() : 0;
    const endTime = endInput ? new Date(endInput).setHours(23, 59, 59, 999) : Date.now();

    currentFilteredMessages = parsedData.messages.filter(m => {
        if (excludedParticipants.has(m.sender)) return false;
        const time = new Date(m.timestamp).getTime();
        return time >= startTime && time <= endTime;
    });

    const filteredMessages = currentFilteredMessages;

    // Run all analyses on filtered messages
    analysisResults = {
        activity: analyzeMessageActivity(filteredMessages),
        response: analyzeResponseTiming(filteredMessages),
        initiation: analyzeInitiationBalance(filteredMessages),
        language: analyzeLanguageUsage(filteredMessages),
        rhythm: analyzeConversationRhythm(filteredMessages),
        emoji: analyzeEmojiUsage(filteredMessages),
        peakHours: analyzePeakHours(filteredMessages),
        streaks: analyzeStreaks(filteredMessages),
        messageLength: analyzeMessageLength(filteredMessages),
        firstLast: analyzeFirstLast(filteredMessages)
    };

    renderResults();
    DOM.loadingSection.hidden = true;
    DOM.resultsSection.hidden = false;

    if (!isReanalyzing) {
        DOM.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    isReanalyzing = false;

    // Update active count in filter header
    const activeCount = allParticipants.length - excludedParticipants.size;
    const badge = document.getElementById('activeCount');
    if (badge) badge.textContent = `${activeCount} active`;
}

// Analyze conversation
async function analyzeConversation() {
    if (!currentFile && !parsedData) return; // Need file or existing data

    DOM.loadingSection.hidden = false;
    document.querySelector('.upload-section').hidden = true;

    try {
        // Only parse if we don't have data yet or if it's a fresh start
        if (!parsedData || !isReanalyzing) {
            let parsed;
            const extension = currentFile.name.split('.').pop().toLowerCase();

            if (extension === 'zip') {
                parsed = await handleZipFile(currentFile);
            } else {
                const content = await readFileContent(currentFile);
                parsed = parseFile(content, currentFile.name);
            }

            const { messages } = anonymizeParticipants(parsed.messages);
            parsedData = {
                messages,
                metadata: { ...parsed.metadata }
            };

            // Initialize participants list from ALL senders
            const senders = new Set();
            messages.forEach(m => { if (m.sender) senders.add(m.sender); });
            allParticipants = Array.from(senders).sort();
            excludedParticipants = new Set(); // Reset exclusions

            // Render filter UI
            renderParticipantFilter();

            // Initialize Date Filter
            const timestamps = messages.map(m => new Date(m.timestamp).getTime()).filter(t => !isNaN(t));
            if (timestamps.length > 0) {
                const minDate = new Date(Math.min(...timestamps));
                const maxDate = new Date(Math.max(...timestamps));

                // Format YYYY-MM-DD for input[type=date]
                const toInputFormat = d => d.toISOString().split('T')[0];

                document.getElementById('startDate').value = toInputFormat(minDate);
                document.getElementById('endDate').value = toInputFormat(maxDate);

                // Set min/max attributes
                document.getElementById('startDate').min = toInputFormat(minDate);
                document.getElementById('startDate').max = toInputFormat(maxDate);
                document.getElementById('endDate').min = toInputFormat(minDate);
                document.getElementById('endDate').max = toInputFormat(maxDate);
            }
        }

        runAnalysis();

    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message || t('errorParsing', currentLang));
        DOM.loadingSection.hidden = true;
        document.querySelector('.upload-section').hidden = false;
    }
}

// Handle ZIP file extraction and parsing
async function handleZipFile(file) {
    console.log('📦 Starting ZIP extraction for:', file.name);
    const extractedFiles = await extractZip(file);
    console.log('📦 Extracted files:', extractedFiles.map(f => f.name));

    if (extractedFiles.length === 0) {
        throw new Error('No supported files found in ZIP archive');
    }

    // Check what type of files we have
    const fileTypes = extractedFiles.map(f => getFileType(f.name));
    console.log('📦 File types detected:', fileTypes);

    const hasTelegram = fileTypes.includes('telegram');
    const hasWhatsApp = fileTypes.includes('whatsapp');
    const hasCSV = fileTypes.includes('csv');

    // If Telegram (multiple HTML files), merge them
    if (hasTelegram) {
        console.log('📦 Processing as Telegram export');
        const telegramFiles = extractedFiles.filter(f => getFileType(f.name) === 'telegram');
        console.log('📦 Telegram files to parse:', telegramFiles.length);
        const results = telegramFiles.map(f => {
            const result = parseTelegramExport(f.content);
            console.log(`📦 Parsed ${f.name}: ${result.messages.length} messages`);
            return result;
        });
        const merged = mergeTelegramResults(results);
        console.log('📦 Total merged messages:', merged.messages.length);

        if (merged.messages.length === 0) {
            throw new Error('No messages found in Telegram export. The HTML format might not be recognized.');
        }
        return merged;
    }

    // If WhatsApp, parse all .txt files and merge
    if (hasWhatsApp) {
        console.log('📦 Processing as WhatsApp export');
        const waFiles = extractedFiles.filter(f => getFileType(f.name) === 'whatsapp');
        if (waFiles.length === 1) {
            return parseFile(waFiles[0].content, waFiles[0].name);
        }
        // Multiple WhatsApp files - use the largest one
        const largest = waFiles.reduce((a, b) => a.content.length > b.content.length ? a : b);
        return parseFile(largest.content, largest.name);
    }

    // If CSV, use the first one
    if (hasCSV) {
        console.log('📦 Processing as CSV export');
        const csvFile = extractedFiles.find(f => getFileType(f.name) === 'csv');
        return parseFile(csvFile.content, csvFile.name);
    }

    // Fallback: use the first file
    const firstFile = extractedFiles[0];
    console.log('📦 Fallback: using first file', firstFile.name);
    return parseFile(firstFile.content, firstFile.name);
}

// Read file content
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Render all results
function renderResults() {
    destroyAllCharts();
    renderMetadata();
    renderEmoji();
    renderPeakHours();
    renderStreaks();
    renderActivityChart();
    renderFirstLast();
    renderInitiationChart();
    renderMessageLength();
    renderLanguageCharts();
    renderLanguageCharts();
    // renderRhythm(); // Removed: Handled by renderInterpretations now
    renderInterpretations();
    renderSummaryCards();
}

// Render summary cards
function renderSummaryCards() {
    const container = document.getElementById('summaryCardsContainer');
    if (container && currentFilteredMessages) {
        container.innerHTML = generateSummaryCards(analysisResults, currentFilteredMessages);
    }
}

// Render metadata
// Render metadata
function renderMetadata() {
    if (!currentFilteredMessages || currentFilteredMessages.length === 0) {
        document.getElementById('totalMessages').textContent = '0';
        document.getElementById('dateRange').textContent = '-';
        document.getElementById('participantsInfo').textContent = '-';
        return;
    }

    // 1. Total Messages
    document.getElementById('totalMessages').textContent = currentFilteredMessages.length.toLocaleString();

    // 2. Date Range (Assumes messages are sorted by timestamp, which they typically are from parsers)
    const startMsg = currentFilteredMessages[0];
    const endMsg = currentFilteredMessages[currentFilteredMessages.length - 1];

    const startDate = new Date(startMsg.timestamp).toLocaleDateString();
    const endDate = new Date(endMsg.timestamp).toLocaleDateString();
    document.getElementById('dateRange').textContent = `${startDate} - ${endDate}`;

    // 3. Active Participants (from filtered set)
    const participants = getActiveParticipants(currentFilteredMessages);
    document.getElementById('participantsInfo').textContent = participants.map(truncateName).join(', ');
}

// Render emoji analysis
function renderEmoji() {
    const { hasEmojis, perSender } = analysisResults.emoji;
    const container = document.getElementById('emojiStats');

    if (!hasEmojis) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center;">${t('noEmojis', currentLang)}</p>`;
        return;
    }

    // Get ALL active emoji users (exclude those with 0 emojis)
    const topUsers = Object.entries(perSender)
        .filter(([, data]) => data.count > 0)
        .sort(([, a], [, b]) => b.count - a.count);

    let html = '';
    topUsers.forEach(([name, data]) => {
        const topEmojis = data.topEmojis.map(e => `<span class="emoji-item">${e.emoji}</span>`).join('');
        html += `
            <div class="emoji-person">
                <div class="emoji-person-name">${truncateName(name)}</div>
                <div class="emoji-count">${data.count}</div>
                <div class="emoji-top">${topEmojis || 'No emojis'}</div>
            </div>
        `;
    });

    // Remove "others" count since we show everyone
    container.innerHTML = html;
}

// Render peak hours
function renderPeakHours() {
    const { heatmapData, peakHourLabel, peakDayLabelEN, peakDayLabelID, dayNamesEN, dayNamesID, timeOfDayPercent } = analysisResults.peakHours;
    const container = document.getElementById('heatmapContainer');
    const summary = document.getElementById('peakSummary');

    // Choose day names based on language
    const dayNames = currentLang === 'id' ? dayNamesID : dayNamesEN;
    const peakDayLabel = currentLang === 'id' ? peakDayLabelID : peakDayLabelEN;
    const eveningLabel = currentLang === 'id' ? 'Chat Malam' : 'Evening Chats';

    // Calculate max for color scaling
    const maxCount = Math.max(...heatmapData.map(d => d.count));

    // Build heatmap HTML
    let html = '<div class="heatmap-label"></div>';
    // Hour labels
    for (let h = 0; h < 24; h += 3) {
        html += `<div class="heatmap-hour">${h}</div>`;
        if (h + 1 < 24) html += '<div class="heatmap-hour"></div>';
        if (h + 2 < 24) html += '<div class="heatmap-hour"></div>';
    }

    // Day rows
    for (let day = 0; day < 7; day++) {
        html += `<div class="heatmap-label">${dayNames[day].substring(0, 3)}</div>`;
        for (let hour = 0; hour < 24; hour++) {
            const data = heatmapData.find(d => d.day === day && d.hour === hour);
            const count = data ? data.count : 0;
            const level = maxCount > 0 ? Math.ceil((count / maxCount) * 5) : 0;
            html += `<div class="heatmap-cell level-${level}" title="${count} messages"></div>`;
        }
    }
    container.innerHTML = html;

    // Summary
    summary.innerHTML = `
        <div class="peak-stat">
            <span class="peak-stat-value">${peakHourLabel}</span>
            <span class="peak-stat-label">${currentLang === 'id' ? 'Jam Puncak' : 'Peak Hour'}</span>
        </div>
        <div class="peak-stat">
            <span class="peak-stat-value">${peakDayLabel}</span>
            <span class="peak-stat-label">${currentLang === 'id' ? 'Hari Favorit' : 'Peak Day'}</span>
        </div>
        <div class="peak-stat">
            <span class="peak-stat-value">${timeOfDayPercent.malam}%</span>
            <span class="peak-stat-label">${eveningLabel}</span>
        </div>
    `;
}

// Render streaks
function renderStreaks() {
    const { longestStreak, currentStreak, totalActiveDays } = analysisResults.streaks;
    document.getElementById('longestStreak').textContent = longestStreak;
    document.getElementById('currentStreak').textContent = currentStreak;
    document.getElementById('activeDays').textContent = totalActiveDays;
}

// Render activity chart
function renderActivityChart() {
    const { labels, datasets } = analysisResults.activity;

    // Show top 20 instead of 5 (effectively all for most groups)
    const filteredDatasets = filterTopDatasets(datasets, 20).map((ds, index) => ({
        ...ds,
        borderColor: CHART_COLORS[index % CHART_COLORS.length],
        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
        fill: false, // FORCE LINE CHART (No Area)
        tension: 0.3
    }));

    createLineChart('activityChart', { labels, datasets: filteredDatasets });
}

// Render first/last message
function renderFirstLast() {
    const { firstMessage, lastMessage, morningPerson, nightOwl } = analysisResults.firstLast;
    const container = document.getElementById('firstLastDisplay');

    const morningPercent = morningPerson && firstMessage[morningPerson] ? firstMessage[morningPerson].percent : 0;
    const nightPercent = nightOwl && lastMessage[nightOwl] ? lastMessage[nightOwl].percent : 0;

    container.innerHTML = `
        <div class="first-last-item">
            <div class="first-last-icon">🌅</div>
            <div class="first-last-title">${t('firstMessage', currentLang)}</div>
            <div class="first-last-winner">${morningPerson || '-'}</div>
            <div class="first-last-percent">${morningPercent}% of days</div>
        </div>
        <div class="first-last-item">
            <div class="first-last-icon">🌙</div>
            <div class="first-last-title">${t('lastMessage', currentLang)}</div>
            <div class="first-last-winner">${nightOwl || '-'}</div>
            <div class="first-last-percent">${nightPercent}% of days</div>
        </div>
    `;
}

// Render initiation chart
function renderInitiationChart() {
    const { labels, data, backgroundColor } = analysisResults.initiation;

    // Show ALL participants, sorted by value
    const items = labels.map((label, i) => ({
        label: truncateName(label), // APPLIED TRUNCATION HERE
        value: data[i],
        // Use global palette to ensure distinct colors if default backgroundColors run out
        color: CHART_COLORS[i % CHART_COLORS.length]
    })).sort((a, b) => b.value - a.value);

    // Create final arrays
    const finalLabels = items.map(i => i.label);
    const finalData = items.map(i => i.value);
    const finalColors = items.map(i => i.color);

    createDoughnutChart('initiationChart', { labels: finalLabels, data: finalData, backgroundColor: finalColors });
}

// --- Helper Functions ---

/**
 * Get active participants who actually sent messages
 */
function getActiveParticipants(messages) {
    const counts = {};
    messages.forEach(m => {
        if (m.sender) {
            counts[m.sender] = (counts[m.sender] || 0) + 1;
        }
    });
    return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([name]) => name);
}

/**
 * Filter datasets to keep only top N by total value
 */
function filterTopDatasets(datasets, limit) {
    if (datasets.length <= limit) return datasets;

    return datasets
        .map(ds => ({
            ...ds,
            total: ds.data.reduce((a, b) => a + (Number(b) || 0), 0)
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit)
        .map(({ total, ...ds }) => ds);
}

/**
 * Truncate long names - NOW CHANGED TO FIRST WORD ONLY
 */
function truncateName(name) {
    if (!name) return 'Unknown';
    // Return only the first word to save space
    return name.split(' ')[0];
}

// Render message length
function renderMessageLength() {
    const { perSender, labels, datasets } = analysisResults.messageLength;
    const container = document.getElementById('lengthStats');

    // Show ALL for stats list
    const topSenders = Object.entries(perSender)
        .sort(([, a], [, b]) => b.avgLength - a.avgLength);

    let html = '';
    topSenders.forEach(([name, data]) => {
        html += `
            <div class="length-person">
                <div class="length-person-name">${truncateName(name)}</div>
                <div class="length-avg">${data.avgLength}</div>
                <span class="length-unit">${t('avgLength', currentLang)}</span>
            </div>
        `;
    });
    container.innerHTML = html;

    // Chart - Show top 20 (or more if needed, but 20 is a safe max for readable lines)
    // We already updated this to 20 in previous step, checking if we need more? 
    // Let's keep 20 for chart legibility, but list shows all.
    const filteredDatasets = filterTopDatasets(datasets, 20).map((ds, index) => ({
        ...ds,
        borderColor: CHART_COLORS[index % CHART_COLORS.length],
        backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
    }));
    createLineChart('lengthChart', { labels, datasets: filteredDatasets });
}

// Render language charts
function renderLanguageCharts() {
    const { wordCloud, topWords } = analysisResults.language;
    createWordCloud('wordCloudCanvas', wordCloud);
    createTopWordsChart('topWordsChart', topWords.slice(0, 15));
    createTopWordsChart('topWordsChart', topWords.slice(0, 15));
}

// --- Participant Filter Logic ---

function renderParticipantFilter() {
    const list = document.getElementById('participantList');
    if (!list) return;

    list.innerHTML = allParticipants.map(p => `
        <label class="participant-checkbox">
            <input type="checkbox" value="${p}" ${excludedParticipants.has(p) ? '' : 'checked'} onchange="handleParticipantToggle(this)">
            <span class="participant-checkbox-label" title="${p}">${p}</span>
        </label>
    `).join('');
}

function toggleFilter() {
    const content = document.getElementById('filterContent');
    const icon = document.querySelector('.filter-toggle-icon');
    content.classList.toggle('open');
    icon.classList.toggle('open');
}

function handleParticipantToggle(checkbox) {
    // Just update UI state, apply happens on button click
    const name = checkbox.value;
    if (checkbox.checked) {
        excludedParticipants.delete(name);
    } else {
        excludedParticipants.add(name);
    }
}

function selectAllParticipants(select) {
    const checkboxes = document.querySelectorAll('#participantList input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = select;
        if (select) excludedParticipants.delete(cb.value);
        else excludedParticipants.add(cb.value);
    });
}

function applyParticipantFilter() {
    // Show loading state immediately
    DOM.loadingSection.hidden = false;
    DOM.resultsSection.hidden = true;

    // updates needs a small timeout to let the UI render the loading screen
    setTimeout(() => {
        isReanalyzing = true;
        analyzeConversation(); // Rerun analysis
    }, 50);
}

// Make global
window.toggleFilter = toggleFilter;
window.handleParticipantToggle = handleParticipantToggle;
window.selectAllParticipants = selectAllParticipants;
window.applyParticipantFilter = applyParticipantFilter;

// Render rhythm
// Render rhythm - DEPRECATED (Moved to renderInterpretations)
// function renderRhythm() { ... }

// Render interpretations
function renderInterpretations() {
    const lang = currentLang;

    // Emoji interpretation
    const emojiData = analysisResults.emoji;
    let emojiText = '';
    if (emojiData.hasEmojis) {
        const names = Object.keys(emojiData.perSender);
        const counts = Object.values(emojiData.perSender).map(v => v.count);
        if (counts[0] > counts[1] * 1.5) {
            emojiText = lang === 'id'
                ? `${names[0]} jelas lebih ekspresif dengan emoji! ${emojiData.percentWithEmojis}% pesan di chat ini ada emojinya.`
                : `${names[0]} is clearly more expressive with emojis! ${emojiData.percentWithEmojis}% of messages contain emojis.`;
        } else if (counts[1] > counts[0] * 1.5) {
            emojiText = lang === 'id'
                ? `${names[1]} yang lebih royal pakai emoji di sini! ${emojiData.percentWithEmojis}% pesan ada emojinya.`
                : `${names[1]} uses more emojis here! ${emojiData.percentWithEmojis}% of messages have emojis.`;
        } else {
            emojiText = lang === 'id'
                ? `Kalian berdua cukup seimbang dalam penggunaan emoji. ${emojiData.percentWithEmojis}% pesan ada emojinya.`
                : `You're both fairly balanced in emoji usage. ${emojiData.percentWithEmojis}% of messages have emojis.`;
        }
    } else {
        emojiText = lang === 'id'
            ? 'Percakapan ini jarang banget pakai emoji. Mungkin kalian lebih suka pakai kata-kata aja!'
            : 'This chat rarely uses emojis. Maybe you both prefer expressing with words!';
    }
    document.getElementById('emojiInterpretation').textContent = emojiText;

    // Peak hours interpretation
    const peakData = analysisResults.peakHours;
    const peakDayName = lang === 'id' ? peakData.peakDayLabelID : peakData.peakDayLabelEN;
    const peakText = lang === 'id'
        ? `Jam paling aktif kalian adalah sekitar ${peakData.peakHourLabel}, dan hari favorit buat ngobrol adalah ${peakDayName}. ${peakData.timeOfDayPercent.malam}% chat terjadi di malam hari.`
        : `You're most active around ${peakData.peakHourLabel}, and your favorite day to chat is ${peakDayName}. ${peakData.timeOfDayPercent.malam}% of chats happen in the evening.`;
    document.getElementById('peakInterpretation').textContent = peakText;

    // Streaks interpretation
    const streakData = analysisResults.streaks;
    let streakText = '';
    if (streakData.longestStreak >= 7) {
        streakText = lang === 'id'
            ? `Wow! Streak terpanjang kalian ${streakData.longestStreak} hari berturut-turut! Itu konsistensi yang keren. Kalian aktif di ${streakData.activeDayPercent}% dari total rentang waktu.`
            : `Wow! Your longest streak was ${streakData.longestStreak} days in a row! That's some solid consistency. You were active on ${streakData.activeDayPercent}% of total days.`;
    } else if (streakData.longestStreak >= 3) {
        streakText = lang === 'id'
            ? `Streak terpanjang kalian ${streakData.longestStreak} hari. Nggak buruk! Kalian aktif di ${streakData.activeDayPercent}% dari total rentang waktu.`
            : `Your longest streak was ${streakData.longestStreak} days. Not bad! You were active on ${streakData.activeDayPercent}% of the total timespan.`;
    } else {
        streakText = lang === 'id'
            ? `Percakapan ini lebih bersifat sesekali aja, nggak setiap hari. Kalian aktif di ${streakData.activeDayPercent}% dari total rentang waktu.`
            : `This conversation was more occasional than daily. You were active on ${streakData.activeDayPercent}% of the total timespan.`;
    }
    document.getElementById('streakInterpretation').textContent = streakText;

    // Activity interpretation
    const activityData = analysisResults.activity;
    let activityText = '';
    if (activityData.trend === 'increasing') {
        activityText = lang === 'id'
            ? 'Volume pesan meningkat seiring waktu. Percakapan kalian makin intens!'
            : 'Message volume increased over time. Your conversation got more intense!';
    } else if (activityData.trend === 'decreasing') {
        activityText = lang === 'id'
            ? 'Volume pesan menurun seiring waktu. Ini bisa berarti banyak hal, tergantung konteksnya.'
            : 'Message volume decreased over time. This could mean many things depending on context.';
    } else {
        activityText = lang === 'id'
            ? 'Volume pesan relatif stabil sepanjang waktu. Konsisten!'
            : 'Message volume stayed relatively stable. Consistent!';
    }
    document.getElementById('activityInterpretation').textContent = activityText;

    // First/Last interpretation
    const flData = analysisResults.firstLast;
    const flText = lang === 'id'
        ? `${flData.morningPerson || 'Seseorang'} biasanya yang memulai hari dengan pesan pertama, sementara ${flData.nightOwl || 'yang lain'} cenderung menutup malam.`
        : `${flData.morningPerson || 'Someone'} usually starts the day with the first message, while ${flData.nightOwl || 'the other'} tends to close the night.`;
    document.getElementById('firstLastInterpretation').textContent = flText;

    // Initiation interpretation  
    const initData = analysisResults.initiation;
    let initText = '';
    if (initData.balance === 'balanced') {
        initText = lang === 'id'
            ? 'Kalian cukup seimbang dalam memulai percakapan. Nggak ada yang dominant!'
            : 'You both initiate conversations fairly equally. No one dominates!';
    } else {
        const dominant = initData.labels[initData.data.indexOf(Math.max(...initData.data))];
        initText = lang === 'id'
            ? `${dominant} lebih sering memulai percakapan. Tapi ingat, ini cuma pola, bukan indikator ketertarikan.`
            : `${dominant} initiates more often. But remember, this is just a pattern, not an interest indicator.`;
    }
    document.getElementById('initiationInterpretation').textContent = initText;

    // Message length interpretation
    const lengthData = analysisResults.messageLength;
    let lengthText = '';
    if (lengthData.trend === 'increasing') {
        lengthText = lang === 'id'
            ? 'Panjang pesan cenderung meningkat. Kalian makin detail dalam berbagi cerita!'
            : 'Message length tends to increase. You got more detailed in sharing stories!';
    } else if (lengthData.trend === 'decreasing') {
        lengthText = lang === 'id'
            ? 'Panjang pesan cenderung menurun. Bisa jadi lebih efisien, atau mungkin lebih sibuk.'
            : 'Message length tends to decrease. Could be more efficient, or perhaps busier.';
    } else {
        lengthText = lang === 'id'
            ? 'Panjang pesan cukup konsisten. Gaya komunikasi kalian stabil!'
            : 'Message length is fairly consistent. Your communication style is stable!';
    }
    document.getElementById('lengthInterpretation').textContent = lengthText;

    // Words interpretation
    const wordData = analysisResults.language;
    const topWord = wordData.topWords[0]?.word || '';
    const wordsText = lang === 'id'
        ? `Kata yang paling sering muncul adalah "${topWord}". Kata-kata favorit biasanya mencerminkan topik atau gaya komunikasi kalian.`
        : `The most common word is "${topWord}". Favorite words often reflect your topics or conversation style.`;
    document.getElementById('wordsInterpretation').textContent = wordsText;

    // Rhythm interpretation
    const rhythmData = analysisResults.rhythm;

    // Configuration for Rhythm Badges (Moved to top of scope if needed, but here is fine)
    const rhythmConfig = {
        stable: { icon: '💚', labelID: 'Stabil & Konsisten', labelEN: 'Steady Flow', class: 'stable' },
        accelerating: { icon: '🔥', labelID: 'Makin Intens', labelEN: 'Heating Up', class: 'accelerating' },
        slowing: { icon: '🧊', labelID: 'Mulai Mendingin', labelEN: 'Cooling Down', class: 'slowing' },
        irregular: { icon: '🎢', labelID: 'On & Off (Putus Nyambung)', labelEN: 'On & Off', class: 'irregular' },
        variable: { icon: '🎲', labelID: 'Susah Ditebak', labelEN: 'Unpredictable', class: 'variable' }
    };

    const config = rhythmConfig[rhythmData.rhythm] || rhythmConfig.stable;
    const badgeLabel = lang === 'id' ? config.labelID : config.labelEN;

    // Render Badge
    const indicatorEl = document.getElementById('rhythmIndicator');
    if (indicatorEl) {
        indicatorEl.innerHTML = `
            <div class="rhythm-badge ${config.class}">
                <span class="rhythm-icon">${config.icon}</span>
                <span class="rhythm-text">${badgeLabel}</span>
            </div>
        `;
    }

    const rhythmTexts = {
        stable: lang === 'id' ? 'Percakapan mengalir dengan ritme yang stabil dan konsisten.' : 'The conversation flows with a stable, consistent rhythm.',
        slowing: lang === 'id' ? 'Ritme percakapan melambat seiring waktu.' : 'The conversation rhythm slowed down over time.',
        accelerating: lang === 'id' ? 'Ritme percakapan makin intens seiring waktu.' : 'The conversation rhythm picked up over time.',
        irregular: lang === 'id' ? 'Percakapan bersifat on-and-off, dengan jeda yang bervariasi.' : 'The conversation is on-and-off, with varying gaps.',
        variable: lang === 'id' ? 'Ritme percakapan nggak terduga dan bervariasi.' : 'The conversation rhythm is unpredictable and varies.'
    };

    // Safely set text content
    const interpretationEl = document.getElementById('rhythmInterpretation');
    if (interpretationEl) {
        interpretationEl.textContent = rhythmTexts[rhythmData.rhythm] || '';
    }

    // Reflection summary
    const reflection = generateReflection(lang);
    const reflectionEl = document.getElementById('reflectionContent');
    if (reflectionEl) {
        reflectionEl.textContent = reflection;
    }
}

// Generate reflection summary
function generateReflection(lang) {
    const streaks = analysisResults.streaks;
    const emoji = analysisResults.emoji;
    const peak = analysisResults.peakHours;
    const activity = analysisResults.activity;

    const peakDay = lang === 'id' ? peak.peakDayLabelID : peak.peakDayLabelEN;

    if (lang === 'id') {
        return `Sepanjang ${streaks.totalActiveDays} hari aktif, kalian bertukar pesan dengan streak terpanjang ${streaks.longestStreak} hari. Waktu favorit kalian untuk ngobrol adalah sekitar ${peak.peakHourLabel} di hari ${peakDay}. ${emoji.hasEmojis ? `Percakapan ini punya ${emoji.percentWithEmojis}% pesan dengan emoji, menunjukkan ekspresi yang cukup hidup.` : 'Kalian lebih memilih mengekspresikan diri lewat kata-kata daripada emoji.'} ${activity.trend === 'increasing' ? 'Volume percakapan meningkat seiring waktu.' : activity.trend === 'decreasing' ? 'Volume percakapan menurun seiring waktu.' : 'Volume percakapan tetap konsisten.'} Ingat, angka-angka ini cuma pola. Yang paling penting adalah konteks dan hubungan nyata kalian.`;
    } else {
        return `Over ${streaks.totalActiveDays} active days, you exchanged messages with a longest streak of ${streaks.longestStreak} days. Your favorite time to chat is around ${peak.peakHourLabel} on ${peakDay}. ${emoji.hasEmojis ? `This conversation has ${emoji.percentWithEmojis}% of messages with emojis, showing lively expression.` : 'You both prefer expressing through words rather than emojis.'} ${activity.trend === 'increasing' ? 'Conversation volume increased over time.' : activity.trend === 'decreasing' ? 'Conversation volume decreased over time.' : 'Conversation volume stayed consistent.'} Remember, these numbers are just patterns. What matters most is your context and real relationship.`;
    }
}

// Reset application
function resetApplication() {
    currentFile = null;
    parsedData = null;
    analysisResults = null;
    resetFileSelection();
    destroyAllCharts();
    document.querySelector('.upload-section').hidden = false;
    DOM.resultsSection.hidden = true;
    DOM.loadingSection.hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show error
function showError(message) {
    alert(message);
}

// Ensure init runs
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
