/**
 * Tournament Filter Management - Handles all filter setup and event handling
 * Manages event, division, and round filters for tournament leaderboards
 * Extracted from TournamentInfo for better organization
 */

(function(window) {
    'use strict';
    
    const TournamentFilters = {
        tournamentData: null,
        
        setupLeaderboardFilters: function(data) {
            this.tournamentData = data;
            
            this.setupLeaderboardTitle(data);
            this.setupEventFilters(data);
            this.setupDivisionFilters();
            this.loadDynamicDivisions();
            this.setupRoundFilters(data, null);
            this.setupOnWaterDisplay(data);
            this.bindFilterEvents();
        },

        setupLeaderboardTitle: function(data) {
            const displayMode = AppState.currentDisplayMode || 'leaderboard';
            const titleText = displayMode === 'running-order' ? 'Running Order' : 'Leaderboard';
            $('#leaderboardTitle').text(data.tournamentName + ' - ' + data.sanctionId + ' ' + titleText);
        },

        setupEventFilters: function(data) {
            const eventFilters = $('#eventFilters');
            eventFilters.empty();
            
            const displayMode = AppState.currentDisplayMode || 'leaderboard';
            
            if (displayMode === 'running-order') {
                this.setupRunningOrderEventFilters(eventFilters, data);
            } else if (displayMode === 'by-division') {
                this.setupByDivisionEventFilters(eventFilters, data);
            } else {
                this.setupLeaderboardEventFilters(eventFilters, data);
            }
        },

        setupRunningOrderEventFilters: function(eventFilters, data) {
            eventFilters.append('<button class="filter-btn" data-filter="event" data-value="NONE">All</button>');
            
            if (data.availableEvents && data.availableEvents.length > 0) {
                data.availableEvents.forEach(event => {
                    // Only show individual events (S, T, J), exclude Overall (O)
                    if (event.code !== 'O') {
                        eventFilters.append(`<button class="filter-btn" data-filter="event" data-value="${event.code}">${event.name}</button>`);
                    }
                });
            }
        },

        setupByDivisionEventFilters: function(eventFilters, data) {
            eventFilters.append('<button class="filter-btn" data-filter="event" data-value="NONE">All</button>');
            
            if (data.availableEvents && data.availableEvents.length > 0) {
                data.availableEvents.forEach(event => {
                    // Only show individual events (S, T, J), exclude Overall (O)
                    if (event.code !== 'O') {
                        eventFilters.append(`<button class="filter-btn" data-filter="event" data-value="${event.code}">${event.name}</button>`);
                    }
                });
            }
        },

        setupLeaderboardEventFilters: function(eventFilters, data) {
            eventFilters.append('<button class="filter-btn" data-filter="event" data-value="NONE">All</button>');
            eventFilters.append('<button class="filter-btn" data-filter="event" data-value="MIXED">On the water</button>');
            
            if (data.availableEvents && data.availableEvents.length > 0) {
                data.availableEvents.forEach(event => {
                    eventFilters.append(`<button class="filter-btn" data-filter="event" data-value="${event.code}">${event.name}</button>`);
                });
            }
        },

        setupDivisionFilters: function() {
            const divisionFilters = $('#divisionFilters');
            divisionFilters.empty();
            
            const displayMode = AppState.currentDisplayMode || 'leaderboard';
            
            if (displayMode === 'running-order') {
                divisionFilters.append('<button class="filter-btn active" data-filter="division" data-value="ALL">All</button>');
            } else if (displayMode === 'by-division') {
                
            } else {
                divisionFilters.append('<button class="filter-btn active" data-filter="division" data-value="MOST_RECENT">Most Recent</button>');
                divisionFilters.append('<button class="filter-btn" data-filter="division" data-value="ALL">Alphabetical</button>');
            }
        },

        loadDynamicDivisions: function() {
            if (!AppState.currentSelectedTournamentId || AppState.currentSelectedTournamentId.length < 6) {
                return;
            }

            $.getJSON('GetLeaderboardSP.aspx', {
                SID: AppState.currentSelectedTournamentId,
                SY: "0",
                TN: AppState.currentTournamentName,
                FC: 'LBSP',
                FT: '0',
                UN: '0',
                UT: '0',
                LOAD_ALL_DIVISIONS: '1'
            })
            .done((response) => {
                if (response.success && response.availableDivisions) {
                    const uniqueDivisions = new Map();
                    
                    response.availableDivisions.forEach(division => {
                        if (division.code && division.code !== 'ALL' && division.code !== '0') {
                            uniqueDivisions.set(division.code, division.name);
                        }
                    });
                    
                    const divisionFilters = $('#divisionFilters');
                    uniqueDivisions.forEach((name, code) => {
                        divisionFilters.append(`<button class="filter-btn" data-filter="division" data-value="${code}">${name}</button>`);
                    });
                }
            })
        },

        setupRoundFilters: function(data, selectedEvent) {
            const roundFilters = $('#roundFilters');
            
            // Hide round filters entirely
            roundFilters.hide();
            return;
            
            // Preserve current round selection
            const currentRoundValue = $('#roundFilters .filter-btn.active[data-filter="round"]').data('value') || '0';
            
            roundFilters.empty();
            
            // Always add "All Rounds" option
            roundFilters.append('<button class="filter-btn" data-filter="round" data-value="0">All Rounds</button>');
            
            if (selectedEvent === 'O') {
                // For Overall events, add "Best of" filter
                roundFilters.append('<button class="filter-btn" data-filter="bestof" data-value="BESTOF">Best of</button>');
            }
            
            let maxRounds = 0;
            
            if (selectedEvent && selectedEvent !== 'NONE') {
                // find rounds for event
                if (data.availableEvents) {
                    const event = data.availableEvents.find(e => e.code === selectedEvent);
                    if (event) {
                        maxRounds = event.rounds || 0;
                    }
                }
            } else {
                // No event selected - use max rounds across all events
                if (data.availableEvents) {
                    data.availableEvents.forEach(event => {
                        if (event.rounds && event.rounds > maxRounds) {
                            maxRounds = event.rounds;
                        }
                    });
                }
            }
            
            // Add round buttons (exclude runoffs like Round 25)
            for (let i = 1; i <= maxRounds && i <= 6; i++) {
                roundFilters.append(`<button class="filter-btn" data-filter="round" data-value="${i}">Round ${i}</button>`);
            }
            
            // Restore previous round selection if it still exists
            const targetRoundButton = roundFilters.find(`[data-filter="round"][data-value="${currentRoundValue}"]`);
            if (targetRoundButton.length > 0) {
                targetRoundButton.addClass('active');
            } else {
                // Default to "All Rounds" if previous selection not found
                roundFilters.find('[data-filter="round"][data-value="0"]').addClass('active');
            }
            
        },

        setupOnWaterDisplay: function(data) {
            if (data.onWaterData && (data.onWaterData.slalomOnWater || data.onWaterData.trickOnWater || data.onWaterData.jumpOnWater)) {
                let onWaterContent = '';
                if (data.onWaterData.slalomOnWater) onWaterContent += '<div class="mb-2">' + data.onWaterData.slalomOnWater + '</div>';
                if (data.onWaterData.trickOnWater) onWaterContent += '<div class="mb-2">' + data.onWaterData.trickOnWater + '</div>';
                if (data.onWaterData.jumpOnWater) onWaterContent += '<div class="mb-2">' + data.onWaterData.jumpOnWater + '</div>';
                
                $('#onWaterContent').html(onWaterContent);
                $('#onWaterDisplay').show();
            } else {
                $('#onWaterDisplay').hide();
            }
        },

        bindFilterEvents: function() {
            this.removeExistingFilterHandlers();
            this.bindEventFilterClicks();
            this.bindDivisionAndRoundFilterClicks();
        },

        removeExistingFilterHandlers: function() {
            $('.filter-bubbles .filter-btn').off('click.leaderboard');
        },

        bindEventFilterClicks: function() {
            const self = this;
            
            $('#eventFilters .filter-btn').on('click.leaderboard', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const $btn = $(this);
                const eventCode = $btn.data('value');
                
                
                self.updateEventFilterState($btn, eventCode);
                self.handleEventFilterSelection(eventCode);
                TournamentInfo.applyFilterCombination();
            });
        },

        updateEventFilterState: function($btn, eventCode) {
            $('#eventFilters .filter-btn').removeClass('active');
            $btn.addClass('active');
            
            // Hide divisions filter when "On the water" (MIXED) is selected
            if (eventCode === 'MIXED') {
                $('#divisionFilters').hide();
            } else {
                $('#divisionFilters').show();
            }
        },

        handleEventFilterSelection: function(eventCode) {
            if (eventCode === 'NONE') {
                this.handleNoneEventSelection();
            } else {
                this.handleSpecificEventSelection(eventCode);
            }
        },

        handleNoneEventSelection: function() {
            $('#divisionFilters .filter-btn').removeClass('active');
            $('#divisionFilters .filter-btn[data-value="MOST_RECENT"]').addClass('active');
            
            $('#roundFilters .filter-btn').removeClass('active');
            $('#roundFilters .filter-btn[data-filter="round"][data-value="0"]').addClass('active');
        },

        handleSpecificEventSelection: function(eventCode) {
            this.setupRoundFilters(this.tournamentData, eventCode);
            
            TournamentInfo.loadEventDetails(eventCode);
        },

        bindDivisionAndRoundFilterClicks: function() {
            const self = this;
            
            $('#divisionFilters, #roundFilters').on('click.leaderboard', '.filter-btn', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const $btn = $(this);
                const filterType = $btn.data('filter');
                const filterValue = $btn.data('value');
                
                
                self.updateDivisionRoundFilterState($btn, filterType);
                TournamentInfo.applyFilterCombination();
            });
        },

        updateDivisionRoundFilterState: function($btn, filterType) {
            if (filterType === 'bestof') {
                this.handleBestOfFilterUpdate($btn);
            } else {
                this.handleStandardFilterUpdate($btn, filterType);
            }
        },

        handleBestOfFilterUpdate: function($btn) {
            $('#roundFilters .filter-btn[data-filter="bestof"]').removeClass('active');
            $btn.addClass('active');
            // Also clear any round filter selection when Best of is selected
            $('#roundFilters .filter-btn[data-filter="round"]').removeClass('active');
        },

        handleStandardFilterUpdate: function($btn, filterType) {
            // Update active state within the same filter group (round or division)
            $btn.siblings('[data-filter="' + filterType + '"]').removeClass('active');
            $btn.addClass('active');
            // Clear bestof selection when selecting individual rounds
            if (filterType === 'round') {
                $('#roundFilters .filter-btn[data-filter="bestof"]').removeClass('active');
            }
        }
    };

    // Export to global scope
    window.TournamentFilters = TournamentFilters;
    
})(window);