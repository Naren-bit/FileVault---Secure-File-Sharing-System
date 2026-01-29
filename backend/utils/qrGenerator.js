/**
 * QR Code Generation Utilities
 * 
 * Used for:
 * 1. MFA Setup - Generate QR code for Google Authenticator
 * 2. File Sharing - Encode download URLs as QR codes
 */

const QRCode = require('qrcode');

/**
 * Generate QR code as Data URL (base64 image)
 * Can be directly embedded in <img src="...">
 * 
 * @param {string} data - Data to encode in QR code
 * @param {Object} options - QR code options
 * @returns {Promise<string>} Base64 data URL
 */
async function generateQRDataURL(data, options = {}) {
    const defaultOptions = {
        errorCorrectionLevel: 'M',  // Medium error correction
        type: 'image/png',
        width: 256,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
        return await QRCode.toDataURL(data, mergedOptions);
    } catch (error) {
        throw new Error(`QR Code generation failed: ${error.message}`);
    }
}

/**
 * Generate TOTP URI for authenticator apps
 * 
 * Format: otpauth://totp/LABEL?secret=SECRET&issuer=ISSUER
 * 
 * @param {string} secret - Base32 encoded TOTP secret
 * @param {string} email - User's email (label)
 * @param {string} issuer - Application name
 * @returns {string} TOTP URI
 */
function generateTOTPUri(secret, email, issuer = 'SecureFileShare') {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);

    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate MFA setup QR code
 * 
 * @param {string} secret - Base32 encoded TOTP secret
 * @param {string} email - User's email
 * @returns {Promise<string>} Base64 QR code image
 */
async function generateMFAQRCode(secret, email) {
    const uri = generateTOTPUri(secret, email);

    return await generateQRDataURL(uri, {
        width: 300,
        color: {
            dark: '#1e293b',   // Slate-800 (matches our theme)
            light: '#ffffff'
        }
    });
}

/**
 * Generate file share QR code
 * 
 * @param {string} shareUrl - The complete share URL
 * @returns {Promise<string>} Base64 QR code image
 */
async function generateShareQRCode(shareUrl) {
    return await generateQRDataURL(shareUrl, {
        width: 350,
        color: {
            dark: '#06b6d4',   // Cyan-500 (our accent color)
            light: '#0f172a'   // Slate-900 (dark background)
        }
    });
}

module.exports = {
    generateQRDataURL,
    generateTOTPUri,
    generateMFAQRCode,
    generateShareQRCode
};
