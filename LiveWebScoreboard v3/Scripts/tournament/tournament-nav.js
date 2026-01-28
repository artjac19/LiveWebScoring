/**
 * Tournament Navigation - Handles all navigation, URL management, and view switching
 * Manages tournament view navigation, URL parameters, and filter state restoration
 */

(function(window) {
    'use strict';
    
    const TournamentNav = {
        
        bindTNav: function() {
            $('.tnav-btn').off('click.tnav');
            $('.tnav-back-btn').off('click.tnav');

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

            // Back button handler - navigates to home/tournament list
            $('.tnav-back-btn').on('click.tnav', (e) => {
                e.preventDefault();
                const sanctionId = AppState.currentSelectedTournamentId;
                this.navigateToHome(sanctionId);
            });

            // Update back button visibility based on current view
            this.updateBackButtonVisibility();
        },

        setActiveNavButton: function($btn, view) {
            $('.tnav-btn').removeClass('active');
            $btn.addClass('active');
            AppState.currentActiveView = view;
            this.updateBackButtonVisibility();
        },

        updateBackButtonVisibility: function() {
            const backBtn = document.getElementById('tnavBackBtn');
            if (backBtn) {
                const view = AppState.currentActiveView;
                // Only show back button on these specific views
                const showOnViews = ['scores', 'running-order', 'by-division'];
                backBtn.style.display = showOnViews.includes(view) ? 'flex' : 'none';
            }
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

        loadView: function(view, sanctionId) {
            if (!sanctionId) return;

            AppState.currentActiveView = view;
            AppState.currentSelectedTournamentId = sanctionId;

            if (view === 'scores') {
                AppState.currentDisplayMode = 'leaderboard';
            } else if (view === 'running-order' || view === 'by-division') {
                AppState.currentDisplayMode = view;
            }

            this.loadScores(sanctionId);

            $('.tnav-btn').removeClass('active');
            $(`.tnav-btn[data-view="${view}"]`).addClass('active');
            this.updateBackButtonVisibility();
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
            this.loadView('scores', sanctionId);
        },

        navigateToRunningOrder: function(sanctionId) {
            this.updateUrlParameters({ view: 'running-order', sanctionId: sanctionId });
            this.loadView('running-order', sanctionId);
        },

        navigateToByDivision: function(sanctionId) {
            this.updateUrlParameters({ view: 'by-division', sanctionId: sanctionId });
            this.loadView('by-division', sanctionId);
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
            this.loadTournamentInfo(sanctionId);
            this.repositionTournamentPanel();
            this.initializeScoresData(sanctionId);
            
            // Show refresh button for data views
            const refreshContainer = document.getElementById('refreshContainer');
            if (refreshContainer) {
                refreshContainer.style.display = 'flex';
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
            $('#collegeTab').hide();
            
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
            TournamentInfo.load(sanctionId, AppState.currentTrickVideoText, true);
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
                    var hasUrlFilters = new URLSearchParams(window.location.search).has('event');
                    this.restoreFilterStateFromUrl();
                    if (!hasUrlFilters) {
                        TournamentInfo.loadInitialContent(sanctionId, skiYear, formatCode);
                        this._isRestoring = false;
                    }
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

            this._divisionDataPromise = Promise.all(divisionPromises).then(results => {
                // Store in tournament info cache
                results.forEach(result => {
                    TournamentInfo.currentTournamentInfo.availableDivisions[result.eventCode] = result.divisions;
                });
            });
        },

        updateUrlParameters: function(params) {
            const url = new URL(window.location);

            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    url.searchParams.set(key, params[key]);
                } else {
                    url.searchParams.delete(key);
                }
            });

            if (this._isRestoring) {
                window.history.replaceState({}, '', url.toString());
            } else {
                window.history.pushState({}, '', url.toString());
            }
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

            const eventParam = urlParams.get('event');
            console.log('[restore] event param:', eventParam);
            if (eventParam) {
                const eventButton = $('#eventFilters .filter-btn[data-value="' + eventParam + '"]');
                console.log('[restore] event button found:', eventButton.length > 0);
                if (eventButton.length > 0) {
                    $('#eventFilters .filter-btn').removeClass('active');
                    eventButton.addClass('active');

                    // Wait for division data instead of blind timeout
                    var divPromise = this._divisionDataPromise || Promise.resolve();
                    divPromise.then(() => {
                        console.log('[restore] divPromise resolved, cached divisions:', Object.keys(TournamentInfo.currentTournamentInfo?.availableDivisions || {}));
                        TournamentInfo.loadEventDetails(eventParam);
                        var divButtons = $('#divisionFilters .filter-btn').map(function() { return $(this).data('value'); }).get();
                        console.log('[restore] division buttons after loadEventDetails:', divButtons);
                        requestAnimationFrame(() => {
                            this.restoreRemainingFilters(urlParams);
                            TournamentInfo.applyFilterCombination();
                            this._isRestoring = false;
                        });
                    });
                    return;
                }
            }

            this.restoreRemainingFilters(urlParams);
            this._isRestoring = false;
        },
        
        restoreRemainingFilters: function(urlParams) {
            let hasFiltersToRestore = false;

            // Restore division filter
            const divisionParam = urlParams.get('division');
            console.log('[restore] division param:', divisionParam);
            if (divisionParam) {
                const divisionButton = $('#divisionFilters .filter-btn[data-value="' + divisionParam + '"]');
                console.log('[restore] division button found:', divisionButton.length > 0);
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

    // Browser back/forward: reload so directInitFromUrl renders from the URL
    window.addEventListener('popstate', function() {
        window.location.reload();
    });

    // Global refresh function
    window.refreshTournamentData = function() {
        if (!AppState.currentSelectedTournamentId) {
            return;
        }

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
                    self.isVisible = false;
                    self.lastVisibleTime = Date.now();
                } else {
                    self.isVisible = true;
                }
            });
        },

        startVisibilityMonitoring: function() {
            const self = this;
            
            setInterval(function() {
                // Only check if auto-refresh is still active and tab is invisible
                if (!self.isVisible && self.currentInterval > 0) {
                    if ((Date.now() - self.lastVisibleTime) > self.maxInactiveTime) {
                        self.forceOff();
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
                        window.refreshTournamentData();
                    }
                }, this.currentInterval);
            }
        },

        stop: function() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        },


        forceOff: function() {
            // Permanently turn off auto-refresh after being invisible too long
            this.currentInterval = 0;
            this.stop();
            $('.refresh-dropdown-item').removeClass('active');
            $('.refresh-dropdown-item[data-interval="0"]').addClass('active');
            this.updateIndicator();
        },

        forceOffState: function() {
            // Set dropdown to "Off" when pausing (temporary)
            $('.refresh-dropdown-item').removeClass('active');
            $('.refresh-dropdown-item[data-interval="0"]').addClass('active');
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