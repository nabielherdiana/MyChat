/**
 * Summary Card Module - Chat Wrapped
 * Generates shareable summary cards with dual layouts (Story & Post)
 */

/**
 * Generate shareable summary cards HTML
 * @param {Object} analysisResults - All analysis results
 * @param {Array} messages - Original messages array
 * @returns {string} HTML string of the summary section
 */
export function generateSummaryCards(analysisResults, messages) {
    // Get stats
    const participantStats = getParticipantStats(messages);
    const topContributors = participantStats; // Show everyone (up to reasonable limit handled by CSS)
    const totalParticipants = participantStats.length;

    // Dates
    const firstDate = getValidDate(messages[0]?.timestamp);
    const lastDate = getValidDate(messages[messages.length - 1]?.timestamp);
    const dateRange = formatDateRange(firstDate, lastDate);

    // Metrics
    const { streaks, peakHours, firstLast } = analysisResults;
    const longestStreak = streaks?.longestStreak || 0;
    const activeDays = streaks?.totalActiveDays || 0;

    // Find Most Active Day
    let mostActiveDay = { date: '-', count: 0 };
    const dateCount = {};
    messages.forEach(m => {
        const date = new Date(m.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        dateCount[date] = (dateCount[date] || 0) + 1;
    });
    Object.entries(dateCount).forEach(([date, count]) => {
        if (count > mostActiveDay.count) mostActiveDay = { date, count };
    });

    // Chat Vibe Badge
    const nightPercent = peakHours?.timeOfDayPercent?.malam || 0;
    let chatVibe = '☀️ Day Dreamer';
    let vibeIcon = '☀️';
    if (nightPercent > 50) { chatVibe = '🦉 Night Owl'; vibeIcon = '🦉'; }
    else if (peakHours?.timeOfDayPercent?.pagi > 30) { chatVibe = '🌅 Early Bird'; vibeIcon = '🌅'; }
    else { chatVibe = '⚡ 24/7 Online'; vibeIcon = '⚡'; }

    const cardData = {
        totalMessages: messages.length,
        dateRange,
        topContributors,
        totalParticipants,
        longestStreak,
        activeDays,
        mostActiveDay,
        chatVibe,
        vibeIcon
    };

    return `
        <div class="summary-cards-section">
            <h2 class="section-title">📸 Your Chat Wrapped</h2>
            <p class="section-subtitle">Choose a layout to download and share!</p>
            
            <!-- Controls Container -->
            <div class="summary-controls">
                <!-- Wrapper for Format & Theme -->
                <!-- Format Wrapper Removed -->

                <div class="control-group">
                    <label>Theme</label>
                    <div class="theme-switcher">
                        <button class="theme-btn active" onclick="switchCardTheme('gradient')" title="Gradient">🌈</button>
                        <button class="theme-btn" onclick="switchCardTheme('minimal')" title="Minimal">⚪</button>
                        <button class="theme-btn" onclick="switchCardTheme('neon')" title="Neon">⚡</button>
                    </div>
                </div>
            </div>

            <!-- Story Layout (9:16) -->
            <div class="chat-wrapped-card story-layout theme-gradient" id="card-story">
                <div class="wrapped-bg"></div>
                <div class="wrapped-content">
                    <div class="wrapped-header">
                        <div class="wrapped-logo">💬</div>
                        <h3 class="wrapped-title">Chat Wrapped</h3>
                    </div>
                    
                    <div class="wrapped-main-stats">
                        <div class="wrapped-big-stat">
                            <span class="big-number">${cardData.totalMessages.toLocaleString()}</span>
                            <span class="big-label">Total Messages</span>
                        </div>
                        <div class="wrapped-period">${cardData.dateRange}</div>
                    </div>
                    
                    <div class="wrapped-section">
                        <h4 class="wrapped-section-title">👥 Top Contributors</h4>
                        <div class="wrapped-contributors participant-count-${cardData.topContributors.length}">
                            ${renderContributors(cardData.topContributors, 6)}
                        </div>
                    </div>
                    
                    <!-- Highlights Grid (Story: 2x2) -->
                    <div class="wrapped-highlights">
                        <div class="highlight-item">
                            <span class="highlight-icon">🔥</span>
                            <span class="highlight-value">${cardData.longestStreak} days</span>
                            <span class="highlight-label">Longest Streak</span>
                        </div>
                        <div class="highlight-item">
                            <span class="highlight-icon">📅</span>
                            <span class="highlight-value">${cardData.activeDays} days</span>
                            <span class="highlight-label">Total Active Days</span>
                        </div>
                        <div class="highlight-item">
                            <span class="highlight-icon">🏆</span>
                            <span class="highlight-value small">${cardData.mostActiveDay.date}</span>
                            <span class="highlight-label">Most Active (${cardData.mostActiveDay.count} msgs)</span>
                        </div>
                        <div class="highlight-item">
                            <span class="highlight-icon">${cardData.vibeIcon}</span>
                            <span class="highlight-value small">${cardData.chatVibe}</span>
                            <span class="highlight-label">Chat Vibe</span>
                        </div>
                    </div>
                    
                    <div class="wrapped-footer">
                        <span class="wrapped-brand">Created with MyChat ✨</span>
                    </div>
                </div>
            </div>

            <!-- Post Layout (16:9) -->
            <div class="chat-wrapped-card post-layout theme-gradient" id="card-post" style="display: none;">
                <div class="wrapped-bg"></div>
                <div class="wrapped-content">
                    <div class="post-grid">
                        <div class="post-left">
                            <div class="wrapped-header left-align">
                                <div class="wrapped-logo">💬</div>
                                <h3 class="wrapped-title">Chat Wrapped</h3>
                            </div>
                            <div class="wrapped-main-stats left-align">
                                <div class="wrapped-big-stat">
                                    <span class="big-number">${cardData.totalMessages.toLocaleString()}</span>
                                    <span class="big-label">Total Messages</span>
                                </div>
                                <div class="wrapped-period">${cardData.dateRange}</div>
                            </div>
                             <!-- Highlights Grid (Post: 2x2 compact) -->
                            <div class="wrapped-highlights compact">
                                <div class="highlight-item">
                                    <span class="highlight-icon">🔥</span>
                                    <div class="highlight-text">
                                        <span class="highlight-value">${cardData.longestStreak} days</span>
                                        <span class="highlight-label">Longest Streak</span>
                                    </div>
                                </div>
                                <div class="highlight-item">
                                    <span class="highlight-icon">📅</span>
                                    <div class="highlight-text">
                                        <span class="highlight-value">${cardData.activeDays} days</span>
                                        <span class="highlight-label">Active Days</span>
                                    </div>
                                </div>
                                 <div class="highlight-item">
                                    <span class="highlight-icon">🏆</span>
                                    <div class="highlight-text">
                                        <span class="highlight-value small">${cardData.mostActiveDay.date}</span>
                                        <span class="highlight-label">Most Active (${cardData.mostActiveDay.count})</span>
                                    </div>
                                </div>
                                 <div class="highlight-item">
                                    <span class="highlight-icon">${cardData.vibeIcon}</span>
                                    <div class="highlight-text">
                                        <span class="highlight-value small">${cardData.chatVibe}</span>
                                        <span class="highlight-label">Chat Vibe</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="post-right">
                            <div class="wrapped-section">
                                <h4 class="wrapped-section-title">👥 Top Contributors</h4>
                                <div class="wrapped-contributors ${cardData.topContributors.length <= 4 ? 'few-participants' : ''} participant-count-${cardData.topContributors.length}">
                                     ${renderContributors(cardData.topContributors, 10)}
                                </div>
                            </div>
                        </div>
                    </div>
                     <div class="wrapped-footer">
                        <span class="wrapped-brand">Created with MyChat (https://bit.ly/MyChatGueh)</span>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <!-- Action Buttons -->
            <div class="share-actions">
                <button class="share-btn download" onclick="downloadCurrentCard()">
                    <span class="share-icon">⬇️</span> Download Image
                </button>
            </div>
        </div>
    `;
}

/**
 * Render contributor list
 */
function renderContributors(contributors, limit = 10) {
    // Show top 20 to preserve layout sanity, or all if feasible.
    // User requested "Show all". We'll list them all but use compact sizing.
    const shown = contributors.slice(0, limit);
    return shown.map((p, i) => `
        <div class="contributor-item ${i < 3 ? 'top-rank rank-' + (i + 1) : ''}">
            <span class="contributor-rank">#${i + 1}</span>
            <span class="contributor-details">
                <span class="contributor-name">${truncateName(p.name)}</span>
                <span class="contributor-count">${p.count.toLocaleString()}</span>
            </span>
        </div>
    `).join('');
}

/**
 * Helper helpers
 */
function getParticipantStats(messages) {
    const counts = {};
    messages.forEach(m => {
        if (m.sender) {
            counts[m.sender] = (counts[m.sender] || 0) + 1;
        }
    });
    return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

function getValidDate(timestamp) {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
}

function formatDateRange(start, end) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const startStr = start ? start.toLocaleDateString('id-ID', options) : '-';
    const endStr = end ? end.toLocaleDateString('id-ID', options) : '-';
    if (startStr === endStr) return startStr;
    return `${startStr} - ${endStr}`;
}

function truncateName(name) {
    if (!name) return 'Unknown';
    return name.split(' ')[0];
}

/**
 * Switch card format (Story vs Post)
 */
export function switchCardFormat(format) {
    const storyCard = document.getElementById('card-story');
    const postCard = document.getElementById('card-post');
    const btns = document.querySelectorAll('.format-btn');

    if (format === 'story') {
        storyCard.style.display = 'block';
        postCard.style.display = 'none';
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        storyCard.style.display = 'none';
        postCard.style.display = 'block';
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
}

/**
 * Switch card theme
 */
export function switchCardTheme(theme) {
    const cards = document.querySelectorAll('.chat-wrapped-card');
    const btns = document.querySelectorAll('.theme-btn');

    // Remove all theme classes
    cards.forEach(card => {
        card.classList.remove('theme-gradient', 'theme-minimal', 'theme-neon');
        card.classList.add(`theme-${theme}`);
    });

    // Update buttons
    btns.forEach(btn => {
        const onClick = btn.getAttribute('onclick');
        if (onClick && onClick.includes(theme)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Download CURRENT visible card
 */
export function downloadCurrentCard() {
    const storyCard = document.getElementById('card-story');
    const postCard = document.getElementById('card-post');
    const target = storyCard.style.display !== 'none' ? storyCard : postCard;
    downloadCard(target);
}

/**
 * Download card
 */
export async function downloadCard(cardElement) {
    try {
        cardElement.classList.add('capturing');
        const canvas = await html2canvas(cardElement, {
            backgroundColor: null,
            scale: 3, // High Res (approx 1080p width for story)
            logging: false,
            useCORS: true
        });
        cardElement.classList.remove('capturing');

        const type = cardElement.classList.contains('story-layout') ? 'story' : 'post';
        const filename = `mychat-wrapped-${type}-${Date.now()}.png`;

        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Canvas is empty');
                return;
            }
            const link = document.createElement('a');
            link.download = filename;
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Delay revocation to ensure download starts
            setTimeout(() => {
                URL.revokeObjectURL(link.href);
            }, 100);
        }, 'image/png');
    } catch (error) {
        console.error('Error:', error);
        cardElement.classList.remove('capturing');
    }
}

/**
 * Share functions
 */
export function shareTwitter() {
    const text = `I just analyzed my chat history with MyChat! 📊✨\n\nCheck out your chat stats here:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`; // Add actual URL if deployed
    window.open(url, '_blank');
}

export function shareWhatsApp() {
    const text = `Check out my chat stats! Created with MyChat 📊✨ (Please attach the image manually)`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// Global exports
window.switchCardFormat = switchCardFormat;
window.switchCardTheme = switchCardTheme;
window.downloadCurrentCard = downloadCurrentCard;
window.downloadCard = downloadCard;
window.shareTwitter = shareTwitter;
window.shareWhatsApp = shareWhatsApp;
