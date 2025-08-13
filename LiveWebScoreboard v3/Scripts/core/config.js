/**
 * Configuration constants for LiveWebScoreboard
 */

(function(window) {
    'use strict';
    
    const CONFIG = {
        MOBILE_BREAKPOINT: 1000,
        ANIMATION_DURATION: 300,
        SCROLL_DELAY: 57,
        AJAX_ENDPOINT: "TDetails.aspx",
        RESIZE_DEBOUNCE: 250
    };

    // Export to global scope
    window.CONFIG = CONFIG;
    
})(window);