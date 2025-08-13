/**
 * Tournament Navigation - Handles all navigation, URL management, and view switching
 * Manages tournament view navigation, URL parameters, and filter state restoration
 * Extracted from TournamentInfo for better organization
 */

(function(window) {
    'use strict';
    
    const TournamentNav = {
        
        bindTNav: function() {
            $('.tnav-btn').off('click.tnav');
            
            // Restore active state if we have one saved
            if (AppState.currentActiveView) {
                $('.tnav-btn[data-view="' + AppState.currentActiveView + '"]').addClass('active');
            }
            
            $('.tnav-btn').on('click.tnav', (e) => {
                e.preventDefault();
                
                const $btn = $(e.target);
                const view = $btn.data('view');
                const sanctionId = AppState.currentSelectedTournamentId;
                
                if (!sanctionId) {
                    console.error('No tournament selected');
                    return;
                }
                
                this.setActiveNavButton($btn, view);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                this.handleViewNavigation(view, sanctionId);
            });
        },

        setActiveNavButton: function($btn, view) {
            $('.tnav-btn').removeClass('active');
            $btn.addClass('active');
            AppState.currentActiveView = view;
        },

        handleViewNavigation: function(view, sanctionId) {
            const handlers = {
                'home': () => this.navigateToHome(sanctionId),
                'scores': () => this.navigateToScores(sanctionId),
                'running-order': () => this.navigateToRunningOrder(sanctionId),
                'by-division': () => this.navigateToByDivision(sanctionId),
                'entry-list': () => this.navigateToEntryList(sanctionId),
                'reports': () => this.navigateToReports(sanctionId),
                'legacy-view': () => this.navigateToLegacyView(sanctionId)
            };

            const handler = handlers[view];
            if (handler) {
                handler();
            } else {
                console.error('Unknown view:', view);
            }
        },

        navigateToHome: function(sanctionId) {
            const homeUrl = new URL(window.location);
            const homeParams = new URLSearchParams();
            
            // Preserve existing filter parameters
            ['YR', 'RG', 'search'].forEach(param => {
                const value = homeUrl.searchParams.get(param);
                if (value) homeParams.set(param, value);
            });
            
            if (sanctionId) {
                homeParams.set('sanctionId', sanctionId);
            }
            
            const homeUrlString = 'default.aspx' + (homeParams.toString() ? '?' + homeParams.toString() : '');
            window.location.href = homeUrlString;
        },

        navigateToScores: function(sanctionId) {
            const currentUrl = new URL(window.location);
            const params = { view: 'scores' };
            
            // Preserve existing parameters
            ['search', 'YR', 'RG', 'sanctionId'].forEach(param => {
                const value = currentUrl.searchParams.get(param);
                if (value) params[param] = value;
            });
            
            this.updateUrlParameters(params);
            AppState.currentDisplayMode = 'leaderboard';
            this.loadScores(sanctionId);
        },

        navigateToRunningOrder: function(sanctionId) {
            this.updateUrlParameters({ view: 'running-order', sid: sanctionId });
            AppState.currentDisplayMode = 'running-order';
            this.loadScores(sanctionId);
        },

        navigateToByDivision: function(sanctionId) {
            this.updateUrlParameters({ view: 'by-division', sid: sanctionId });
            AppState.currentDisplayMode = 'by-division';
            this.loadScores(sanctionId);
        },

        navigateToEntryList: function(sanctionId) {
            const entryListUrl = `TSkierListPro?SY=0&SID=${sanctionId}&TN=${encodeURIComponent(AppState.currentTournamentName)}&UN=0&FC=EL&FT=1&UT=0`;
            window.location.href = entryListUrl;
        },

        navigateToReports: function(sanctionId) {
            window.location.href = `TReports?SID=${sanctionId}`;
        },

        navigateToLegacyView: function(sanctionId) {
            window.location.href = `Tournament?SN=${sanctionId}&FM=1&SY=0`;
        },

        loadScores: function(sanctionId) {
            this.prepareScoresPageDOM();
            this.repositionTournamentPanel();
            this.loadTournamentInfo(sanctionId);
            this.initializeScoresData(sanctionId);
        },

        prepareScoresPageDOM: function() {
            // Move the leaderboard section into the tournament-list-container
            const leaderboardSection = $('#leaderboardSection');
            const tournamentListContainer = $('.tournament-list-container');
            
            if (leaderboardSection.parent()[0] !== tournamentListContainer[0]) {
                leaderboardSection.appendTo(tournamentListContainer);
            }
            
            // Hide tournament search elements
            $('#tFilters').hide();
            $('#tDesktop').hide();
            $('#tMobile').hide();
            $('#noResultsMessage').hide();
            
            // Show leaderboard section and clean up
            leaderboardSection.show();
            $('#leaderboardContent').removeClass('round-format');
        },

        repositionTournamentPanel: function() {
            const existingPanel = document.querySelector('#tInfo');
            if (!existingPanel) return;
            
            const leaderboardSection = $('#leaderboardSection')[0];
            
            if (window.innerWidth <= 1000) {
                // Mobile: Move panel above leaderboard filters
                const firstChild = leaderboardSection.firstChild;
                if (firstChild) {
                    leaderboardSection.insertBefore(existingPanel, firstChild);
                } else {
                    leaderboardSection.appendChild(existingPanel);
                }
            } else {
                // Desktop: Move panel to the side
                document.querySelector('.tournament-display').appendChild(existingPanel);
            }
        },

        loadTournamentInfo: function(sanctionId) {
            // Load tournament info panel - renderInfo will detect we're on scores page
            TournamentInfo.load(sanctionId, AppState.currentTrickVideoText);
        },

        initializeScoresData: function(sanctionId) {
            const skiYear = '0';
            const isNCWSA = sanctionId.length >= 3 && sanctionId.charAt(2).toUpperCase() === 'U';
            const formatCode = isNCWSA ? 'NCWL' : 'LBSP';
            
            // Store tournament info for filtering
            TournamentInfo.currentTournamentInfo = {
                sanctionId: sanctionId,
                name: AppState.currentTournamentName,
                skiYear: skiYear,
                formatCode: formatCode,
                availableDivisions: {} // Initialize cache for division data
            };
            
            // Load tournament data and setup filters
            $.getJSON('GetLeaderboardSP.aspx', {
                SID: sanctionId,
                SY: skiYear,
                TN: AppState.currentTournamentName,
                UN: '0',
                FC: formatCode,
                FT: '1',
                UT: '0'
            })
            .done((response) => {
                if (response.success) {
                    TournamentFilters.setupLeaderboardFilters(response);
                    // Preload division data for all events
                    this.preloadDivisionData(sanctionId, skiYear, AppState.currentTournamentName, formatCode);
                    this.restoreFilterStateFromUrl();
                    TournamentInfo.loadInitialContent(sanctionId, skiYear, formatCode);
                } else {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error: ' + response.error + '</p></div>');
                }
            })
            .fail((error) => {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading tournament information: ' + error + '</p></div>');
            });
        },

        preloadDivisionData: function(sanctionId, skiYear, tournamentName, formatCode) {
            console.log('[DIVISION-CACHE] Preloading division data for all events...');
            
            const events = ['S', 'T', 'J']; // Slalom, Trick, Jump
            const divisionPromises = events.map(eventCode => {
                return $.getJSON('GetLeaderboardSP.aspx', {
                    SID: sanctionId,
                    SY: skiYear,
                    TN: tournamentName,
                    FC: formatCode,
                    FT: '0',
                    UN: '0',
                    UT: '0',
                    EV: eventCode
                }).then(response => {
                    if (response.success && response.availableDivisions) {
                        console.log('[DIVISION-CACHE] Cached divisions for event', eventCode, ':', response.availableDivisions.length);
                        return {
                            eventCode: eventCode,
                            divisions: response.availableDivisions
                        };
                    }
                    return { eventCode: eventCode, divisions: [] };
                }).catch(error => {
                    console.warn('[DIVISION-CACHE] Failed to load divisions for event', eventCode, ':', error);
                    return { eventCode: eventCode, divisions: [] };
                });
            });

            // Wait for all division data to load
            Promise.all(divisionPromises).then(results => {
                // Store in tournament info cache
                results.forEach(result => {
                    TournamentInfo.currentTournamentInfo.availableDivisions[result.eventCode] = result.divisions;
                });
                console.log('[DIVISION-CACHE] All division data cached:', TournamentInfo.currentTournamentInfo.availableDivisions);
            });
        },

        updateUrlParameters: function(params) {
            // Update URL with current filter parameters without triggering page reload
            const url = new URL(window.location);
            
            // Add/update parameters
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    url.searchParams.set(key, params[key]);
                } else {
                    url.searchParams.delete(key);
                }
            });
            
            // Update browser URL without reload
            window.history.replaceState({}, '', url.toString());
        },

        updateTournamentSearchUrl: function() {
            // Get current tournament search filter states from active buttons
            const params = {};
            
            // Year filter
            const activeYearBtn = $('#tFilters .filter-btn.active[data-command-argument]');
            if (activeYearBtn.length > 0) {
                const yearValue = activeYearBtn.data('command-argument');
                if (yearValue && yearValue !== '0') {
                    params.YR = yearValue;
                }
            }
            
            // Region filter  
            const activeRegionBtn = $('#tFilters .filter-btn.active').not('[data-command-argument]').first();
            if (activeRegionBtn.length > 0) {
                const regionValue = activeRegionBtn.data('command-argument');
                if (regionValue && regionValue !== '') {
                    params.RG = regionValue;
                }
            }
            
            // Search text
            const searchText = $('#TB_SanctionID').val();
            if (searchText && searchText.trim() !== '') {
                params.search = searchText.trim();
            }
            
            this.updateUrlParameters(params);
        },

        updateLeaderboardUrl: function(selectedEvent, selectedDivision, selectedRound, selectedPlacement, selectedBestOf) {
            // Get existing URL parameters
            const currentUrl = new URL(window.location);
            const params = {};
            
            // Preserve existing non-filter parameters
            if (currentUrl.searchParams.get('search')) {
                params.search = currentUrl.searchParams.get('search');
            }
            if (currentUrl.searchParams.get('YR')) {
                params.YR = currentUrl.searchParams.get('YR');
            }
            if (currentUrl.searchParams.get('RG')) {
                params.RG = currentUrl.searchParams.get('RG');
            }
            if (currentUrl.searchParams.get('sanctionId')) {
                params.sanctionId = currentUrl.searchParams.get('sanctionId');
            }
            if (currentUrl.searchParams.get('view')) {
                params.view = currentUrl.searchParams.get('view');
            }
            
            // Add filter parameters if they have meaningful values
            if (selectedEvent && selectedEvent !== 'NONE') {
                params.event = selectedEvent;
            }
            if (selectedDivision && selectedDivision !== 'MOST_RECENT') {
                params.division = selectedDivision;
            }
            if (selectedRound && selectedRound !== '0') {
                params.round = selectedRound;
            }
            if (selectedPlacement) {
                params.placement = selectedPlacement;
            }
            if (selectedBestOf) {
                params.bestof = selectedBestOf;
            }
            
            // Update URL
            this.updateUrlParameters(params);
        },
        
        restoreFilterStateFromUrl: function() {
            const urlParams = new URLSearchParams(window.location.search);
            
            // First: Restore event filter only using applyFilterCombination
            const eventParam = urlParams.get('event');
            if (eventParam) {
                const eventButton = $('#eventFilters .filter-btn[data-value="' + eventParam + '"]');
                if (eventButton.length > 0) {
                    $('#eventFilters .filter-btn').removeClass('active');
                    eventButton.addClass('active');
                    // Use applyFilterCombination to handle the event change properly
                    TournamentInfo.applyFilterCombination();
                    
                    // Second: After delay, restore divisions and rounds
                    setTimeout(() => {
                        this.restoreRemainingFilters(urlParams);
                    }, 1000); // Give time for divisions to load
                    return;
                }
            }
            
            // If no event parameter, restore remaining filters immediately
            this.restoreRemainingFilters(urlParams);
        },
        
        restoreRemainingFilters: function(urlParams) {
            let hasFiltersToRestore = false;
            
            // Restore division filter
            const divisionParam = urlParams.get('division');
            if (divisionParam) {
                const divisionButton = $('#divisionFilters .filter-btn[data-value="' + divisionParam + '"]');
                if (divisionButton.length > 0) {
                    $('#divisionFilters .filter-btn').removeClass('active');
                    divisionButton.addClass('active');
                    hasFiltersToRestore = true;
                }
            }
            
            // Restore round filter
            const roundParam = urlParams.get('round');
            if (roundParam) {
                const roundButton = $('#roundFilters .filter-btn[data-filter="round"][data-value="' + roundParam + '"]');
                if (roundButton.length > 0) {
                    $('#roundFilters .filter-btn[data-filter="round"]').removeClass('active');
                    roundButton.addClass('active');
                    hasFiltersToRestore = true;
                }
            }
            
            // Restore placement filter
            const placementParam = urlParams.get('placement');
            if (placementParam) {
                const placementButton = $('#roundFilters .filter-btn[data-filter="placement"][data-value="' + placementParam + '"]');
                if (placementButton.length > 0) {
                    $('#roundFilters .filter-btn[data-filter="placement"]').removeClass('active');
                    placementButton.addClass('active');
                    hasFiltersToRestore = true;
                }
            }
            
            // Restore bestof filter
            const bestofParam = urlParams.get('bestof');
            if (bestofParam) {
                const bestofButton = $('#roundFilters .filter-btn[data-filter="bestof"][data-value="' + bestofParam + '"]');
                if (bestofButton.length > 0) {
                    $('#roundFilters .filter-btn[data-filter="bestof"]').removeClass('active');
                    bestofButton.addClass('active');
                    // Clear round selection when bestof is selected
                    $('#roundFilters .filter-btn[data-filter="round"]').removeClass('active');
                    hasFiltersToRestore = true;
                }
            }
            
            // Only apply filter combination if we actually restored some filters
            if (hasFiltersToRestore) {
                TournamentInfo.applyFilterCombination();
            }
        }
    };

    // Export to global scope
    window.TournamentNav = TournamentNav;
    
})(window);