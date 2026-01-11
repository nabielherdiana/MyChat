/**
 * ZIP Handler Module
 * Extracts and processes ZIP files containing chat exports
 * Uses JSZip library loaded from CDN
 */

/**
 * Check if a file is a ZIP archive
 * @param {File} file - File object
 * @returns {boolean}
 */
export function isZipFile(file) {
    return file.name.toLowerCase().endsWith('.zip') ||
        file.type === 'application/zip' ||
        file.type === 'application/x-zip-compressed';
}

/**
 * Extract contents from a ZIP file
 * @param {File} file - ZIP file
 * @returns {Promise<Array>} Array of {name, content} objects
 */
export async function extractZip(file) {
    // JSZip should be loaded from CDN
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not loaded');
    }

    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const files = [];

    // Get all files from the ZIP
    const promises = [];

    contents.forEach((relativePath, zipEntry) => {
        // Skip directories and hidden files
        if (zipEntry.dir || relativePath.startsWith('__MACOSX') || relativePath.startsWith('.')) {
            return;
        }

        // Only process text-based files we support
        const lowerPath = relativePath.toLowerCase();
        if (lowerPath.endsWith('.txt') ||
            lowerPath.endsWith('.csv') ||
            lowerPath.endsWith('.html') ||
            lowerPath.endsWith('.htm')) {

            promises.push(
                zipEntry.async('string').then(content => ({
                    name: relativePath,
                    content: content
                }))
            );
        }
    });

    const extractedFiles = await Promise.all(promises);

    // Sort files by name (so messages.html, messages2.html, etc. are in order)
    extractedFiles.sort((a, b) => {
        // Extract numbers from filenames for proper sorting
        const numA = extractNumber(a.name);
        const numB = extractNumber(b.name);

        if (numA !== null && numB !== null) {
            return numA - numB;
        }
        return a.name.localeCompare(b.name);
    });

    return extractedFiles;
}

/**
 * Extract number from filename for sorting
 * e.g., "messages2.html" -> 2, "messages.html" -> 0
 */
function extractNumber(filename) {
    const match = filename.match(/messages(\d*)/i);
    if (match) {
        return match[1] ? parseInt(match[1]) : 0;
    }
    return null;
}

/**
 * Get file type from filename
 * @param {string} filename 
 * @returns {'whatsapp' | 'telegram' | 'csv' | 'unknown'}
 */
export function getFileType(filename) {
    const lower = filename.toLowerCase();

    if (lower.endsWith('.html') || lower.endsWith('.htm')) {
        return 'telegram';
    }
    if (lower.endsWith('.csv')) {
        return 'csv';
    }
    if (lower.endsWith('.txt')) {
        return 'whatsapp';
    }
    return 'unknown';
}
