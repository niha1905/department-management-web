/**
 * Processes comma-separated tag input into an array of trimmed, non-empty tags
 * @param {string} tagInput - Comma-separated tags string
 * @returns {string[]} Array of processed tags
 */
export const processTagInput = (tagInput) => {
  if (!tagInput) return [];
  return tagInput
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
};

/**
 * Converts an array of tags back into a comma-separated string for editing
 * @param {string[]} tags - Array of tags
 * @returns {string} Comma-separated string of tags
 */
export const tagsArrayToString = (tags) => {
  if (!tags || !Array.isArray(tags)) return '';
  return tags.join(', ');
};
