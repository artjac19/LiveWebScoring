/**
 * Tournament Navigation - Handles all navigation, URL management, and view switching
 * Manages tournament view navigation, URL parameters, and filter state restoration
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
                
                // Skip navigation for Details button
                if ($btn.hasClass('details-btn')) {
                    return;
                }
                
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
            // Hide refresh button when going back to home
            const refreshContainer = document.getElementById('refreshContainer');
            if (refreshContainer) {
                refreshContainer.style.display = 'none';
            }
            
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
            // Hide refresh button for entry list view
            const refreshContainer = document.getElementById('refreshContainer');
            if (refreshContainer) {
                refreshContainer.style.display = 'none';
            }
            
            const entryListUrl = `TSkierListPro?SY=0&SID=${sanctionId}&TN=${encodeURIComponent(AppState.currentTournamentName)}&UN=0&FC=EL&FT=1&UT=0`;
            window.location.href = entryListUrl;
        },

        navigateToReports: function(sanctionId) {
            // Hide refresh button for reports view
            const refreshContainer = document.getElementById('refreshContainer');
            if (refreshContainer) {
                refreshContainer.style.display = 'none';
            }
            
            window.location.href = `TReports?SID=${sanctionId}`;
        },

        navigateToLegacyView: function(sanctionId) {
            // Hide refresh button for legacy view
            const refreshContainer = document.getElementById('refreshContainer');
            if (refreshContainer) {
                refreshContainer.style.display = 'none';
            }
            
            window.location.href = `Tournament?SN=${sanctionId}&FM=1&SY=0`;
        },

        loadScores: function(sanctionId) {
            this.prepareScoresPageDOM();
            this.repositionTournamentPanel();
            this.loadTournamentInfo(sanctionId);
            this.initializeScoresData(sanctionId);
            
            // Show refresh button for data views
            const refreshContainer = document.getElementById('refreshContainer');
            if (refreshContainer) {
                refreshContainer.style.display = 'flex';
                console.log('Refresh button should now be visible');
            }
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
                        return {
                            eventCode: eventCode,
                            divisions: response.availableDivisions
                        };
                    }
                    return { eventCode: eventCode, divisions: [] };
                }).catch(error => {
                    return { eventCode: eventCode, divisions: [] };
                });
            });

            Promise.all(divisionPromises).then(results => {
                // Store in tournament info cache
                results.forEach(result => {
                    TournamentInfo.currentTournamentInfo.availableDivisions[result.eventCode] = result.divisions;
                });
            });
        },

        updateUrlParameters: function(params) {
            // Update URL with current filter parameters without triggering page reload
            const url = new URL(window.location);
            
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
            
            const activeYearBtn = $('#tFilters .filter-btn.active[data-command-argument]');
            if (activeYearBtn.length > 0) {
                const yearValue = activeYearBtn.data('command-argument');
                if (yearValue && yearValue !== '0') {
                    params.YR = yearValue;
                }
            }
            
            const activeRegionBtn = $('#tFilters .filter-btn.active').not('[data-command-argument]').first();
            if (activeRegionBtn.length > 0) {
                const regionValue = activeRegionBtn.data('command-argument');
                if (regionValue && regionValue !== '') {
                    params.RG = regionValue;
                }
            }
            
            const searchText = $('#TB_SanctionID').val();
            if (searchText && searchText.trim() !== '') {
                params.search = searchText.trim();
            }
            
            this.updateUrlParameters(params);
        },

        updateLeaderboardUrl: function(selectedEvent, selectedDivision, selectedRound, selectedBestOf) {
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
            
            // Add filter parameters if they have values
            if (selectedEvent && selectedEvent !== 'NONE') {
                params.event = selectedEvent;
            }
            if (selectedDivision && selectedDivision !== 'MOST_RECENT') {
                params.division = selectedDivision;
            }
            if (selectedRound && selectedRound !== '0') {
                params.round = selectedRound;
            }
            if (selectedBestOf) {
                params.bestof = selectedBestOf;
            }
            
            this.updateUrlParameters(params);
        },
        
        restoreFilterStateFromUrl: function() {
            const urlParams = new URLSearchParams(window.location.search);
            
            // Restore event filter only using applyFilterCombination
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
    
    // Global refresh function
    window.refreshTournamentData = function() {
        if (!AppState.currentSelectedTournamentId) {
            return;
        }
        
        // Use the same function that filter buttons use to refresh data
        TournamentInfo.applyFilterCombination();
    };
    
    // Auto-refresh functionality
    const AutoRefresh = {
        intervalId: null,
        currentInterval: 0,
        isVisible: true,
        lastVisibleTime: Date.now(),
        visibilityCheckInterval: 1000, // Check every second
        maxInactiveTime: 3600000, // 1 hour (3600000 milliseconds)

        init: function() {
            // Setup visibility change detection
            this.setupVisibilityAPI();
            
            // Start visibility monitoring
            this.startVisibilityMonitoring();
            
            // Bind dropdown events
            this.bindDropdownEvents();
        },

        setupVisibilityAPI: function() {
            const self = this;
            
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    console.log('Tab/window hidden - starting invisibility timer from 0');
                    self.isVisible = false;
                    self.lastVisibleTime = Date.now(); // Reset timer to NOW when becoming hidden
                    // Auto-refresh continues running during grace period
                } else {
                    console.log('Tab/window visible - stopping invisibility timer');
                    self.isVisible = true;
                    // No resume/pause logic - auto-refresh never stopped
                }
            });
        },

        startVisibilityMonitoring: function() {
            const self = this;
            
            setInterval(function() {
                // Only check if auto-refresh is still active and tab is invisible
                if (!self.isVisible && self.currentInterval > 0) {
                    const invisibleTime = Date.now() - self.lastVisibleTime;
                    const invisibleSeconds = Math.floor(invisibleTime / 1000);
                    
                    if (invisibleTime > self.maxInactiveTime) {
                        console.log(`Tab invisible for ${invisibleSeconds}s (max: ${self.maxInactiveTime/1000}s) - forcing auto-refresh OFF`);
                        self.forceOff();
                    } else {
                        console.log(`Tab invisible for ${invisibleSeconds}s (max: ${self.maxInactiveTime/1000}s)`);
                    }
                }
            }, self.visibilityCheckInterval);
        },

        bindDropdownEvents: function() {
            const self = this;
            
            // Dropdown item selection
            $(document).on('click', '.refresh-dropdown-item', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const $clicked = $(this);
                const interval = parseInt($clicked.data('interval'));
                
                // Update active state immediately for visual feedback
                $('.refresh-dropdown-item').removeClass('active');
                $clicked.addClass('active');
                
                // Delay before hiding dropdown and setting interval
                setTimeout(function() {
                    self.setInterval(interval);
                    $('#refreshDropdown').hide();
                }, 300);
            });
            
            // Close dropdown when clicking outside
            $(document).on('click', function(e) {
                if (!$(e.target).closest('.refresh-container').length) {
                    $('#refreshDropdown').hide();
                }
            });
        },

        setInterval: function(milliseconds) {
            this.stop(); // Clear any existing timer
            this.currentInterval = milliseconds;
            
            // Update UI
            $('.refresh-dropdown-item').removeClass('active');
            $('.refresh-dropdown-item[data-interval="' + milliseconds + '"]').addClass('active');
            
            // Update indicator
            this.updateIndicator();
            
            // Start timer if interval > 0 (regardless of visibility)
            if (milliseconds > 0) {
                this.start();
                console.log('Auto-refresh interval set to:', milliseconds, 'ms');
            } else if (milliseconds === 0) {
                console.log('Auto-refresh set to OFF');
            }
        },

        updateIndicator: function() {
            const indicator = $('#refreshIndicator');
            
            if (this.currentInterval === 0) {
                indicator.hide();
            } else {
                let text = '';
                if (this.currentInterval === 300000) text = '5min';
                else if (this.currentInterval === 900000) text = '15min';
                else if (this.currentInterval === 1800000) text = '30min';
                else text = Math.round(this.currentInterval / 60000) + 'min';
                
                indicator.text(text).show();
            }
        },

        start: function() {
            if (this.currentInterval > 0) {
                const self = this;
                this.intervalId = setInterval(function() {
                    if (AppState.currentSelectedTournamentId) {
                        console.log('Auto-refreshing tournament data...');
                        window.refreshTournamentData();
                    }
                }, this.currentInterval);
                console.log('Auto-refresh timer started');
            }
        },

        stop: function() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                console.log('Auto-refresh timer stopped');
            }
        },


        forceOff: function() {
            // Permanently turn off auto-refresh after being invisible too long
            this.currentInterval = 0;
            this.stop();
            $('.refresh-dropdown-item').removeClass('active');
            $('.refresh-dropdown-item[data-interval="0"]').addClass('active');
            this.updateIndicator(); // Hide the indicator
            console.log('Auto-refresh PERMANENTLY turned OFF due to prolonged invisibility');
        },

        forceOffState: function() {
            // Set dropdown to "Off" when pausing (temporary)
            $('.refresh-dropdown-item').removeClass('active');
            $('.refresh-dropdown-item[data-interval="0"]').addClass('active');
            console.log('Dropdown forced to OFF state (temporary)');
        }
    };

    // Global dropdown toggle function
    window.toggleAutoRefreshDropdown = function() {
        $('#refreshDropdown').toggle();
    };
    
    // Initialize auto-refresh on page load
    $(document).ready(function() {
        AutoRefresh.init();
    });
    
})(window);