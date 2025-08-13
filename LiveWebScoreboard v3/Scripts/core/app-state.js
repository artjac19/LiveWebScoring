/**
 * Application state management for LiveWebScoreboard
 */

(function(window) {
    'use strict';
    
    const AppState = {
        currentSelectedTournamentId: '',
        currentTournamentName: '',
        currentTrickVideoText: '',
        lastKnownMobile: false,
        currentActiveView: '',
        pendingRequests: new Set(),
        currentRequestId: 0,
        currentDisplayMode: 'leaderboard'  // 'leaderboard' or 'running-order'
    };

    // Export to global scope
    window.AppState = AppState;
    
})(window);