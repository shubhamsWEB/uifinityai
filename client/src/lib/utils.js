import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine class names with tailwind merge
 * @param  {...any} inputs - Class names to combine
 * @returns {string} Combined class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Sleep for a given amount of time
 * @param {number} ms - Time to sleep in milliseconds
 * @returns {Promise<void>} Promise that resolves after the timeout
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Safely access an object's nested properties
 * @param {Object} obj - The object to access
 * @param {string} path - The path to the property
 * @param {*} defaultValue - The default value if the property doesn't exist
 * @returns {*} The value or the default value
 */
export function getNestedValue(obj, path, defaultValue = undefined) {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * Generate a random ID
 * @param {number} length - Length of the ID
 * @returns {string} Random ID
 */
export function generateId(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Check if an object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} Is the object empty
 */
export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Time to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}