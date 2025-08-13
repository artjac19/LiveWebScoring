/**
 * Tournament Data Loader - Handles all tournament data loading operations
 * Consolidates repetitive AJAX requests and provides a clean API
 * Extracted from TournamentInfo for better organization
 */

(function(window) {
    'use strict';
    
    const TournamentDataLoader = {
        
        /**
         * Builds standard request parameters for GetLeaderboardSP.aspx
         */
        buildBaseRequest: function(sanctionId, extraParams = {}) {
            const skiYear = this.getSkiYear();
            const formatCode = this.getFormatCode();
            
            return {
                SID: sanctionId || AppState.currentSelectedTournamentId,
                SY: skiYear,
                TN: AppState.currentTournamentName,
                FC: formatCode,
                FT: '0',
                UN: '0',
                UT: '0',
                ...extraParams
            };
        },
        
        /**
         * Makes standardized request to GetLeaderboardSP.aspx
         */
        makeRequest: function(params, loadingMessage = 'Loading...') {
            if (loadingMessage) {
                $('#leaderboardContent').html(`<div class="text-center p-4"><p>${loadingMessage}</p></div>`);
            }
            
            return $.getJSON('GetLeaderboardSP.aspx', params);
        },
        
        /**
         * Gets current ski year from tournament info
         */
        getSkiYear: function() {
            return TournamentInfo.currentTournamentInfo?.skiYear || "0";
        },
        
        /**
         * Gets current format code from tournament info  
         */
        getFormatCode: function() {
            return TournamentInfo.currentTournamentInfo?.formatCode || 'LBSP';
        },
        
        // Data loading methods consolidated
        
        loadMostRecentDivisions: function(sanctionId, skiYear, formatCode, eventCode, selectedRound) {
            const params = this.buildBaseRequest(sanctionId, {
                GET_MOST_RECENT: '1'
            });
            
            if (eventCode) {
                params.EV = eventCode;
            }
            
            return this.makeRequest(params, 'Loading most recent divisions...')
                .done((response) => {
                    if (response.success && response.prioritizedDivisions) {
                        const prioritizedDivisions = response.prioritizedDivisions.map(div => ({
                            event: div.event,
                            division: div.division,
                            eventName: div.event,
                            rank: div.rank,
                            lastActivity: div.lastActivity
                        }));
                        
                        // For specific events, get placement format using first division before loading data
                        if (eventCode && eventCode !== 'NONE' && eventCode !== 'O' && prioritizedDivisions.length > 0) {
                            const firstDivision = prioritizedDivisions[0].division;
                            console.log('[PLACEMENT-DEBUG] Getting placement format using first division:', firstDivision);
                            
                            this.getPlacementFormatForEvent(eventCode, firstDivision, () => {
                                // Callback: Load divisions AFTER placement format is set
                                this.loadDivisionsAfterPlacementFormat(prioritizedDivisions, sanctionId, skiYear, formatCode, selectedRound);
                            });
                        } else {
                            // No specific event, load directly
                            this.loadDivisionsAfterPlacementFormat(prioritizedDivisions, sanctionId, skiYear, formatCode, selectedRound);
                        }
                    } else {
                        $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>No recent divisions available</p></div>');
                    }
                })
                .fail(() => {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading recent divisions</p></div>');
                });
        },
        
        loadAlphabeticalDivisions: function(sanctionId, skiYear, formatCode, eventCode, selectedRound) {
            const selectedEvent = eventCode;
            
            if (!selectedEvent || selectedEvent === '0') {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Please select an event first</p></div>');
                return;
            }
            
            const params = this.buildBaseRequest(sanctionId, {
                EV: selectedEvent
            });
            
            // Get placement format FIRST for individual events, then load divisions
            if (selectedEvent && selectedEvent !== 'NONE' && selectedEvent !== 'O') {
                console.log('[PLACEMENT-DEBUG] Getting placement format first for alphabetical event:', selectedEvent);
                this.getPlacementFormatForEvent(selectedEvent, () => {
                    // Callback: Load divisions after placement format is set
                    this.loadAlphabeticalDivisionsData(params, sanctionId, skiYear, formatCode, selectedRound, selectedEvent);
                });
                return;
            }
            
            // For non-specific events, load directly
            return this.loadAlphabeticalDivisionsData(params, sanctionId, skiYear, formatCode, selectedRound, selectedEvent);
        },
        
        loadAlphabeticalDivisionsData: function(params, sanctionId, skiYear, formatCode, selectedRound, selectedEvent) {
            return this.makeRequest(params, 'Loading divisions alphabetically for selected event...')
                .done((response) => {
                    if (response.success && response.availableDivisions) {
                        const divisions = response.availableDivisions.map(division => ({
                            event: selectedEvent,
                            division: division.code,
                            eventName: TournamentInfo.getEventName(selectedEvent)
                        }));
                        
                        // Store all divisions for infinite scroll
                        TournamentInfo.allPrioritizedDivisions = divisions;
                        TournamentInfo.currentBatchIndex = 0;
                        TournamentInfo.isLoading = false;
                        
                        // Load first batch of 5 divisions
                        const firstBatch = divisions.slice(0, 5);
                        TournamentInfo.currentBatchIndex = 5;
                        TournamentInfo.loadDivisionsBatch(firstBatch, sanctionId, skiYear, formatCode, selectedRound);
                        
                        // Set up infinite scroll
                        TournamentInfo.setupInfiniteScroll(sanctionId, skiYear, formatCode, selectedRound);
                    } else {
                        $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>No divisions available for this event</p></div>');
                    }
                })
                .fail(() => {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading divisions</p></div>');
                });
        },
        
        loadByDivisionContent: function(selectedEvent, selectedDivision, selectedRound) {
            const params = this.buildBaseRequest(null, {
                EV: selectedEvent || '0',
                DV: selectedDivision || 'ALL',
                RND: selectedRound || '0'
            });
            
            return this.makeRequest(params, 'Loading division content...')
                .done((response) => {
                    if (response.success && response.leaderboardHtml) {
                        let content = response.leaderboardHtml;
                        content = TournamentHTML.addOverallSkierLinks(content);
                        
                        $('#leaderboardContent').html(content);
                        TournamentInfo.removeEmptyColumnsAndRows($('#leaderboardContent table')[0]);
                        TournamentInfo.checkForEmptyContent();
                    } else {
                        $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>No data available</p></div>');
                    }
                })
                .fail(() => {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading data</p></div>');
                });
        },
        
        loadOverallAllDivisions: function(selectedRound) {
            const params = this.buildBaseRequest(null, {
                EV: 'O',
                DV: 'All',
                RND: selectedRound || '0'
            });
            
            return this.makeRequest(params, 'Loading overall scores...')
                .done((response) => {
                    console.log('[OVERALL-JS] GetLeaderboardSP response:', response);
                    if (response.success && response.htmlContent) {
                        // Add skier links to Overall results before displaying
                        const htmlWithLinks = TournamentHTML.addOverallSkierLinks(response.htmlContent);
                        $('#leaderboardContent').html(htmlWithLinks);
                        
                        // Split Overall tables by round in JavaScript
                        const selectedRound = $('#roundFilters .filter-btn.active[data-filter="round"]').data('value');
                        TournamentInfo.splitOverallTablesByRound(selectedRound);
                    } else {
                        TournamentInfo.checkForEmptyContent();
                    }
                })
                .fail((error) => {
                    console.error('[OVERALL-JS] Error loading overall:', error);
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading overall scores</p></div>');
                });
        },
        
        // Core API method - single source of truth for recent scores calls
        loadRecentScoresData: function(offset = 0, isInitialLoad = true) {
            // Validation (single place)
            if (!AppState.currentSelectedTournamentId || AppState.currentSelectedTournamentId.length < 6) {
                if (isInitialLoad) {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>No tournament selected</p></div>');
                }
                return Promise.reject('Invalid tournament ID');
            }
            
            // Prevent concurrent loading for pagination calls
            if (!isInitialLoad && TournamentInfo.isLoadingRecentScores) {
                return Promise.resolve(); // Return resolved promise to avoid errors
            }
            
            if (!isInitialLoad) {
                TournamentInfo.isLoadingRecentScores = true;
            }
            
            const params = this.buildBaseRequest(null, {
                GET_RECENT_SCORES: '1',
                OFFSET: offset
            });
            
            const loadingMessage = isInitialLoad ? 'Loading recent scores...' : null;
            const requestPromise = isInitialLoad 
                ? this.makeRequest(params, loadingMessage)
                : $.getJSON('GetLeaderboardSP.aspx', params);
            
            return requestPromise
                .done((response) => {
                    if (!isInitialLoad) {
                        TournamentInfo.isLoadingRecentScores = false;
                    }
                    
                    if (response.success && response.recentScores && response.recentScores.length > 0) {
                        if (isInitialLoad) {
                            // Initial load - setup and display
                            TournamentInfo.displayRecentScores(response.recentScores);
                        } else {
                            // Pagination load - append to existing
                            TournamentInfo.allRecentScores.push(...response.recentScores);
                            TournamentInfo.renderRecentScoresTable();
                            TournamentInfo.observeLastRecentScoreRow();
                        }
                    } else {
                        if (isInitialLoad) {
                            TournamentInfo.checkForEmptyContent();
                        } else {
                            // No more scores available, disable further loading
                            if (TournamentInfo.recentScoresObserver) {
                                TournamentInfo.recentScoresObserver.disconnect();
                                TournamentInfo.recentScoresObserver = null;
                            }
                        }
                    }
                })
                .fail((error) => {
                    if (!isInitialLoad) {
                        TournamentInfo.isLoadingRecentScores = false;
                    }
                    
                    const errorMsg = isInitialLoad 
                        ? '<div><p>Error loading recent scores</p></div>'
                        : 'Error loading more recent scores';
                        
                    if (isInitialLoad) {
                        $('#leaderboardContent').html(errorMsg);
                    } else {
                        console.error(errorMsg, error);
                    }
                });
        },
        
        // Setup method - one-time initialization concerns
        setupRecentScores: function() {
            // Stop infinite scroll and clean up any existing observers/state
            TournamentInfo.stopInfiniteScroll();
        },
        
        // Public methods - clean and focused
        loadRecentScores: function() {
            this.setupRecentScores();
            return this.loadRecentScoresData(0, true);
        },
        
        loadMoreRecentScores: function() {
            const offset = TournamentInfo.allRecentScores?.length || 0;
            return this.loadRecentScoresData(offset, false);
        },
        
        updateLeaderboard: function() {
            const selectedEvent = $('#eventFilters .filter-btn.active').data('value');
            const selectedDivision = $('#divisionFilters .filter-btn.active').data('value');
            const selectedRound = $('#roundFilters .filter-btn.active[data-filter="round"]').data('value');
            const selectedPlacement = $('#roundFilters .filter-btn.active[data-filter="placement"]').data('value');
            
            if (!selectedEvent || selectedEvent === '0') {
                $('#leaderboardContent').html('<p class="text-center text-muted">Please select an event to display the leaderboard</p>');
                return;
            }
            
            const params = this.buildBaseRequest(null, {
                EV: selectedEvent,
                DV: selectedDivision,
                RND: selectedRound
            });
            
            // Add placement format override if selected
            if (selectedPlacement) {
                params.FORCE_PLACEMENT = selectedPlacement;
            }
            
            // Add running order parameter if in running order mode
            if (AppState.currentDisplayMode === 'running-order') {
                params.GET_RUNNING_ORDER = '1';
            }
            
            // Add by division parameter if in by division mode
            if (AppState.currentDisplayMode === 'by-division') {
                params.GET_BY_DIVISION = '1';
            }
            
            return this.makeRequest(params, 'Loading leaderboard data...')
                .done(function(response) {
                    if (response.success && response.htmlContent) {
                        // Apply or remove round-format class based on placement format
                        if (response.placementFormat?.toUpperCase() === 'ROUND') {
                            $('#leaderboardContent').addClass('round-format');
                        } else {
                            $('#leaderboardContent').removeClass('round-format');
                        }
                        
                        // Handle placement format auto-selection
                        if (response.placementFormat) {
                            TournamentDataLoader.handlePlacementFormatResponse(response.placementFormat);
                        }
                        
                        $('#leaderboardContent').html(response.htmlContent);
                        
                        // Split Overall tables by round if this is an Overall event
                        if (selectedEvent === 'O') {
                            TournamentInfo.splitOverallTablesByRound(selectedRound);
                        }
                        
                        // Clean up empty columns and rows in the loaded content
                        $('#leaderboardContent table').each(function() {
                            TournamentInfo.removeEmptyColumnsAndRows(this);
                        });
                    } else {
                        $('#leaderboardContent').html('<p class="text-center text-danger">No data available for selected filters</p>');
                    }
                })
                .fail(function(xhr, status, error) {
                    $('#leaderboardContent').html('<p class="text-center text-danger">Error: ' + error + '</p>');
                });
        },
        
        loadAlphabeticalAllEvents: function(selectedRound) {
            // Get available events in S,T,J order - exclude Overall and NONE  
            const availableEvents = [];
            $('#eventFilters .filter-btn').each(function() {
                const eventCode = $(this).data('value');
                if (eventCode !== 'NONE' && eventCode !== 'O') {  // Exclude Overall from alphabetical view
                    availableEvents.push(eventCode);
                }
            });
            
            if (availableEvents.length === 0) {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>No events available</p></div>');
                return;
            }
            
            // Call LoadDvData for each event and combine results
            const divisionPromises = availableEvents.map(eventCode => {
                const params = this.buildBaseRequest(null, {
                    LOAD_ALL_DIVISIONS: '1',
                    EV: eventCode
                });
                
                return $.getJSON('GetLeaderboardSP.aspx', params).then(response => {
                    if (response.success && response.availableDivisions) {
                        return response.availableDivisions
                            .filter(div => div.code && div.code !== 'ALL' && div.code !== '0')
                            .map(div => ({
                                event: eventCode,
                                division: div.code,
                                eventName: TournamentInfo.getEventName(eventCode)
                            }));
                    }
                    return [];
                }).catch(() => []);
            });
            
            // Wait for all LoadDvData calls to complete
            return Promise.all(divisionPromises).then(results => {
                // Combine all actual event-division combinations
                const allCombinations = [];
                results.forEach(eventCombinations => {
                    allCombinations.push(...eventCombinations);
                });
                
                if (allCombinations.length === 0) {
                    TournamentInfo.checkForEmptyContent();
                    return;
                }
                
                // Remove duplicates by creating unique event-division combinations
                const uniqueCombinations = [];
                const seen = new Set();
                
                allCombinations.forEach(combo => {
                    const key = `${combo.event}-${combo.division}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueCombinations.push(combo);
                    }
                });
                
                // Sort combinations alphabetically by division, then by event (S,T,J order)
                const eventOrder = ['S', 'T', 'J'];
                uniqueCombinations.sort((a, b) => {
                    if (a.division !== b.division) {
                        return a.division.localeCompare(b.division);
                    }
                    return eventOrder.indexOf(a.event) - eventOrder.indexOf(b.event);
                });
                
                TournamentInfo.loadEventDivisionBatch(uniqueCombinations, 'Loading all existing divisions alphabetically...', selectedRound);
            });
        },
        
        loadByDivisionContent: function(selectedEvent, selectedDivision, selectedRound) {
            const params = this.buildBaseRequest(null, {
                EV: selectedEvent || '0',
                DV: selectedDivision || 'ALL',
                RND: selectedRound || '0',
                GET_BY_DIVISION: '1'
            });
            
            // Add placement format override if selected
            const selectedPlacement = $('#roundFilters .filter-btn.active[data-filter="placement"]').data('value');
            if (selectedPlacement) {
                params.FORCE_PLACEMENT = selectedPlacement;
            }
            
            // Use cancellable request like original
            const request = Utils.createCancellableRequest('GetLeaderboardSP.aspx', params);
            
            $('#leaderboardContent').html('<div class="text-center p-4"><p>Loading by-division view...</p></div>');
            
            return request.promise.done(function(response) {
                if (!request.isCurrent()) {
                    return;
                }
                
                if (response.success && response.htmlContent) {
                    $('#leaderboardContent').html(response.htmlContent);
                } else {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading by-division view</p></div>');
                }
            })
            .fail(function(error) {
                if (!request.isCurrent()) {
                    return;
                }
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error: Could not load by-division view</p></div>');
            });
        },

        loadDivisionsAfterPlacementFormat: function(prioritizedDivisions, sanctionId, skiYear, formatCode, selectedRound) {
            // Store all prioritized divisions for infinite scroll
            TournamentInfo.allPrioritizedDivisions = prioritizedDivisions;
            TournamentInfo.currentBatchIndex = 0;
            TournamentInfo.isLoading = false;
            
            // Load first batch of 5 divisions
            const firstBatch = prioritizedDivisions.slice(0, 5);
            TournamentInfo.currentBatchIndex = 5;
            TournamentInfo.loadDivisionsBatch(firstBatch, sanctionId, skiYear, formatCode, selectedRound);
            
            // Set up infinite scroll
            TournamentInfo.setupInfiniteScroll(sanctionId, skiYear, formatCode, selectedRound);
        },

        getPlacementFormatForEvent: function(eventCode, divisionCode, callback) {
            console.log('[PLACEMENT-DEBUG] Getting placement format for event:', eventCode, 'division:', divisionCode);
            // Make a quick API call to get placement format for this specific event+division
            const params = this.buildBaseRequest(null, {
                EV: eventCode,
                DV: divisionCode,  // Use specific division if provided
                RND: '0'    // Use round 0 to get general info
            });

            $.getJSON('GetLeaderboardSP.aspx', params)
                .done((response) => {
                    console.log('[PLACEMENT-DEBUG] Placement format response:', response.placementFormat);
                    if (response.success && response.placementFormat) {
                        console.log('[PLACEMENT-DEBUG] Calling handlePlacementFormatResponse with:', response.placementFormat);
                        this.handlePlacementFormatResponse(response.placementFormat, callback);
                    } else {
                        console.log('[PLACEMENT-DEBUG] No placement format returned for event', eventCode);
                        if (callback) callback();
                    }
                })
                .fail((error) => {
                    console.log('[PLACEMENT-DEBUG] Error getting placement format:', error);
                    if (callback) callback();
                });
        },

        handlePlacementFormatResponse: function(placementFormat, callback) {
            console.log('[PLACEMENT-DEBUG] handlePlacementFormatResponse called with:', placementFormat);
            console.log('[PLACEMENT-DEBUG] userSelectedPlacement flag:', window.userSelectedPlacement);
            
            // Don't override if user manually selected a placement format
            if (window.userSelectedPlacement) {
                console.log('[PLACEMENT-DEBUG] User has manually selected placement format, skipping auto-selection');
                if (callback) callback();
                return;
            }
            
            // Handle placement format auto-selection immediately (no delay needed since we're doing this first)
            const format = placementFormat?.toUpperCase();
            
            if (format === 'ROUND') {
                console.log('[PLACEMENT-DEBUG] Detected ROUND format, selecting Round View');
                const roundViewBtn = $('#roundFilters .filter-btn[data-filter="placement"][data-value="ROUND"]');
                if (roundViewBtn.length > 0 && !roundViewBtn.hasClass('active')) {
                    console.log('[PLACEMENT-DEBUG] Auto-selecting Round View button');
                    $('#roundFilters .filter-btn[data-filter="placement"]').removeClass('active');
                    roundViewBtn.addClass('active');
                }
            } else if (format === 'BEST' || format === 'FIRST') {
                console.log('[PLACEMENT-DEBUG] Detected', format, 'format, selecting Divisions View');
                const divisionsViewBtn = $('#roundFilters .filter-btn[data-filter="placement"][data-value="BEST"]');
                if (divisionsViewBtn.length > 0 && !divisionsViewBtn.hasClass('active')) {
                    console.log('[PLACEMENT-DEBUG] Auto-selecting Divisions View button');
                    $('#roundFilters .filter-btn[data-filter="placement"]').removeClass('active');
                    divisionsViewBtn.addClass('active');
                }
            } else {
                console.log('[PLACEMENT-DEBUG] Unknown placement format:', placementFormat);
            }
            
            // Call the callback to continue with loading divisions
            if (callback) {
                console.log('[PLACEMENT-DEBUG] Calling callback to continue loading divisions');
                callback();
            }
        },
        
        loadOverallBestOf: function(selectedDivision = null) {
            const divisionParam = selectedDivision || 'All';
            const params = this.buildBaseRequest(null, {
                EV: 'O',
                DV: divisionParam,
                RND: '0'
            });
            
            const loadingMessage = selectedDivision ? 
                `Calculating best overall scores for ${selectedDivision}...` : 
                'Calculating best overall scores...';
            
            return this.makeRequest(params, loadingMessage)
                .done((response) => {
                    console.log('[OVERALL-JS] GetLeaderboardSP response:', response);
                    if (response.success && response.htmlContent) {
                        // Work directly with server HTML (don't add dummy links)
                        TournamentInfo.calculateBestOfScores(response.htmlContent, selectedDivision);
                    } else {
                        TournamentInfo.checkForEmptyContent();
                    }
                })
                .fail((error) => {
                    console.error('[BESTOF-DEBUG] Error loading overall data:', error);
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading overall data</p></div>');
                });
        },
        
        loadDivisionAcrossEvents: function(divisionCode, roundCode) {
            // Get all available events (exclude Overall and NONE)
            const availableEvents = [];
            $('#eventFilters .filter-btn').each(function() {
                const eventCode = $(this).data('value');
                if (eventCode !== 'NONE' && eventCode !== 'O') {  // Exclude Overall from division view
                    availableEvents.push(eventCode);
                }
            });
            
            if (availableEvents.length === 0) {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>No events available</p></div>');
                return;
            }
            
            // Check each event to see which ones have this division
            const divisionPromises = availableEvents.map(eventCode => {
                const params = this.buildBaseRequest(null, {
                    EV: eventCode
                });
                
                return $.getJSON('GetLeaderboardSP.aspx', params).then(response => {
                    if (response.success && response.availableDivisions) {
                        const divisionExists = response.availableDivisions.some(div => div.code === divisionCode);
                        return divisionExists ? eventCode : null;
                    }
                    return null;
                }).catch(() => null);
            });
            
            // Wait for all event checks to complete
            return Promise.all(divisionPromises).then(results => {
                const eventsWithDivision = results.filter(event => event !== null);
                
                if (eventsWithDivision.length === 0) {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-warning"><p>Division "' + divisionCode + '" not found in any event</p></div>');
                    return;
                }
                
                // Create event-division combinations for batch loading
                const divisionBatch = eventsWithDivision.map(eventCode => ({
                    event: eventCode,
                    division: divisionCode,
                    eventName: TournamentInfo.getEventName(eventCode)
                }));
                
                TournamentInfo.loadEventDivisionBatch(divisionBatch, 'Loading division "' + divisionCode + '" across all events...', roundCode);
            });
        }
    };

    // Export to global scope
    window.TournamentDataLoader = TournamentDataLoader;
    
})(window);