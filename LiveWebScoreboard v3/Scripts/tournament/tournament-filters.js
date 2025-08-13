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
            eventFilters.append('<button class="filter-btn" data-filter="event" data-value="NONE">None</button>');
            
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
            if (data.availableEvents && data.availableEvents.length > 0) {
                data.availableEvents.forEach(event => {
                    eventFilters.append(`<button class="filter-btn" data-filter="event" data-value="${event.code}">${event.name}</button>`);
                });
            }
        },

        setupLeaderboardEventFilters: function(eventFilters, data) {
            eventFilters.append('<button class="filter-btn" data-filter="event" data-value="NONE">None</button>');
            eventFilters.append('<button class="filter-btn" data-filter="event" data-value="MIXED">Mixed</button>');
            
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
            
            if (displayMode === 'running-order' || displayMode === 'by-division') {
                divisionFilters.append('<button class="filter-btn active" data-filter="division" data-value="ALL">All</button>');
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
            .fail((error) => {
                // Silently fail - division filters will just show default
            });
        },

        setupRoundFilters: function(data, selectedEvent) {
            const roundFilters = $('#roundFilters');
            
            // Hide round filters for collegiate tournaments (NCWL format code)
            if (TournamentInfo.currentTournamentInfo && TournamentInfo.currentTournamentInfo.formatCode === 'NCWL') {
                roundFilters.hide();
                return;
            } else {
                roundFilters.show();
            }
            
            // Preserve current round and placement format selections
            const currentRoundValue = $('#roundFilters .filter-btn.active[data-filter="round"]').data('value') || '0';
            const currentPlacementValue = $('#roundFilters .filter-btn.active[data-filter="placement"]').data('value');
            
            roundFilters.empty();
            
            // Always add "All Rounds" option
            roundFilters.append('<button class="filter-btn" data-filter="round" data-value="0">All Rounds</button>');
            
            // Add placement format override buttons (but not for Overall event, running order mode, or by-division mode)
            if (selectedEvent !== 'O' && AppState.currentDisplayMode !== 'running-order' && AppState.currentDisplayMode !== 'by-division') {
                roundFilters.append('<button class="filter-btn" data-filter="placement" data-value="ROUND">Rounds View</button>');
                roundFilters.append('<button class="filter-btn" data-filter="placement" data-value="BEST">Divisions View</button>');
            } else if (selectedEvent === 'O') {
                // For Overall events, add "Best of" filter
                roundFilters.append('<button class="filter-btn" data-filter="bestof" data-value="BESTOF">Best of</button>');
            }
            
            let maxRounds = 0;
            
            if (selectedEvent && selectedEvent !== 'NONE') {
                // Event selected - find rounds for that specific event
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
            
            // Add round buttons (only regular rounds 1-6, exclude runoffs like Round 25)
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
            
            // Restore previous placement selection if it existed
            if (currentPlacementValue) {
                const targetPlacementButton = roundFilters.find(`[data-filter="placement"][data-value="${currentPlacementValue}"]`);
                if (targetPlacementButton.length > 0) {
                    targetPlacementButton.addClass('active');
                }
            }
        },

        setupOnWaterDisplay: function(data) {
            if (data.onWaterData && data.onWaterData.activeEvent && data.onWaterData.activeEvent.trim() !== '') {
                $('#currentEventText').text('Current Event: ' + data.onWaterData.activeEvent);
                
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
                
                // Reset user placement selection flag when new event is selected
                window.userSelectedPlacement = false;
                
                self.updateEventFilterState($btn, eventCode);
                self.handleEventFilterSelection(eventCode);
                TournamentInfo.applyFilterCombination();
            });
        },

        updateEventFilterState: function($btn, eventCode) {
            $('#eventFilters .filter-btn').removeClass('active');
            $btn.addClass('active');
        },

        handleEventFilterSelection: function(eventCode) {
            if (eventCode === 'NONE') {
                this.handleNoneEventSelection();
            } else {
                this.handleSpecificEventSelection(eventCode);
            }
        },

        handleNoneEventSelection: function() {
            // Reset division to MOST_RECENT to always show Most Recent button
            $('#divisionFilters .filter-btn').removeClass('active');
            $('#divisionFilters .filter-btn[data-value="MOST_RECENT"]').addClass('active');
            
            // Reset round filters to defaults
            $('#roundFilters .filter-btn').removeClass('active');
            $('#roundFilters .filter-btn[data-filter="round"][data-value="0"]').addClass('active');
        },

        handleSpecificEventSelection: function(eventCode) {
            // Update round filters based on selected event
            this.setupRoundFilters(this.tournamentData, eventCode);
            
            // Load event details if specific event is selected (for division options)
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
                
                // Mark that user manually selected placement format
                if (filterType === 'placement') {
                    console.log('[PLACEMENT-DEBUG] User manually selected placement:', filterValue);
                    window.userSelectedPlacement = true;
                }
                
                self.updateDivisionRoundFilterState($btn, filterType);
                TournamentInfo.applyFilterCombination();
            });
        },

        updateDivisionRoundFilterState: function($btn, filterType) {
            if (filterType === 'placement') {
                this.handlePlacementFilterUpdate($btn);
            } else if (filterType === 'bestof') {
                this.handleBestOfFilterUpdate($btn);
            } else {
                this.handleStandardFilterUpdate($btn, filterType);
            }
        },

        handlePlacementFilterUpdate: function($btn) {
            $('#roundFilters .filter-btn[data-filter="placement"]').removeClass('active');
            $btn.addClass('active');
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