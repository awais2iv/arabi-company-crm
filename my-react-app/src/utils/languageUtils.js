// Language detection and text direction utilities

/**
 * Detects if text is Arabic
 * @param {string} text - Text to check
 * @returns {boolean} - True if text contains Arabic characters
 */
export const isArabic = (text) => {
  if (!text) return false;
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
};

/**
 * Gets text direction based on content
 * @param {string} text - Text to analyze
 * @returns {string} - 'rtl' or 'ltr'
 */
export const getTextDirection = (text) => {
  return isArabic(text) ? 'rtl' : 'ltr';
};

/**
 * Gets alignment class based on text
 * @param {string} text - Text to analyze
 * @returns {string} - Tailwind alignment class
 */
export const getTextAlign = (text) => {
  return isArabic(text) ? 'text-right' : 'text-left';
};

/**
 * Wraps text with proper direction attributes
 * @param {string} text - Text content
 * @returns {object} - Props to spread on element
 */
export const getDirectionProps = (text) => {
  return {
    dir: getTextDirection(text),
    className: getTextAlign(text)
  };
};

/**
 * Format date based on language
 * @param {string} dateStr - Date string
 * @param {string} language - Current language (en/ar)
 * @returns {string} - Formatted date
 */
export const formatDate = (dateStr, language = 'en') => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  
  if (language === 'ar') {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format time based on language
 * @param {string} timeStr - Time string
 * @param {string} language - Current language (en/ar)
 * @returns {string} - Formatted time
 */
export const formatTime = (timeStr, language = 'en') => {
  if (!timeStr) return '—';
  
  const date = new Date(`1970-01-01T${timeStr}`);
  
  if (language === 'ar') {
    return date.toLocaleTimeString('ar-EG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format number based on language
 * @param {number} num - Number to format
 * @param {string} language - Current language (en/ar)
 * @returns {string} - Formatted number
 */
export const formatNumber = (num, language = 'en') => {
  if (num === null || num === undefined) return '—';
  
  if (language === 'ar') {
    return num.toLocaleString('ar-EG');
  }
  
  return num.toLocaleString('en-US');
};
