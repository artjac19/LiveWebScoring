/**
 * Utility functions for the LiveWebScoreboard application
 * Extracted from default.js for better modularity
 */

(function(window) {
    'use strict';
    
    const Utils = {
        isMobile: () => window.innerWidth < CONFIG.MOBILE_BREAKPOINT,

        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        parseSkiYear: function(date) {
            if (!date) return '';
            
            try {
                const dateParts = date.split('/');
                if (dateParts.length === 3) {
                    const month = parseInt(dateParts[0], 10);
                    const calendarYear = parseInt(dateParts[2], 10);
                    // Ski year starts in August: Aug-Dec = next year, Jan-Jul = current year
                    const skiYear = month > 7 ? calendarYear + 1 : calendarYear;
                    return skiYear.toString();
                } else {
                    // Fallback: extract 4-digit year from date string -- some years are formatted differently
                    const dateMatch = date.match(/(20\d\d)/);
                    return dateMatch && dateMatch[1] ? dateMatch[1] : '';
                }
            } catch (e) {
                console.error('Error parsing date for ski year:', e);
                const dateMatch = date.match(/(20\d\d)/);
                return dateMatch && dateMatch[1] ? dateMatch[1] : '';
            }
        },

        // Request management utilities
        cancelAllRequests: function() {
            AppState.pendingRequests.forEach(xhr => {
                if (xhr && xhr.abort) {
                    xhr.abort();
                }
            });
            AppState.pendingRequests.clear();
        },

        createCancellableRequest: function(url, data) {
            // Cancel previous requests
            this.cancelAllRequests();
            
            // Generate new request ID
            AppState.currentRequestId++;
            const requestId = AppState.currentRequestId;
            
            // Create the request
            const xhr = $.getJSON(url, data);
            
            // Add to pending requests
            AppState.pendingRequests.add(xhr);
            
            // Clean up when done (success or failure)
            xhr.always(() => {
                AppState.pendingRequests.delete(xhr);
            });
            
            // Return both the promise and request ID
            return {
                promise: xhr,
                requestId: requestId,
                isCurrent: () => requestId === AppState.currentRequestId
            };
        },

        // Initialize global UI elements
        initializeGlobalUI: function() {
            // Initialize unofficial badge click handler
            $(document).on('click', '.unofficial-badge', function() {
                alert('All results displayed here are unofficial. Contact your tournament scorers for official results.');
            });
        }
    };

    // Export to global scope
    window.Utils = Utils;
    
})(window);