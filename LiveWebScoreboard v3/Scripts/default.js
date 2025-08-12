(function() {
    'use strict';
    // Core modules are now loaded via separate script files:
    // - CONFIG: core/config.js
    // - AppState: core/app-state.js  
    // - Utils: core/utils.js

    // DropdownMenu component extracted to Scripts/components/dropdown-menu.js


    const TournamentInfo = {
        load: function(sanctionId, trickVideoText) {
            // Remove existing panel only if selecting a different tournament
            if (AppState.currentSelectedTournamentId && AppState.currentSelectedTournamentId !== sanctionId) {
                const existingPanel = document.querySelector('#tInfo');
                if (existingPanel) {
                    existingPanel.remove();
                }
                // Reset active view when switching to a new tournament
                AppState.currentActiveView = 'home';
            }
            
            AppState.currentSelectedTournamentId = sanctionId;
            AppState.currentTrickVideoText = trickVideoText || '';
            
            // Set default active view to 'home' if no view is currently active
            if (!AppState.currentActiveView) {
                AppState.currentActiveView = 'home';
            }
            
            // Add sanctionId to URL parameters while preserving existing ones
            const currentUrl = new URL(window.location);
            const params = {};
            
            // Preserve existing search and filter parameters
            if (currentUrl.searchParams.get('search')) {
                params.search = currentUrl.searchParams.get('search');
            }
            if (currentUrl.searchParams.get('YR')) {
                params.YR = currentUrl.searchParams.get('YR');
            }
            if (currentUrl.searchParams.get('RG')) {
                params.RG = currentUrl.searchParams.get('RG');
            }
            
            // Add sanctionId parameter
            params.sanctionId = sanctionId;
            
            // Update URL
            this.updateUrlParameters(params);

            // Create panel and show loading state - renderInfo will handle this
            this.renderInfo();
                
            $.getJSON(CONFIG.AJAX_ENDPOINT, { sid: sanctionId })
                .done((response) => {
                    this.processResponse(response, trickVideoText);
                })
                .fail((xhr, status, error) => {
                    const errorHtml = '<p class="text-danger">Error loading tournament information: ' + error + '</p>';
                    this.renderInfo(errorHtml);
                });
        },

        processResponse: function(response, trickVideoText) {
            if (!response || typeof response !== 'object' || !response.Success) {
                const errorHtml = '<p class="text-danger">' + (response?.ErrorMessage || 'Error loading tournament information') + '</p>';
                this.renderInfo(errorHtml);
                return;
            }

            const combinedHtml = this.buildDetailsHtml(response, trickVideoText);
            this.renderInfo(combinedHtml);
            this.bindCollapseEvents(response);
            this.bindTNav();
        },

        buildDetailsHtml: function(response, trickVideoText) {
            let combinedHtml = '<div class="tournament-detail-panel">';
            let tournamentName = '';

            const detailsResult = this.buildDetailsSection(response, trickVideoText);
            tournamentName = detailsResult.tournamentName;
            
            // Store tournament name in AppState for leaderboard use
            AppState.currentTournamentName = tournamentName;
            
            if (tournamentName) {
                const sizeClass = tournamentName.length > 25 ? 'tournament-name-small' : 'tournament-name-large';
                combinedHtml += '<div class="tournament-name ' + sizeClass + '">' + tournamentName + '</div>';
            }
            
            combinedHtml += '<div class="tnav-buttons">' +
                '<button class="tnav-btn" data-view="scores">Scores</button>' +
                '<button class="tnav-btn" data-view="running-order">Running Order</button>' +
                '<button class="tnav-btn" data-view="entry-list">Entry List</button>' +
                '<button class="tnav-btn" data-view="reports">Reports</button>' +
                '<button class="tnav-btn" data-view="legacy-view">Legacy View</button>' +
                '<button class="tnav-btn" data-view="home">Home</button>' +
                '</div>';
            
            if (response.activeEvent && response.activeEvent.trim() !== "") {
                combinedHtml += '<div class="active-event-banner">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f8f9fa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="active-event-icon"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2.5 2.5"/></svg>' +
                    response.activeEvent +
                    '</div>';
            }
            
            combinedHtml += detailsResult.html;
            combinedHtml += this.buildOfficialsSection(response);
            combinedHtml += this.buildTeamsSection(response);
            combinedHtml += '</div>';
            return combinedHtml;
        },

        buildDetailsSection: function(response, trickVideoText) {
            // Skip fields already shown elsewhere in the UI
            const EXCLUDED_TOURNAMENT_FIELDS = new Set([
                'name',
                'sanction id',
                'sanctionid', 
                'sanction',
                'start date',
                'startdate',
                'location',
                'loc'
            ]);

            let html = '<div class="tournament-section-header" id="tournamentDetailsToggleHeader">';
            html += '<h5>Tournament Details</h5>';
            html += '<span id="tournamentDetailsChevron" class="section-chevron"><svg viewBox="0 0 20 20"><polyline points="5,8 10,13 15,8"/></svg></span>';
            html += '</div>';

            let tournamentName = '';
            
            html += '<div id="tournamentDetailsCollapse" class="tournament-section-collapsible">';
            if (response.tDetails && Array.isArray(response.tDetails) && response.tDetails.length > 0) {
                html += '<ul class="tournament-section-content">';
                for (let i = 0; i < response.tDetails.length; i++) {
                    const row = response.tDetails[i];
                    if (row && row.length >= 2 && row[0] && row[1]) {
                        const labelKey = row[0].toLowerCase().trim();
                        
                        if (labelKey.includes('name')) {
                            tournamentName = row[1];
                            continue;
                        }
                        
                        if (!EXCLUDED_TOURNAMENT_FIELDS.has(labelKey)) {
                            html += '<li>';
                            html += '<span class="tournament-section-label">- ' + row[0] + (row[0].trim().endsWith(':') ? ' ' : ': ') + '</span>';
                            html += '<span class="tournament-section-value">' + row[1] + '</span>';
                            html += '</li>';
                        }
                    }
                }
                html += '<li><span class="tournament-section-label">- Trick Video: </span><span class="tournament-section-value">' + (trickVideoText || '<span class="tournament-section-value muted">N/A</span>') + '</span></li>';
                html += '</ul>';
            } else {
                html += '<div class="tournament-section-error">No tournament details available.</div>';
            }
            html += '</div>';
            
            return { html: html, tournamentName: tournamentName };
        },

        buildOfficialsSection: function(response) {
            let html = '<div class="tournament-section-header with-border" id="officialsToggleHeader">';
            html += '<h5>Tournament Officials</h5>';
            html += '<span id="officialsChevron" class="section-chevron"><svg viewBox="0 0 20 20"><polyline points="5,8 10,13 15,8"/></svg></span>';
            html += '</div>';

            html += '<div id="officialsCollapse" class="tournament-section-collapsible">';
            if (response.officials && Array.isArray(response.officials) && response.officials.length > 0) {
                html += '<ul class="tournament-section-content">';
                for (let j = 0; j < response.officials.length; j++) {
                    const o = response.officials[j];
                    if (o && o.role) {
                        html += '<li>';
                        html += '<span class="tournament-section-label">- ' + o.role + ': </span>';
                        html += '<span class="tournament-section-value">' + (o.firstName ? o.firstName + ' ' : '') + (o.lastName || '') + '</span>';
                        html += '</li>';
                    }
                }
                html += '</ul>';
            } else {
                html += '<div class="tournament-section-error">No officials available.</div>';
            }
            html += '</div>';
            return html;
        },

        buildTeamsSection: function(response) {
            if (response.teams && Array.isArray(response.teams) && response.teams.length > 0) {
                let html = '<div class="tournament-section-header with-top-border" id="teamsToggleHeader">';
                html += '<h5>Participating Teams</h5>';
                html += '<span id="teamsChevron" class="section-chevron"><svg viewBox="0 0 20 20"><polyline points="5,8 10,13 15,8"/></svg></span>';
                html += '</div>';

                html += '<div id="teamsCollapse" class="tournament-section-collapsible">';
                html += '<ul class="teams-section-content">';
                for (let t = 0; t < response.teams.length; t++) {
                    const team = response.teams[t];
                    html += '<li>';
                    html += '<span class="team-name">- ' + team.Name + '</span>';
                    html += '</li>';
                }
                html += '</ul>';
                html += '</div>';
                return html;
            }
            return '';
        },

        renderInfo: function(combinedHtml) {
            // Find or create the unified tournament info panel
            let tournamentInfoPanel = document.querySelector('#tInfo');
            
            // Position the panel based on current context
            const leaderboardSection = document.getElementById('leaderboardSection');
            const isScoresPage = leaderboardSection && leaderboardSection.style.display !== 'none';
            
            // Create panel only if it doesn't exist
            if (!tournamentInfoPanel) {
                tournamentInfoPanel = document.createElement('div');
                tournamentInfoPanel.id = 'tInfo';
                tournamentInfoPanel.className = 'tournament-info';
            }
            
            // Always position/reposition the panel based on current context
            if (isScoresPage) {
                if (window.innerWidth <= 1000) {
                    const firstChild = leaderboardSection.firstChild;
                    if (firstChild) {
                        leaderboardSection.insertBefore(tournamentInfoPanel, firstChild);
                    } else {
                        leaderboardSection.appendChild(tournamentInfoPanel);
                    }
                } else {
                    document.querySelector('.tournament-display').appendChild(tournamentInfoPanel);
                }
            } else {
                if (window.innerWidth <= 1000) {
                    const selectedCard = document.querySelector('.mobile-tournament-card.selected');
                    if (selectedCard && selectedCard.parentNode) {
                        selectedCard.parentNode.insertBefore(tournamentInfoPanel, selectedCard.nextSibling);
                    } else {
                        document.querySelector('.tournament-display').appendChild(tournamentInfoPanel);
                    }
                } else {
                    document.querySelector('.tournament-display').appendChild(tournamentInfoPanel);
                }
            }
            
            // Show loading state if no content yet
            if (!combinedHtml) {
                tournamentInfoPanel.innerHTML = '<p>Loading tournament information...</p>';
            }
            
            // Update with actual content
            if (combinedHtml) {
                tournamentInfoPanel.innerHTML = combinedHtml;
                
                // Position panel based on viewport
                if (window.innerWidth <= 1000) {
                    // Mobile: Clear any desktop transform positioning and scroll to panel for better UX with offset
                    tournamentInfoPanel.style.transform = '';
                    tournamentInfoPanel.style.position = '';
                    setTimeout(() => {
                        const panelRect = tournamentInfoPanel.getBoundingClientRect();
                        const currentScroll = window.scrollY;
                        const targetY = currentScroll + panelRect.top - 140; 
                        window.scrollTo({ top: targetY, behavior: 'smooth' });
                    }, CONFIG.SCROLL_DELAY);
                } else {
                    // Desktop: Remove mobile compact styling and apply desktop positioning
                    $(tournamentInfoPanel).removeClass('compact-mobile-scores');
                    
                    const leaderboardSection = document.getElementById('leaderboardSection');
                    const isScoresPage = leaderboardSection && leaderboardSection.style.display !== 'none';
                    
                    tournamentInfoPanel.style.position = 'relative';
                    if (isScoresPage) {
                        // Scores page: Position at top
                        tournamentInfoPanel.style.transform = 'translateY(0px)';
                    } else {
                        // Tournament search page: Position at current scroll location
                        tournamentInfoPanel.style.transform = `translateY(${window.scrollY}px)`;
                    }
                }
            }
        },

        bindCollapseEvents: function(response) {
            const bindCollapseToggle = (headerSelector, collapseSelector, chevronSelector) => {
                $(headerSelector).on('click', function () {
                    const $collapse = $(collapseSelector);
                    const $chevron = $(chevronSelector);
                    if ($collapse.is(':visible')) {
                        $collapse.hide();
                        $chevron.removeClass('rotated');
                    } else {
                        $collapse.show();
                        $chevron.addClass('rotated');
                    }
                });
            };

            bindCollapseToggle('#tournamentDetailsToggleHeader', '#tournamentDetailsCollapse', '#tournamentDetailsChevron');
            bindCollapseToggle('#officialsToggleHeader', '#officialsCollapse', '#officialsChevron');
            
            // Check if panel is positioned above leaderboard filters (mobile scores view)
            const tournamentInfoPanel = document.querySelector('#tInfo');
            const leaderboardSection = document.getElementById('leaderboardSection');
            const isAboveLeaderboardFilters = tournamentInfoPanel && leaderboardSection && 
                                             tournamentInfoPanel.parentNode === leaderboardSection &&
                                             window.innerWidth <= 1000;
            
            if (isAboveLeaderboardFilters) {
                // Mobile scores view: Keep dropdowns collapsed and make content compact
                $('#tournamentDetailsCollapse').hide();
                $('#tournamentDetailsChevron').removeClass('rotated');
                $('#officialsCollapse').hide();
                $('#officialsChevron').removeClass('rotated');
                $('#teamsCollapse').hide();
                $('#teamsChevron').removeClass('rotated');
                
                // Make everything smaller for mobile scores view
                $(tournamentInfoPanel).addClass('compact-mobile-scores');
            } else {
                // Other views: Initialize chevrons to match their section visibility
                if ($('#tournamentDetailsCollapse').is(':visible')) {
                    $('#tournamentDetailsChevron').addClass('rotated');
                }
                if ($('#officialsCollapse').is(':visible')) {
                    $('#officialsChevron').addClass('rotated');
                }
            }
            
            if (response.teams && Array.isArray(response.teams) && response.teams.length > 0) {
                bindCollapseToggle('#teamsToggleHeader', '#teamsCollapse', '#teamsChevron');
                if (!isAboveLeaderboardFilters && $('#teamsCollapse').is(':visible')) {
                    $('#teamsChevron').addClass('rotated');
                }
            }
        },

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
            this.currentTournamentInfo = {
                sanctionId: sanctionId,
                name: AppState.currentTournamentName,
                skiYear: skiYear,
                formatCode: formatCode
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
                    this.setupLeaderboardFilters(response);
                    this.restoreFilterStateFromUrl();
                    this.loadInitialContent(sanctionId, skiYear, formatCode);
                } else {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error: ' + response.error + '</p></div>');
                }
            })
            .fail((error) => {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading tournament information: ' + error + '</p></div>');
            });
        },

        loadInitialContent: function(sanctionId, skiYear, formatCode) {
            const displayMode = AppState.currentDisplayMode;
            
            if (displayMode === 'running-order') {
                $('#leaderboardContent').html('<div class="text-center p-4"><p>Select an event to view running order...</p></div>');
            } else if (displayMode === 'by-division') {
                $('#leaderboardContent').html('<div class="text-center p-4"><p>Select a division to load information...</p></div>');
                this.applyFilterCombination();
            } else {
                // Load most recent divisions for leaderboard mode
                this.loadMostRecentDivisions(sanctionId, skiYear, formatCode, 'NONE', '0');
            }
        },

        loadMostRecentDivisions: function(sanctionId, skiYear, formatCode, eventCode, selectedRound) {
            return TournamentDataLoader.loadMostRecentDivisions(sanctionId, skiYear, formatCode, eventCode, selectedRound);
        },

        loadAlphabeticalDivisions: function(sanctionId, skiYear, formatCode, eventCode, selectedRound) {
            return TournamentDataLoader.loadAlphabeticalDivisions(sanctionId, skiYear, formatCode, eventCode, selectedRound);
        },

        loadRecentScores: function() {
            return TournamentDataLoader.loadRecentScores();
        },

        stopInfiniteScroll: function() {
            // Disconnect the intersection observer
            if (this.intersectionObserver) {
                this.intersectionObserver.disconnect();
                this.intersectionObserver = null;
            }
            
            // Clear the batch loading state variables
            this.allPrioritizedDivisions = null;
            this.currentBatchIndex = 0;
            this.isLoading = false;
        },

        displayRecentScores: function(recentScores) {
            // Store initial scores and set up pagination state
            this.allRecentScores = recentScores;
            this.currentRecentScoresIndex = 0;
            this.recentScoresOffset = 0; // Track how many records we've loaded
            this.isLoadingRecentScores = false;
            
            // Display first batch
            this.renderRecentScoresTable();
            
            // Set up infinite scroll for recent scores
            this.setupRecentScoresInfiniteScroll();
        },

        renderRecentScoresTable: function() {
            let html = '<div class="recent-scores-section">';
            html += '<table id="recentScoresTable">';
            html += '<tr class="table-header-row"><th>Time</th><th>Skier</th><th>Event</th><th>Score</th></tr>';
            
            this.allRecentScores.forEach((score, index) => {
                const timeAgo = this.formatTimeAgo(score.insertDate);
                const eventName = this.getEventName(score.event);
                
                // Create merged event column: [Event] [Division], [Round]
                const mergedEvent = `${eventName} ${score.division}, R${score.round}`;
                
                // Create clickable skier name that redirects directly to TRecap matching server format exactly
                const tournamentNameEncoded = encodeURIComponent(AppState.currentTournamentName);
                const eventCode = score.event.trim().charAt(0); // Get first letter of event name
                const trecapUrl = `Trecap?SID=${score.sanctionId}&SY=0&MID=${score.memberId}&DV=${score.division}&EV=${eventCode}&TN=${tournamentNameEncoded}&FC=LBSP&FT=0&RP=1&UN=0&UT=0&SN=${score.skierName}`;
                const skierLink = `<a href="#" onclick="window.location.href='${trecapUrl}'; return false;"><strong>${score.skierName}</strong></a>`;
                
                // Add a class to the last row for intersection observer
                const isLastRow = index === this.allRecentScores.length - 1;
                const rowClass = isLastRow ? ' class="recent-scores-last-row"' : '';
                
                html += `<tr${rowClass}>`;
                html += `<td><small>${timeAgo}</small></td>`;
                html += `<td>${skierLink}</td>`;
                html += `<td>${mergedEvent}</td>`;
                html += `<td>${score.eventScoreDesc}</td>`;
                html += '</tr>';
            });
            
            html += '</table>';
            html += '</div>';
            
            $('#leaderboardContent').html(html);
        },

        setupRecentScoresInfiniteScroll: function() {
            const self = this;
            
            // Clean up any existing observer
            if (this.recentScoresObserver) {
                this.recentScoresObserver.disconnect();
                this.recentScoresObserver = null;
            }
            
            // Create intersection observer to watch for last row coming into view
            this.recentScoresObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !self.isLoadingRecentScores) {
                        self.loadMoreRecentScores();
                    }
                });
            }, {
                rootMargin: '100px' // Trigger when row is 100px from being visible
            });
            
            // Start observing the last row if it exists
            this.observeLastRecentScoreRow();
        },

        observeLastRecentScoreRow: function() {
            if (!this.recentScoresObserver) return;
            
            const lastRow = document.querySelector('#recentScoresTable .recent-scores-last-row');
            if (lastRow) {
                this.recentScoresObserver.observe(lastRow);
            }
        },

        addOverallSkierLinks: function(htmlContent) {
            
            // Initialize global MID storage if not exists
            if (!window.leaderboardSkierMids) {
                window.leaderboardSkierMids = {};
            }
            
            // Create a temporary container to parse the HTML
            const $tempContainer = $('<div>').html(htmlContent);
            
            // Find all Overall tables and add links to skier names
            $tempContainer.find('table.division-section').each(function() {
                const $table = $(this);
                const headerText = $table.find('.table-header-row').text();
                
                // Only process Overall tables
                if (headerText.toLowerCase().includes('overall')) {
                    // Find all data rows (skip header rows)
                    $table.find('tr').not('.table-header-row').each(function() {
                        const $row = $(this);
                        const $firstCell = $row.find('td:first');
                        
                        if ($firstCell.length && $firstCell.find('a').length === 0) {
                            // This cell contains plain text skier name, convert to link
                            const skierName = $firstCell.find('b').text() || $firstCell.text().trim();
                            
                            if (skierName && !skierName.includes('No') && !skierName.includes('Error')) {
                                const tournamentName = encodeURIComponent(AppState.currentTournamentName);
                                const sanctionId = AppState.currentSelectedTournamentId;
                                
                                // Create the link (using dummy values for MID/DV - TRecap should still work)
                                const skierLink = `<a href="#" onclick="window.location.href='Trecap?SID=${sanctionId}&SY=0&MID=000000000&DV=XX&EV=S&TN=${tournamentName}&FC=LBSP&FT=0&RP=1&UN=0&UT=0&SN=${encodeURIComponent(skierName)}'; return false;"><strong>${skierName}</strong></a>`;
                                
                                $firstCell.html(skierLink);
                            }
                        } else if ($firstCell.length && $firstCell.find('a').length > 0) {
                            // This cell already has a link (from server), extract MID and store it
                            const existingLink = $firstCell.find('a');
                            const onclickAttr = existingLink.attr('onclick');
                            const skierName = existingLink.text().trim();
                            
                            if (onclickAttr && skierName) {
                                const midMatch = onclickAttr.match(/MID=([^&]+)/);
                                if (midMatch && midMatch[1] !== '000000000') {
                                    window.leaderboardSkierMids[skierName] = midMatch[1];
                                }
                            }
                        }
                    });
                }
            });
            
            return $tempContainer.html();
        },

        formatTimeAgo: function(dateString) {
            try {
                if (!dateString || dateString === '') return 'Unknown';
                
                const now = new Date();
                let scoreDate;
                
                // Handle .NET JavaScriptSerializer date format: /Date(timestamp)/
                if (typeof dateString === 'string' && dateString.startsWith('/Date(') && dateString.endsWith(')/')) {
                    // Extract the timestamp from /Date(1754687243000)/
                    const timestampMatch = dateString.match(/\/Date\((\d+)\)\//);
                    if (timestampMatch) {
                        const timestamp = parseInt(timestampMatch[1]);
                        scoreDate = new Date(timestamp);
                    } else {
                        return 'Invalid Date Format';
                    }
                } else {
                    // Try normal date parsing
                    scoreDate = new Date(dateString);
                }
                
                // Check if we have a valid date
                if (isNaN(scoreDate.getTime())) {
                    console.error('Invalid date after parsing:', dateString);
                    return 'Invalid Date';
                }
                
                const diffMs = now - scoreDate;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                
                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return `${diffMins}m ago`;
                if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
                return scoreDate.toLocaleDateString();
            } catch (e) {
                console.error('Error formatting date:', dateString, e);
                return 'Date Error';
            }
        },

        loadMoreRecentScores: function() {
            return TournamentDataLoader.loadMoreRecentScores();
        },

        getEventName: function(eventCode) {
            // Handle different possible event formats from database
            if (!eventCode) return 'Unknown';
            
            const code = eventCode.toString().toUpperCase();
            switch(code) {
                case 'S':
                case 'SLALOM': 
                    return 'Slalom';
                case 'T':
                case 'TRICK': 
                    return 'Trick';
                case 'J':
                case 'JUMP': 
                    return 'Jump';
                case 'O':
                case 'OVERALL': 
                    return 'Overall';
                default: 
                    return 'Unknown (' + eventCode + ')';
            }
        },

        setupRoundFilters: function(data, selectedEvent) {
            const roundFilters = $('#roundFilters');
            
            // Hide round filters for collegiate tournaments (NCWL format code)
            if (this.currentTournamentInfo && this.currentTournamentInfo.formatCode === 'NCWL') {
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

        setupLeaderboardFilters: function(data) {
            // Store tournament data for later use
            this.tournamentData = data;
            
            // Set appropriate title based on display mode
            const displayMode = AppState.currentDisplayMode || 'leaderboard';
            const titleText = displayMode === 'running-order' ? 'Running Order' : 'Leaderboard';
            $('#leaderboardTitle').text(data.tournamentName + ' - ' + data.sanctionId + ' ' + titleText);
            
            // Setup event filter bubbles
            const eventFilters = $('#eventFilters');
            eventFilters.empty();
            
            if (displayMode === 'running-order') {
                // Running order mode: only show individual events (S, T, J), no Mixed or Overall
                eventFilters.append('<button class="filter-btn" data-filter="event" data-value="NONE">None</button>');
                
                if (data.availableEvents && data.availableEvents.length > 0) {
                    data.availableEvents.forEach(event => {
                        // Only show individual events (S, T, J), exclude Overall (O)
                        if (event.code !== 'O') {
                            eventFilters.append(`<button class="filter-btn" data-filter="event" data-value="${event.code}">${event.name}</button>`);
                        }
                    });
                }
            } else if (displayMode === 'by-division') {
                // By-division mode: show all events including Overall, but no Mixed or None
                if (data.availableEvents && data.availableEvents.length > 0) {
                    data.availableEvents.forEach(event => {
                        eventFilters.append(`<button class="filter-btn" data-filter="event" data-value="${event.code}">${event.name}</button>`);
                    });
                }
            } else {
                // Leaderboard mode: show all options including Mixed and Overall
                eventFilters.append('<button class="filter-btn" data-filter="event" data-value="NONE">None</button>');
                eventFilters.append('<button class="filter-btn" data-filter="event" data-value="MIXED">Mixed</button>');
                
                if (data.availableEvents && data.availableEvents.length > 0) {
                    data.availableEvents.forEach(event => {
                        eventFilters.append(`<button class="filter-btn" data-filter="event" data-value="${event.code}">${event.name}</button>`);
                    });
                }
            }
            
            // Setup division filters based on display mode
            const divisionFilters = $('#divisionFilters');
            divisionFilters.empty();
            
            if (displayMode === 'running-order' || displayMode === 'by-division') {
                // Running order or by-division mode: only show "All" option as default
                divisionFilters.append('<button class="filter-btn active" data-filter="division" data-value="ALL">All</button>');
            } else {
                // Leaderboard mode: show Most Recent and Alphabetical
                divisionFilters.append('<button class="filter-btn active" data-filter="division" data-value="MOST_RECENT">Most Recent</button>');
                divisionFilters.append('<button class="filter-btn" data-filter="division" data-value="ALL">Alphabetical</button>');
            }
            // More division options will be populated dynamically
            
            // Load divisions from all events and add to filter
            // Only make the call if we have a valid tournament ID
            if (AppState.currentSelectedTournamentId && AppState.currentSelectedTournamentId.length >= 6) {
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
                    // Create a Set to track unique divisions
                    const uniqueDivisions = new Map();
                    
                    // Process all divisions and keep track of unique ones
                    response.availableDivisions.forEach(division => {
                        if (division.code && division.code !== 'ALL' && division.code !== '0') {
                            uniqueDivisions.set(division.code, division.name);
                        }
                    });
                    
                    // Add unique divisions to filter buttons
                    uniqueDivisions.forEach((name, code) => {
                        divisionFilters.append(`<button class="filter-btn" data-filter="division" data-value="${code}">${name}</button>`);
                    });
                    
                }
            })
            .fail((error) => {
                // Silently fail - division filters will just show default
            });
            }
           
            
            // Setup round filter bubbles dynamically
            this.setupRoundFilters(data, null);
            
            // Setup on-water display
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
            
            // Bind filter events
            this.bindFilterEvents();
        },


        bindFilterEvents: function() {
            const self = this;
            
            // Remove existing handlers to avoid duplicates
            $('.filter-bubbles .filter-btn').off('click.leaderboard');
            
            // Event filter clicks
            $('#eventFilters .filter-btn').on('click.leaderboard', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const $btn = $(this);
                const eventCode = $btn.data('value');
                
                // Update active state
                $('#eventFilters .filter-btn').removeClass('active');
                $btn.addClass('active');
                
                // Special handling for NONE filter - deactivate all other filters like tournament search screen
                if (eventCode === 'NONE') {
                    // Reset division to MOST_RECENT to always show Most Recent button
                    $('#divisionFilters .filter-btn').removeClass('active');
                    $('#divisionFilters .filter-btn[data-value="MOST_RECENT"]').addClass('active');
                    
                    // Reset round filters to defaults
                    $('#roundFilters .filter-btn').removeClass('active');
                    $('#roundFilters .filter-btn[data-filter="round"][data-value="0"]').addClass('active');
                    
                    // Don't load event details for NONE
                } else {
                    // Update round filters based on selected event
                    self.setupRoundFilters(self.tournamentData, eventCode);
                    
                    // Load event details if specific event is selected (for division options)
                    self.loadEventDetails(eventCode);
                }
                
                // Apply current filter combination
                self.applyFilterCombination();
            });
            
            // Division and round filter clicks
            $('#divisionFilters, #roundFilters').on('click.leaderboard', '.filter-btn', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const $btn = $(this);
                const filterType = $btn.data('filter');
                const filterValue = $btn.data('value');
                
                // For placement format and bestof buttons, handle differently
                if (filterType === 'placement') {
                    // Toggle active state for placement buttons only
                    $('#roundFilters .filter-btn[data-filter="placement"]').removeClass('active');
                    $btn.addClass('active');
                } else if (filterType === 'bestof') {
                    // Toggle active state for bestof button
                    $('#roundFilters .filter-btn[data-filter="bestof"]').removeClass('active');
                    $btn.addClass('active');
                    // Also clear any round filter selection when Best of is selected
                    $('#roundFilters .filter-btn[data-filter="round"]').removeClass('active');
                } else {
                    // Update active state within the same filter group (round or division)
                    $btn.siblings('[data-filter="' + filterType + '"]').removeClass('active');
                    $btn.addClass('active');
                    // Clear bestof selection when selecting individual rounds
                    if (filterType === 'round') {
                        $('#roundFilters .filter-btn[data-filter="bestof"]').removeClass('active');
                    }
                }
                
                // Apply current filter combination
                self.applyFilterCombination();
            });
        },

        applyFilterCombination: function() {
            Utils.cancelAllRequests();
            
            const filterState = this.getFilterState();
            this.updateLeaderboardUrl(filterState.selectedEvent, filterState.selectedDivision, filterState.selectedRound, filterState.selectedPlacement, filterState.selectedBestOf);
            
            // Handle special cases first
            if (AppState.currentDisplayMode === 'by-division') {
                this.loadByDivisionContent(filterState.selectedEvent, filterState.selectedDivision, filterState.selectedRound);
                return;
            }
            
            if (filterState.isMixed) {
                this.loadRecentScores();
                return;
            }
            
            if (filterState.isOverall && !filterState.hasDivision) {
                this.handleOverallEvent(filterState);
                return;
            }
            
            if (filterState.isMostRecent) {
                this.handleMostRecentView(filterState);
                return;
            }
            
            if (filterState.isAlphabetical) {
                this.handleAlphabeticalView(filterState);
                return;
            }
            
            if (filterState.hasDivision) {
                this.handleSpecificDivision(filterState);
                return;
            }
            
            if (filterState.hasEvent) {
                this.handleEventOnly(filterState);
                return;
            }
            
            // Fallback case
            $('#leaderboardContent').html('<div class="text-center p-4 text-muted"><p>Select filters to display leaderboard data</p></div>');
        },

        getFilterState: function() {
            const selectedEvent = $('#eventFilters .filter-btn.active').data('value');
            const selectedDivision = $('#divisionFilters .filter-btn.active').data('value');
            const selectedRound = $('#roundFilters .filter-btn.active[data-filter="round"]').data('value');
            const selectedPlacement = $('#roundFilters .filter-btn.active[data-filter="placement"]').data('value');
            const selectedBestOf = $('#roundFilters .filter-btn.active[data-filter="bestof"]').data('value');
            
            return {
                selectedEvent,
                selectedDivision,
                selectedRound,
                selectedPlacement,
                selectedBestOf,
                hasEvent: selectedEvent && selectedEvent !== 'NONE',
                hasDivision: selectedDivision && selectedDivision !== 'MOST_RECENT' && selectedDivision !== 'ALL',
                isAlphabetical: selectedDivision === 'ALL',
                isMostRecent: selectedDivision === 'MOST_RECENT',
                isMixed: selectedEvent === 'MIXED',
                isOverall: selectedEvent === 'O'
            };
        },

        handleOverallEvent: function(filterState) {
            if (filterState.selectedBestOf === 'BESTOF') {
                this.loadOverallBestOf();
            } else if (filterState.selectedRound && filterState.selectedRound != '0') {
                this.loadOverallAllDivisions(filterState.selectedRound);
            } else if (filterState.selectedRound == '0' && $('#roundFilters .filter-btn[data-filter="round"][data-value="0"]').hasClass('active')) {
                this.loadOverallAllDivisions('0');
            } else {
                // Default to Best of and auto-select the button
                $('#roundFilters .filter-btn[data-filter="bestof"]').addClass('active');
                $('#roundFilters .filter-btn[data-filter="round"]').removeClass('active');
                this.loadOverallBestOf();
            }
        },

        handleMostRecentView: function(filterState) {
            if (filterState.hasEvent && !filterState.isOverall) {
                this.loadMostRecentDivisions(AppState.currentSelectedTournamentId, "0", this.currentTournamentInfo.formatCode, filterState.selectedEvent, filterState.selectedRound);
            } else if (filterState.hasEvent && filterState.isOverall) {
                // Overall event - default to alphabetical instead
                $('#divisionFilters .filter-btn').removeClass('active');
                $('#divisionFilters .filter-btn[data-value="ALL"]').addClass('active');
                this.loadAlphabeticalDivisions(AppState.currentSelectedTournamentId, "0", this.currentTournamentInfo.formatCode, filterState.selectedEvent, filterState.selectedRound);
            } else {
                this.loadMostRecentDivisions(AppState.currentSelectedTournamentId, "0", this.currentTournamentInfo.formatCode, null, filterState.selectedRound);
            }
        },

        handleAlphabeticalView: function(filterState) {
            if (AppState.currentDisplayMode === 'running-order') {
                this.handleRunningOrderAlphabetical(filterState);
            } else {
                this.handleLeaderboardAlphabetical(filterState);
            }
        },

        handleRunningOrderAlphabetical: function(filterState) {
            if (filterState.hasEvent) {
                const requestData = {
                    SID: AppState.currentSelectedTournamentId,
                    SY: "0",
                    TN: AppState.currentTournamentName,
                    FC: this.currentTournamentInfo.formatCode,
                    FT: '0',
                    UN: '0', 
                    UT: '0',
                    EV: filterState.selectedEvent,
                    DV: 'ALL',
                    RND: filterState.selectedRound || '0',
                    GET_RUNNING_ORDER: '1'
                };
                
                $('#leaderboardContent').html('<div class="text-center p-4"><p>Loading running order...</p></div>');
                
                $.getJSON('GetLeaderboardSP.aspx', requestData)
                    .done((response) => {
                        if (response.success && response.htmlContent) {
                            $('#leaderboardContent').html(response.htmlContent);
                        } else {
                            $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>No running order data available</p></div>');
                        }
                    })
                    .fail(() => {
                        // Error handling removed - let content stay as-is
                    });
            } else {
                $('#leaderboardContent').html('<div class="text-center p-4"><p>Select an event to view running order...</p></div>');
            }
        },

        handleLeaderboardAlphabetical: function(filterState) {
            if (filterState.hasEvent) {
                this.loadAlphabeticalDivisions(AppState.currentSelectedTournamentId, "0", this.currentTournamentInfo.formatCode, filterState.selectedEvent, filterState.selectedRound);
            } else {
                this.loadAlphabeticalAllEvents(filterState.selectedRound);
            }
        },

        handleSpecificDivision: function(filterState) {
            if (filterState.hasEvent) {
                this.loadEventDivisionCombination(filterState.selectedEvent, filterState.selectedDivision, filterState.selectedRound);
            } else if (AppState.currentDisplayMode === 'running-order') {
                $('#leaderboardContent').html('<div class="text-center p-4"><p>Select an event to view running order...</p></div>');
            } else {
                this.loadDivisionAcrossEvents(filterState.selectedDivision, filterState.selectedRound);
            }
        },

        handleEventOnly: function(filterState) {
            if (filterState.isOverall) {
                this.loadOverallAllDivisions(filterState.selectedRound);
            } else {
                // Default to most recent for that event
                $('#divisionFilters .filter-btn').removeClass('active');
                $('#divisionFilters .filter-btn[data-value="MOST_RECENT"]').addClass('active');
                this.loadMostRecentDivisions(AppState.currentSelectedTournamentId, "0", this.currentTournamentInfo.formatCode, filterState.selectedEvent);
            }
        },

        loadByDivisionContent: function(selectedEvent, selectedDivision, selectedRound) {
            return TournamentDataLoader.loadByDivisionContent(selectedEvent, selectedDivision, selectedRound);
        },

        loadEventDivisionCombination: function(eventCode, divisionCode, roundCode) {
            // Show loading state
            $('#leaderboardContent').html('<div class="text-center p-4"><p>Loading ' + eventCode + ' ' + divisionCode + '...</p></div>');
            
            // Only make the call if we have a valid tournament ID
            if (!AppState.currentSelectedTournamentId || AppState.currentSelectedTournamentId.length < 6) {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>No tournament selected</p></div>');
                return;
            }
            
            // Check if division exists in the event by trying to load it
            $.getJSON('GetLeaderboardSP.aspx', {
                SID: AppState.currentSelectedTournamentId,
                SY: "0",
                TN: AppState.currentTournamentName,
                FC: this.currentTournamentInfo.formatCode,
                EV: eventCode
            })
            .done((response) => {
                if (response.success && response.availableDivisions) {
                    // Check if the division exists in this event
                    const divisionExists = response.availableDivisions.some(div => div.code === divisionCode);
                    
                    if (divisionExists) {
                        // Division exists - load the specific event+division combination
                        this.updateLeaderboard();
                    } else {
                        // Division doesn't exist in this event
                        const eventName = this.getEventName(eventCode);
                        // Skip empty divisions - don't show error for individual missing divisions
                    }
                } else {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error checking division availability</p></div>');
                }
            })
            .fail(() => {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading event data</p></div>');
            });
        },

        // Generic batch loader for event-division combinations
        loadEventDivisionBatch: function(combinations, loadingMessage, roundCode) {
            if (combinations.length === 0) {
                $('#leaderboardContent').html('<div class="text-center p-4 text-warning"><p>No event-division combinations available</p></div>');
                return;
            }
            
            // Show loading state
            $('#leaderboardContent').html('<div class="text-center p-4"><p>' + loadingMessage + '</p></div>');
            
            // Store for infinite scroll and load first batch
            this.allPrioritizedDivisions = combinations;
            this.currentBatchIndex = 0;
            this.isLoading = false;
            
            const firstBatch = combinations.slice(0, 5);
            this.currentBatchIndex = Math.min(5, combinations.length);
            this.loadDivisionsBatch(firstBatch, AppState.currentSelectedTournamentId, "0", this.currentTournamentInfo.formatCode, roundCode);
            
            // Set up infinite scroll if more than 5 combinations
            if (combinations.length > 5) {
                this.setupInfiniteScroll(AppState.currentSelectedTournamentId, "0", this.currentTournamentInfo.formatCode, roundCode);
            }
        },

        loadDivisionAcrossEvents: function(divisionCode, roundCode) {
            return TournamentDataLoader.loadDivisionAcrossEvents(divisionCode, roundCode);
        },

        loadAlphabeticalAllEvents: function(selectedRound) {
            return TournamentDataLoader.loadAlphabeticalAllEvents(selectedRound);
        },

        loadOverallAllDivisions: function(selectedRound) {
            return TournamentDataLoader.loadOverallAllDivisions(selectedRound);
            
            /* COMMENTED OUT - Original approach that loads individual divisions
            // Get all available divisions from the current tournament
            $.getJSON('GetLeaderboardSP.aspx', {
                SID: AppState.currentSelectedTournamentId,
                SY: "0",
                TN: AppState.currentTournamentName,
                FC: this.currentTournamentInfo.formatCode,
                FT: '0',
                UN: '0',
                UT: '0',
                LOAD_ALL_DIVISIONS: '1'
            })
            .done((response) => {
                if (response.success && response.availableDivisions && response.availableDivisions.length > 0) {
                    // Create Overall combinations for all available divisions
                    const overallCombinations = response.availableDivisions
                        .map(div => div.code) // Get division codes
                        .filter((div, index, array) => array.indexOf(div) === index) // Remove duplicates
                        .map(divCode => ({
                            event: 'O',
                            division: divCode,
                            eventName: 'Overall'
                        }));
                    
                    if (overallCombinations.length === 0) {
                        $('#leaderboardContent').html('<div class="text-center p-4 text-warning"><p>No overall divisions found</p></div>');
                        return;
                    }
                    
                    // Sort divisions alphabetically
                    overallCombinations.sort((a, b) => a.division.localeCompare(b.division));
                    
                    // Load all Overall divisions
                    this.loadEventDivisionBatch(overallCombinations, 'Loading all overall divisions...', selectedRound);
                } else {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-warning"><p>No overall divisions available</p></div>');
                }
            })
            .fail((error) => {
                console.error('Failed to load overall divisions:', error);
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading overall divisions</p></div>');
            });
            */
        },

        loadOverallBestOf: function() {
            console.log('[BESTOF-DEBUG] Loading Overall data same as individual rounds to get real MID links');
            return TournamentDataLoader.loadOverallBestOf();
        },

        calculateBestOfScores: function(htmlContent) {
            console.log('[BESTOF-DEBUG] Starting Best of calculation');
            
            // Create a temporary container to parse the HTML
            const $tempContainer = $('<div>').html(htmlContent);
            
            // Find all Overall tables
            const $overallTables = $tempContainer.find('.division-section').filter(function() {
                return $(this).find('.table-header-row').text().toLowerCase().includes('overall');
            });
            
            // Extract all skier data grouped by division
            const divisionData = {};
            
            $overallTables.each(function() {
                const $table = $(this);
                const headerText = $table.find('.table-header-row').text().toLowerCase();
                
                // Extract division from header
                const divisionMatch = headerText.match(/overall\s+([a-z0-9]+)/i);
                if (!divisionMatch) return;
                
                const division = divisionMatch[1].toUpperCase();
                
                if (!divisionData[division]) {
                    divisionData[division] = {};
                }
                
                // Process data rows
                $table.find('tr').not('.table-header-row').each(function() {
                    const $row = $(this);
                    const cells = $row.find('td');
                    
                    if (cells.length < 6) return; // Need at least name, round, overall, slalom, trick, jump
                    
                    const $firstCell = $(cells[0]);
                    const skierName = $firstCell.text().trim();
                    
                    // Extract MID from server-provided link (should be real MID from backend)
                    let memberID = null;
                    
                    // Check if first cell has a link with MID
                    const existingLink = $firstCell.find('a');
                    if (existingLink.length > 0) {
                        const onclickAttr = existingLink.attr('onclick') || '';
                        const hrefAttr = existingLink.attr('href') || '';
                        
                        // Try to extract MID from onclick or href
                        const midMatch = onclickAttr.match(/MID=([^&\s'"]+)/) || hrefAttr.match(/MID=([^&\s'"]+)/);
                        if (midMatch && midMatch[1] && midMatch[1] !== '000000000') {
                            memberID = midMatch[1];
                            console.log('[BESTOF-DEBUG] Found real MID for', skierName, ':', memberID);
                        }
                    }
                    
                    // If no MID found, log the cell content for debugging
                    if (!memberID) {
                        console.warn('[BESTOF-DEBUG] No MID found for skier:', skierName);
                        console.warn('[BESTOF-DEBUG] Cell HTML:', $firstCell.html());
                        memberID = 'NO_MID'; // Placeholder to identify missing MIDs
                    }
                    
                    const round = parseInt($(cells[1]).text().trim());
                    const overallScore = parseFloat($(cells[2]).text().trim()) || 0;
                    const slalomNops = parseFloat($(cells[3]).text().trim()) || 0;
                    const trickNops = parseFloat($(cells[4]).text().trim()) || 0;
                    const jumpNops = parseFloat($(cells[5]).text().trim()) || 0;
                    
                    if (!skierName || isNaN(round)) return;
                    
                    
                    if (!divisionData[division][skierName]) {
                        divisionData[division][skierName] = [];
                    }
                    
                    divisionData[division][skierName].push({
                        round: round,
                        overallScore: overallScore,
                        slalomNops: slalomNops,
                        trickNops: trickNops,
                        jumpNops: jumpNops,
                        memberID: memberID
                    });
                });
            });
            
            // Calculate best scores for each skier in each division
            this.generateBestOfTables(divisionData);
        },

        generateBestOfTables: function(divisionData) {
            console.log('[BESTOF-DEBUG] Generating Best of tables for divisions:', Object.keys(divisionData));
            
            let tablesHtml = '';
            
            // Process each division
            Object.keys(divisionData).sort().forEach(division => {
                const skiers = divisionData[division];
                const bestScores = [];
                
                // Calculate superscore for each skier (best of each event)
                Object.keys(skiers).forEach(skierName => {
                    const rounds = skiers[skierName];
                    
                    // Find the best score in each individual event across all rounds
                    let bestSlalom = Math.max(...rounds.map(r => r.slalomNops));
                    let bestTrick = Math.max(...rounds.map(r => r.trickNops));
                    let bestJump = Math.max(...rounds.map(r => r.jumpNops));
                    
                    // Calculate superscore as sum of best individual event scores
                    let superscore = bestSlalom + bestTrick + bestJump;
                    
                    // Find which rounds produced these best scores (for display)
                    let slalomRound = rounds.find(r => r.slalomNops === bestSlalom)?.round || 0;
                    let trickRound = rounds.find(r => r.trickNops === bestTrick)?.round || 0;
                    let jumpRound = rounds.find(r => r.jumpNops === bestJump)?.round || 0;
                    
                    // Get the MID from any round (should be the same across all rounds for this skier)
                    let memberID = rounds.find(r => r.memberID && r.memberID !== '000000000')?.memberID || '000000000';
                    
                    bestScores.push({
                        skierName: skierName,
                        superscore: superscore,
                        bestSlalom: bestSlalom,
                        bestTrick: bestTrick,
                        bestJump: bestJump,
                        slalomRound: slalomRound,
                        trickRound: trickRound,
                        jumpRound: jumpRound,
                        memberID: memberID
                    });
                });
                
                // Sort by superscore (highest first)
                bestScores.sort((a, b) => b.superscore - a.superscore);
                
                // Generate HTML table for this division
                tablesHtml += `
                    <table class="division-section" style="margin-bottom: 1rem;">
                        <tr class="table-header-row">
                            <td width="25%"><b>Overall ${division}</b></td>
                            <td>Overall</td><td>Slalom NOPS</td><td>Trick NOPS</td><td>Jump NOPS</td>
                        </tr>`;
                
                bestScores.forEach(skier => {
                    // Create clickable link using the memberID extracted during calculation
                    const tournamentNameEncoded = encodeURIComponent(AppState.currentTournamentName);
                    const sanctionId = AppState.currentSelectedTournamentId;
                    const trecapUrl = `Trecap?SID=${sanctionId}&SY=0&MID=${skier.memberID}&DV=${division}&EV=S&TN=${tournamentNameEncoded}&FC=LBSP&FT=0&RP=1&UN=0&UT=0&SN=${skier.skierName}`;
                    const skierLink = `<a href="#" onclick="window.location.href='${trecapUrl}'; return false;"><strong>${skier.skierName}</strong></a>`;
                    
                    tablesHtml += `
                        <tr>
                            <td>${skierLink}</td>
                            <td><b>${skier.superscore.toFixed(1)}</b></td>
                            <td>${skier.bestSlalom.toFixed(1)} (R${skier.slalomRound})</td>
                            <td>${skier.bestTrick.toFixed(1)} (R${skier.trickRound})</td>
                            <td>${skier.bestJump.toFixed(1)} (R${skier.jumpRound})</td>
                        </tr>`;
                });
                
                tablesHtml += '</table>';
            });
            
            // Display the generated tables
            $('#leaderboardContent').html(tablesHtml);
            
            // Check if we actually have any tables to display
            if (!tablesHtml.trim()) {
                this.checkForEmptyContent();
            }
            
            console.log('[BESTOF-DEBUG] Best of tables generated successfully');
        },

        checkForEmptyContent: function() {
            // Check if leaderboard content is empty or only contains loading messages
            const content = $('#leaderboardContent');
            const tables = content.find('table, .division-section');
            const hasData = tables.length > 0;
            
            if (!hasData) {
                content.html('<div class="text-center p-4"><p>No scores found</p></div>');
            }
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
            
            // Get active year filter
            const activeYearBtn = $('#tFilters .filter-btn.active');
            activeYearBtn.each(function() {
                const btnId = $(this).attr('id');
                if (btnId.includes('Recent')) {
                    params.year = '0';
                } else if (btnId.includes('Year')) {
                    const yearMatch = btnId.match(/Year(\d{4})/);
                    if (yearMatch) {
                        params.year = yearMatch[1].slice(-2);
                    }
                } else if (btnId.includes('East')) {
                    params.region = 'E';
                } else if (btnId.includes('South')) {
                    params.region = 'S';
                } else if (btnId.includes('Midwest')) {
                    params.region = 'M';
                } else if (btnId.includes('Central')) {
                    params.region = 'C';
                } else if (btnId.includes('West')) {
                    params.region = 'W';
                }
            });
            
            // Get search input value
            const searchInput = $('#TB_SanctionID').val();
            if (searchInput && searchInput.trim() !== '') {
                params.search = searchInput.trim();
            }
            
            // Update URL
            this.updateUrlParameters(params);
        },

        splitOverallTablesByRound: function(selectedRound) {
            
            // Find all division-section tables (Overall tables have this class)
            const divisionTables = $('.division-section');
            
            divisionTables.each((tableIndex, table) => {
                const $table = $(table);
                const headerRow = $table.find('tr.table-header-row');
                
                if (headerRow.length === 0) return;
                
                const headerText = headerRow.text().toLowerCase();
                console.log('[SPLIT-DEBUG] Table', tableIndex, 'header:', headerText);
                
                // Check if this is an Overall table
                if (!headerText.includes('overall')) {
                    console.log('[SPLIT-DEBUG] Not an Overall table, skipping');
                    return;
                }
                
                // Extract division from header pattern: "Overall OM - Round 1 - Sort by: BEST"
                const divisionMatch = headerText.match(/overall\s+([a-z0-9]+)\s+-/i);
                if (!divisionMatch) {
                    console.log('[SPLIT-DEBUG] Could not extract division from header');
                    return;
                }
                
                const division = divisionMatch[1].toUpperCase();
                console.log('[SPLIT-DEBUG] Extracted division:', division);
                
                // Get all data rows (skip header row)
                const dataRows = $table.find('tr').not('.table-header-row');
                
                if (dataRows.length <= 1) {
                    console.log('[SPLIT-DEBUG] Not enough data rows to split');
                    return;
                }
                
                // Group rows by round (round is in the 2nd column, index 1)
                const roundGroups = {};
                
                dataRows.each((rowIndex, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    
                    if (cells.length < 3) return; // Need at least name, round, score
                    
                    // Round is in column 1 (after skier name)
                    const roundCell = $(cells[1]);
                    const round = roundCell.text().trim();
                    
                    console.log('[SPLIT-DEBUG] Row', rowIndex, 'round:', round);
                    
                    
                    if (round && round.match(/^[0-9]+$/)) {
                        if (!roundGroups[round]) {
                            roundGroups[round] = [];
                        }
                        roundGroups[round].push($row.clone());
                    }
                });
                
                const rounds = Object.keys(roundGroups);
                console.log('[SPLIT-DEBUG] Found rounds:', rounds);
                
                if (rounds.length > 1) {
                    // Show all rounds as separate tables
                    rounds.sort((a, b) => parseInt(a) - parseInt(b));
                    
                    let newTablesHtml = '';
                    rounds.forEach(round => {
                        const rows = roundGroups[round];
                        const tableTitle = `Overall ${division} Round ${round}`;
                        
                        // Remove the round column from each row (column index 1)
                        const modifiedRows = rows.map(row => {
                            const $clonedRow = row.clone();
                            $clonedRow.find('td:eq(1)').remove(); // Remove round column
                            return $clonedRow[0].outerHTML;
                        });
                        
                        newTablesHtml += `
                            <table class="division-section" style="margin-bottom: 1rem;">
                                <tr class="table-header-row">
                                    <td width="35%"><b>${tableTitle} - Sort by: BEST</b></td>
                                    <td>Overall Score</td><td>Slalom NOPS</td><td>Trick NOPS</td><td>Jump NOPS</td>
                                </tr>
                                ${modifiedRows.join('')}
                            </table>
                        `;
                    });
                    
                    console.log('[SPLIT-DEBUG] Replacing table with', rounds.length, 'separate tables');
                    $table.replaceWith(newTablesHtml);
                } else {
                    console.log('[SPLIT-DEBUG] Only one round found, no splitting needed');
                }
            });
            
            // After generating all round tables, filter out unwanted rounds if specific round is selected
            if (selectedRound && selectedRound !== '0') {
                console.log('[SPLIT-DEBUG] Filtering to show only round', selectedRound);
                $('#leaderboardContent .division-section').each(function() {
                    const $table = $(this);
                    const headerText = $table.find('.table-header-row').text();
                    
                    // Check if this table is for the selected round
                    const roundMatch = headerText.match(/Round\s+(\d+)/i);
                    if (roundMatch) {
                        const tableRound = roundMatch[1];
                        console.log('[SPLIT-DEBUG] Comparing tableRound:', tableRound, 'type:', typeof tableRound, 'vs selectedRound:', selectedRound, 'type:', typeof selectedRound);
                        if (tableRound == selectedRound) {
                            console.log('[SPLIT-DEBUG] Keeping table for round', tableRound);
                        } else {
                            console.log('[SPLIT-DEBUG] Removing table for round', tableRound);
                            $table.remove();
                        }
                    }
                });
            }
        },

        loadEventDetails: function(eventCode) {
            // Load divisions for the selected event (just to populate division filter options)
            const sanctionId = AppState.currentSelectedTournamentId;
            const skiYear = "0";
            const tournamentName = AppState.currentTournamentName;
            
            // Only make the call if we have a valid tournament ID
            if (!sanctionId || sanctionId.length < 6) {
                return;
            }
            
            $.getJSON('GetLeaderboardSP.aspx', {
                SID: sanctionId,
                SY: skiYear,
                TN: tournamentName,
                FC: 'LBSP',
                UN: 0,
                UT: 0,
                EV: eventCode
            })
            .done((response) => {
                if (response.success && response.availableDivisions) {
                    // Update division filters with event-specific divisions, preserving current selection if possible
                    const currentDivisionValue = $('#divisionFilters .filter-btn.active').data('value');
                    const divisionFilters = $('#divisionFilters');
                    divisionFilters.empty();
                    
                    // Add division filter options based on display mode
                    if (AppState.currentDisplayMode === 'running-order' || AppState.currentDisplayMode === 'by-division') {
                        // Running order or by-division mode: only show "All" option
                        divisionFilters.append('<button class="filter-btn" data-filter="division" data-value="ALL">All</button>');
                    } else {
                        // Leaderboard mode: Add Most Recent and Alphabetical options (but not Most Recent for Overall)
                        if (eventCode !== 'O') {
                            divisionFilters.append('<button class="filter-btn" data-filter="division" data-value="MOST_RECENT">Most Recent</button>');
                        }
                        divisionFilters.append('<button class="filter-btn" data-filter="division" data-value="ALL">Alphabetical</button>');
                    }
                    
                    // Add event-specific divisions (excluding the "ALL" option from server)
                    response.availableDivisions.forEach(division => {
                        if (division.code !== 'ALL') {
                            divisionFilters.append(`<button class="filter-btn" data-filter="division" data-value="${division.code}">${division.name}</button>`);
                        }
                    });
                    
                    // Try to preserve the previous division selection, otherwise default appropriately
                    let targetButton = divisionFilters.find(`[data-value="${currentDivisionValue}"]`);
                    if (targetButton.length === 0) {
                        if (AppState.currentDisplayMode === 'running-order' || AppState.currentDisplayMode === 'by-division') {
                            // Running order or by-division mode: always default to "All"
                            targetButton = divisionFilters.find('[data-value="ALL"]');
                        } else {
                            // Leaderboard mode: For Overall, default to Alphabetical; for others, default to Most Recent
                            if (eventCode === 'O') {
                                targetButton = divisionFilters.find('[data-value="ALL"]');
                            } else {
                                targetButton = divisionFilters.find('[data-value="MOST_RECENT"]');
                            }
                        }
                    }
                    targetButton.addClass('active');
                }
            })
            .fail(() => {
                // On error, don't change anything
                console.log('Error loading event details for ' + eventCode);
            });
        },

        loadDivisionsBatch: function(divisions, sanctionId, skiYear, formatCode, selectedRound) {
            
            // Filter out events that don't have the selected round when a specific round is selected
            let validCombinations = divisions;
            if (selectedRound && selectedRound !== '0' && this.tournamentData && this.tournamentData.availableEvents) {
                const selectedRoundNum = parseInt(selectedRound);
                
                validCombinations = divisions.filter(combo => {
                    const event = this.tournamentData.availableEvents.find(e => e.code === combo.event);
                    if (!event) return false;
                    
                    const eventMaxRounds = event.rounds || 0;
                    
                    // Only include if the event has at least the selected round number
                    return selectedRoundNum <= eventMaxRounds;
                });
                
                // If all combinations were filtered out, show appropriate message
                if (validCombinations.length === 0) {
                    $('#leaderboardContent').html(`<div class="text-center p-4 text-muted"><p>No events have Round ${selectedRound}</p></div>`);
                    return;
                }
            }
            
            // Show loading message
            $('#leaderboardContent').html('<div class="text-center p-4"><p>Loading ' + validCombinations.length + ' divisions...</p></div>');
            
            // Prepare batch request data with valid combinations
            const batchData = validCombinations.map(combo => ({
                event: combo.event,
                division: combo.division
            }));
            
            // Get placement format override if selected
            const selectedPlacement = $('#roundFilters .filter-btn.active[data-filter="placement"]').data('value');
            
            // Make single API call with batch data
            const requestData = {
                SID: sanctionId,
                SY: skiYear,
                TN: AppState.currentTournamentName,
                UN: '0',
                FC: formatCode,
                FT: '0',
                UT: '0',
                RND: selectedRound,
                BATCH_DIVISIONS: JSON.stringify(batchData)
            };
            
            // Add placement format override if selected
            if (selectedPlacement) {
                requestData.FORCE_PLACEMENT = selectedPlacement;
            }
            
            const request = Utils.createCancellableRequest('GetLeaderboardSP.aspx', requestData);
            
            request.promise.done((response) => {
                // Check if this is still the current request
                if (!request.isCurrent()) {
                    console.log('Ignoring stale response from cancelled request');
                    return;
                }
                if (response.success && response.batchResults) {
                    
                    // Clear loading message
                    $('#leaderboardContent').html('');
                    
                    // Use flex layout for: ROUND format OR single round tournaments
                    const useFlexLayout = response.batchResults.some(result => {
                        if (result.placementFormat?.toUpperCase() === 'ROUND') return true;
                        
                        const event = TournamentInfo.tournamentData?.availableEvents?.find(e => e.code === result.eventCode);
                        return event?.rounds <= 1;
                    });
                    
                    if (useFlexLayout) {
                        $('#leaderboardContent').addClass('round-format');
                    } else {
                        $('#leaderboardContent').removeClass('round-format');
                    }
                    
                    // Add each division's results, filtering out empty/error results
                    response.batchResults.forEach((result, index) => {
                        // DEBUG: Log what's being filtered
                        console.log('[DEBUG] Batch result for ' + result.event + ' ' + result.division + ':');
                        console.log('  success: ' + result.success);
                        console.log('  htmlContent length: ' + (result.htmlContent ? result.htmlContent.length : 'null'));
                        console.log('  contains NO: ' + (result.htmlContent ? result.htmlContent.includes('NO') : 'false'));
                        console.log('  contains SCORES FOUND: ' + (result.htmlContent ? result.htmlContent.includes('SCORES FOUND') : 'false'));
                        
                        if (result.success && result.htmlContent && 
                            !(result.htmlContent.includes('NO') && 
                            result.htmlContent.includes('SCORES FOUND'))) {
                            // For ROUND format, append content directly (no wrapper div)
                            $('#leaderboardContent').append(result.htmlContent);
                            
                            // Clean up empty columns and empty rows in all tables
                            $('#leaderboardContent table').each(function() {
                                TournamentInfo.removeEmptyColumnsAndRows(this);
                            });
                        }
                    });
                    
                    // Start observing the last element for infinite scroll
                    TournamentInfo.observeLastElement();
                    
                    // Check if we have fewer than 5 visible divisions and more to load
                    const visibleDivisions = $('#leaderboardContent .division-section').length;
                    if (visibleDivisions < 5 && TournamentInfo.hasMoreDivisions()) {
                        // Automatically load more to ensure we have at least 5 visible
                        setTimeout(() => {
                            TournamentInfo.loadNextBatch(sanctionId, skiYear, formatCode, selectedRound);
                        }, 100);
                    }
                } else {
                    // Batch loading complete - check if we have any content at all
                    setTimeout(() => this.checkForEmptyContent(), 100);
                }
            })
            .fail((error) => {
                // Check if this is still the current request before showing error
                if (!request.isCurrent()) {
                    console.log('Ignoring error from cancelled request');
                    return;
                }
                // Error handling removed - let content stay as-is
            });
        },

        setupInfiniteScroll: function(sanctionId, skiYear, formatCode, selectedRound) {
            const self = this;
            
            // Clean up any existing observer
            if (this.intersectionObserver) {
                this.intersectionObserver.disconnect();
                this.intersectionObserver = null;
            }
            
            // Create intersection observer to watch for last element coming into view
            this.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !self.isLoading && self.hasMoreDivisions()) {
                        self.loadNextBatch(sanctionId, skiYear, formatCode, selectedRound);
                    }
                });
            }, {
                rootMargin: '200px' // Trigger when element is 200px from being visible
            });
            
            // Start observing the last division element if it exists
            this.observeLastElement();
        },

        observeLastElement: function() {
            if (!this.intersectionObserver) return;
            
            const lastDivisionElement = document.querySelector('#leaderboardContent .division-section:last-child');
            if (lastDivisionElement) {
                this.intersectionObserver.observe(lastDivisionElement);
            }
        },

        hasMoreDivisions: function() {
            return this.allPrioritizedDivisions && this.currentBatchIndex < this.allPrioritizedDivisions.length;
        },

        loadNextBatch: function(sanctionId, skiYear, formatCode, selectedRound) {
            if (this.isLoading || !this.hasMoreDivisions()) {
                return;
            }
            
            this.isLoading = true;
            
            // Get next 5 divisions
            const nextBatch = this.allPrioritizedDivisions.slice(this.currentBatchIndex, this.currentBatchIndex + 5);
            
            if (nextBatch.length === 0) {
                this.isLoading = false;
                return;
            }
            
            // Add loading indicator
            $('#leaderboardContent').append('<div id="batchLoading" class="text-center p-3"><p>Loading more divisions...</p></div>');
            
            // Load the batch - batch index will be updated on success
            this.loadDivisionsBatchAppend(nextBatch, sanctionId, skiYear, formatCode, selectedRound);
        },

        loadDivisionsBatchAppend: function(divisions, sanctionId, skiYear, formatCode, selectedRound) {
            const self = this;
            
            // Filter out events that don't have the selected round when a specific round is selected
            let validCombinations = divisions;
            if (selectedRound && selectedRound !== '0' && this.tournamentData && this.tournamentData.availableEvents) {
                const selectedRoundNum = parseInt(selectedRound);
                
                validCombinations = divisions.filter(combo => {
                    const event = this.tournamentData.availableEvents.find(e => e.code === combo.event);
                    if (!event) return false;
                    
                    const eventMaxRounds = event.rounds || 0;
                    
                    // Only include if the event has at least the selected round number
                    return selectedRoundNum <= eventMaxRounds;
                });
                
                // If no valid combinations, just remove the loading indicator
                if (validCombinations.length === 0) {
                    $('#batchLoading').remove();
                    return;
                }
            }
            
            // Prepare batch request data with valid combinations
            const batchData = validCombinations.map(combo => ({
                event: combo.event,
                division: combo.division
            }));
            
            // Get placement format override if selected
            const selectedPlacement = $('#roundFilters .filter-btn.active[data-filter="placement"]').data('value');
            
            // Make single API call with batch data
            const requestData = {
                SID: sanctionId,
                SY: skiYear,
                TN: AppState.currentTournamentName,
                UN: '0',
                FC: formatCode,
                FT: '0',
                UT: '0',
                RND: selectedRound,
                BATCH_DIVISIONS: JSON.stringify(batchData)
            };
            
            // Add placement format override if selected
            if (selectedPlacement) {
                requestData.FORCE_PLACEMENT = selectedPlacement;
            }
            
            $.getJSON('GetLeaderboardSP.aspx', requestData)
            .done((response) => {
                // Remove loading indicator
                $('#batchLoading').remove();
                
                if (response.success && response.batchResults) {
                    
                    // Use flex layout for: ROUND format OR single round tournaments
                    const useFlexLayout = response.batchResults.some(result => {
                        if (result.placementFormat?.toUpperCase() === 'ROUND') return true;
                        
                        const event = TournamentInfo.tournamentData?.availableEvents?.find(e => e.code === result.eventCode);
                        return event?.rounds <= 1;
                    });
                    
                    if (useFlexLayout) {
                        $('#leaderboardContent').addClass('round-format');
                    } else {
                        $('#leaderboardContent').removeClass('round-format');
                    }
                    
                    // Append each division's results, filtering out empty/error results
                    response.batchResults.forEach((result) => {
                        if (result.success && result.htmlContent && 
                            !(result.htmlContent.includes('NO') && 
                            result.htmlContent.includes('SCORES FOUND'))) {
                            // For ROUND format, append content directly (no wrapper div)
                            $('#leaderboardContent').append(result.htmlContent);
                            
                            // Clean up empty columns and rows in all tables
                            $('#leaderboardContent table').each(function() {
                                self.removeEmptyColumnsAndRows(this);
                            });
                        }
                    });
                    
                    // Only update batch index on successful load
                    self.currentBatchIndex += 5;
                    
                    // Update observer to watch the new last element
                    self.observeLastElement();
                    
                }
                
                self.isLoading = false;
            })
            .fail((error) => {
                $('#batchLoading').remove();
                self.isLoading = false;
                // Don't update batch index on failure - divisions can be retried
            });
        },

        removeEmptyColumnsAndRows: function(tableElement) {
            const rows = Array.from(tableElement.querySelectorAll('tr'));
            if (rows.length === 0) return;
            
            // First, remove empty rows (rows with only empty or whitespace cells)
            rows.forEach(row => {
                let isEmpty = true;
                const cells = Array.from(row.children);
                
                for (let cell of cells) {
                    // Check if cell has any meaningful content (text, images, or other elements)
                    const hasText = cell.textContent.trim() !== '';
                    const hasImages = cell.querySelector('img') !== null;
                    const hasOtherElements = cell.querySelector('*') !== null;
                    
                    if (hasText || hasImages || hasOtherElements) {
                        isEmpty = false;
                        break;
                    }
                }
                
                if (isEmpty) {
                    row.remove();
                }
            });
            
            // Get remaining rows after empty row removal
            const remainingRows = Array.from(tableElement.querySelectorAll('tr'));
            if (remainingRows.length === 0) return;
            
            const maxCols = Math.max(...remainingRows.map(row => row.children.length));
            
            // Check each column from right to left (so removal doesn't affect indices)
            for (let colIndex = maxCols - 1; colIndex >= 0; colIndex--) {
                let columnIsEmpty = true;
                
                // Check if this column is empty in all remaining rows
                for (let row of remainingRows) {
                    const cell = row.children[colIndex];
                    if (cell) {
                        // Never remove columns that have headers (th elements)
                        if (cell.tagName.toLowerCase() === 'th') {
                            columnIsEmpty = false;
                            break;
                        }
                        
                        // Check for meaningful content more thoroughly
                        const hasText = cell.textContent.trim() !== '';
                        const hasImages = cell.querySelector('img') !== null;
                        const hasOtherElements = cell.querySelector('*:not(br)') !== null; // Ignore empty <br> tags
                        
                        if (hasText || hasImages || hasOtherElements) {
                            columnIsEmpty = false;
                            break;
                        }
                    }
                }
                
                // Remove this column from all rows if it's empty
                if (columnIsEmpty) {
                    remainingRows.forEach(row => {
                        if (row.children[colIndex]) {
                            row.children[colIndex].remove();
                        }
                    });
                }
            }
        },

        updateLeaderboard: function() {
            return TournamentDataLoader.updateLeaderboard();
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
                    this.applyFilterCombination();
                    
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
                this.applyFilterCombination();
            }
        }
    };

    // Export TournamentInfo to global scope for component access
    window.TournamentInfo = TournamentInfo;

    // TournamentList component extracted to Scripts/components/tournament-list.js

    document.addEventListener('DOMContentLoaded', function() {
        // Component initialization moved to respective component files
        
        // Ensure tournament search elements are visible on page load (only on mobile)
        if (window.innerWidth <= 1000) {
            $('#tMobile').show();
        }

        // Read URL parameters on page load and populate search input
        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('search');
        if (searchParam) {
            $('#TB_SanctionID').val(searchParam);
        }
        
        // Restore selected tournament if sanctionId parameter exists
        const sanctionIdParam = urlParams.get('sanctionId');
        const viewParam = urlParams.get('view');
        if (sanctionIdParam) {
            // Wait for tournament list to load, then select the tournament
            setTimeout(function() {
                TournamentList.selectTournamentFromUrl(sanctionIdParam, viewParam);
            }, 250);
        }
        
        // Search input field - update URL as user types
        $('#TB_SanctionID').on('input keyup', function() {
            // Debounce the URL updates
            clearTimeout(window.searchInputTimeout);
            window.searchInputTimeout = setTimeout(function() {
                const searchValue = $('#TB_SanctionID').val().trim();
                if (searchValue) {
                    TournamentInfo.updateUrlParameters({ search: searchValue });
                } else {
                    // Clear search parameter if input is empty
                    TournamentInfo.updateUrlParameters({});
                }
            }, 500);
        });
    });

})();
