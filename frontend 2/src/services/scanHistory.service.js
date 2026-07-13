import localforage from 'localforage';

import useAuthStore from '../store/authStore';

const BASE_HISTORY_KEY = 'dia_plus_scan_history';

function getHistoryKey() {
  const userId = useAuthStore.getState().user?.id || 'guest';
  return `${BASE_HISTORY_KEY}_${userId}`;
}

// Configure localforage to use IndexedDB
localforage.config({
  name: 'DiaPlusApp',
  storeName: 'scan_history_store'
});

export const scanHistoryService = {
  /**
   * Save a scan result to history
   * @param {Object} scanData - The scan result data
   * @param {string} imageBase64 - The image data as a base64 string
   */
  async saveScan(scanData, imageBase64) {
    try {
      const historyKey = getHistoryKey();
      const history = (await localforage.getItem(historyKey)) || [];
      const newScan = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        image: imageBase64,
        result: scanData
      };
      
      // Save at the beginning of the array
      history.unshift(newScan);
      
      // Optional: Limit history to last 50 scans to save space
      if (history.length > 50) {
        history.length = 50;
      }
      
      await localforage.setItem(historyKey, history);
      return newScan;
    } catch (error) {
      console.error('Error saving scan history:', error);
      throw error;
    }
  },

  /**
   * Get all saved scans
   * @returns {Promise<Array>} List of saved scans
   */
  async getHistory() {
    try {
      const historyKey = getHistoryKey();
      return (await localforage.getItem(historyKey)) || [];
    } catch (error) {
      console.error('Error getting scan history:', error);
      return [];
    }
  },

  /**
   * Get a specific scan by ID
   * @param {string} id 
   */
  async getScan(id) {
    try {
      const history = await this.getHistory();
      return history.find(scan => scan.id === id);
    } catch (error) {
      console.error('Error getting scan:', error);
      return null;
    }
  },

  /**
   * Delete a scan from history
   * @param {string} id 
   */
  async deleteScan(id) {
    try {
      let history = await this.getHistory();
      history = history.filter(scan => scan.id !== id);
      const historyKey = getHistoryKey();
      await localforage.setItem(historyKey, history);
      return true;
    } catch (error) {
      console.error('Error deleting scan:', error);
      return false;
    }
  },

  /**
   * Clear all scan history
   */
  async clearHistory() {
    try {
      const historyKey = getHistoryKey();
      await localforage.removeItem(historyKey);
      return true;
    } catch (error) {
      console.error('Error clearing scan history:', error);
      return false;
    }
  }
};
