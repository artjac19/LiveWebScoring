(function() {
    'use strict';
    const CONFIG = {
        MOBILE_BREAKPOINT: 1000,
        ANIMATION_DURATION: 300,
        SCROLL_DELAY: 57,
        AJAX_ENDPOINT: "TDetails.aspx",
        RESIZE_DEBOUNCE: 250
    };

    const AppState = {
        currentSelectedTournamentId: '',
        currentTournamentName: '',
        currentTrickVideoText: '',
        lastKnownMobile: false,
        currentActiveView: '',
        pendingRequests: new Set(),
        currentRequestId: 0
    };

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
        }
    };

    const DropdownMenu = {
        init: function() {
            this.button = document.getElementById('dropdownResources');
            this.menu = document.querySelector('.resources-menu');
            if (this.button && this.menu) {
                this.button.addEventListener('click', this.handleButtonClick.bind(this));
                window.addEventListener('click', this.handleWindowClick.bind(this));
            }
        },

        handleButtonClick: function(event) {
            event.stopPropagation();
            this.menu.classList.contains('active') ? this.close() : this.open();
        },

        handleWindowClick: function(event) {
            if (this.menu.classList.contains('active') && !this.button.contains(event.target)) {
                this.close();
            }
        },

        open: function() {
            this.menu.style.visibility = 'visible';
            this.menu.classList.add('active');
        },

        close: function() {
            if (this.menu && this.menu.classList.contains('active')) {
                this.menu.classList.remove('active');
                this.menu.classList.add('closing');
                setTimeout(() => {
                    this.menu.classList.remove('closing');
                    this.menu.style.visibility = 'hidden';
                }, CONFIG.ANIMATION_DURATION);
            }
        }
    };


    const TournamentInfo = {
        load: function(sanctionId, trickVideoText) {
            // Remove existing panel only if selecting a different tournament
            if (AppState.currentSelectedTournamentId && AppState.currentSelectedTournamentId !== sanctionId) {
                const existingPanel = document.querySelector('#tInfo');
                if (existingPanel) {
                    existingPanel.remove();
                }
            }
            
            AppState.currentSelectedTournamentId = sanctionId;
            AppState.currentTrickVideoText = trickVideoText || '';

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
            
            $('.tnav-btn').on('click.tnav', function(e) {
                e.preventDefault();
                
                const $btn = $(this);
                const view = $btn.data('view');
                const sanctionId = AppState.currentSelectedTournamentId;
                
                if (!sanctionId) {
                    console.error('No tournament selected');
                    return;
                }
                
                $('.tnav-btn').removeClass('active');
                $btn.addClass('active');
                
                // Save the current active view
                AppState.currentActiveView = view;
                
                // Scroll to top for better UX
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                switch(view) {
                    case 'scores':
                        TournamentInfo.loadScores(sanctionId);
                        break;
                    case 'running-order':
                        // TODO: Implement later
                        console.log('Running Order clicked for:', sanctionId);
                        break;
                    case 'entry-list':
                        // TODO: Implement later
                        console.log('Entry List clicked for:', sanctionId);
                        break;
                    case 'reports':
                        // TODO: Implement later
                        console.log('Reports clicked for:', sanctionId);
                        break;
                }
            });
        },

        loadScores: function(sanctionId) {
            
            // Move the leaderboard section into the tournament-list-container FIRST
            const leaderboardSection = $('#leaderboardSection');
            const tournamentListContainer = $('.tournament-list-container');
            
            // Move leaderboard section into the tournament list container if it's not already there
            if (leaderboardSection.parent()[0] !== tournamentListContainer[0]) {
                leaderboardSection.appendTo(tournamentListContainer);
            }
            
            // Hide tournament search elements FIRST
            $('#tFilters').hide();  // Tournament year/region filter bubbles
            $('#tDesktop').hide();  // Desktop tournament table
            $('#tMobile').hide();  // Mobile tournament cards
            $('#noResultsMessage').hide();  // No results message
            
            // Show the leaderboard section BEFORE loading tournament info
            leaderboardSection.show();
            
            // Remove any previous format classes
            $('#leaderboardContent').removeClass('round-format');
            
            // Reposition existing tournament info panel for scores page
            const existingPanel = document.querySelector('#tInfo');
            if (existingPanel) {
                if (window.innerWidth <= 1000) {
                    // Mobile: Move panel above leaderboard filters
                    const firstChild = leaderboardSection[0].firstChild;
                    if (firstChild) {
                        leaderboardSection[0].insertBefore(existingPanel, firstChild);
                    } else {
                        leaderboardSection[0].appendChild(existingPanel);
                    }
                    
                    
                } else {
                    // Desktop: Move panel to the side of results (tournament-display)
                    document.querySelector('.tournament-display').appendChild(existingPanel);
                }
            }
            
            // NOW load tournament info panel - renderInfo will detect we're on scores page
            TournamentInfo.load(sanctionId, AppState.currentTrickVideoText);
            
            
            // Use "0" for recent (matches Tournament.aspx behavior)  
            const skiYear = '0';
            
            // Determine format code based on sanction ID
            const isNCWSA = sanctionId.length >= 3 && sanctionId.charAt(2).toUpperCase() === 'U';
            const formatCode = isNCWSA ? 'NCWL' : 'LBSP';
            
            // Store tournament info for filtering
            this.currentTournamentInfo = {
                sanctionId: sanctionId,
                name: AppState.currentTournamentName,
                skiYear: skiYear,
                formatCode: formatCode
            };
            
            // First load the normal tournament info and filter bubbles
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
                    // Set up the normal filter bubbles
                    this.setupLeaderboardFilters(response);
                    
                    // Then load most recent 10 divisions immediately  
                    this.loadMostRecentDivisions(sanctionId, skiYear, formatCode, 'NONE', '0');
                } else {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error: ' + response.error + '</p></div>');
                }
            })
            .fail((error) => {
                console.log('Failed to load tournament info: ' + error);
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading tournament information: ' + error + '</p></div>');
            });
        },

        loadMostRecentDivisions: function(sanctionId, skiYear, formatCode, eventCode, selectedRound) {
            
            // Show loading message
            $('#leaderboardContent').html('<div class="text-center p-4"><p>Loading most recent divisions...</p></div>');
            
            // First, get the prioritized list of event-division combinations
            // We'll use a special parameter to get our recent divisions data
            const requestData = {
                SID: sanctionId,
                SY: skiYear,
                TN: AppState.currentTournamentName,
                FC: formatCode,
                FT: '0',  // From Tournament parameter like TLeaderBoardSP expects
                UN: '0',  // Use NOPS parameter
                UT: '0',  // Use Teams parameter
                GET_MOST_RECENT: '1'  // This will trigger our GetDvMostRecent function
            };
            
            // Add event code if specified
            if (eventCode) {
                requestData.EV = eventCode;
            }
            
            $.getJSON('GetLeaderboardSP.aspx', requestData)
            .done((response) => {
                if (response.success && response.prioritizedDivisions) {
                    // Convert the VB.NET results to JavaScript format
                    const prioritizedDivisions = response.prioritizedDivisions.map(div => ({
                        event: div.event,  // Server already returns 'S', 'T', 'J'
                        division: div.division,
                        eventName: div.event,
                        rank: div.rank,
                        lastActivity: div.lastActivity
                    }));
                    
                    // Store all prioritized divisions for infinite scroll
                    this.allPrioritizedDivisions = prioritizedDivisions;
                    this.currentBatchIndex = 0;
                    this.isLoading = false;
                    
                    // Load first batch of 5 divisions
                    const firstBatch = prioritizedDivisions.slice(0, 5);
                    this.currentBatchIndex = 5;
                    this.loadDivisionsBatch(firstBatch, sanctionId, skiYear, formatCode, selectedRound);
                    
                    // Set up infinite scroll
                    this.setupInfiniteScroll(sanctionId, skiYear, formatCode, selectedRound);
                } else {
                    $('#leaderboardContent').html('<div class="text-center p-4"><p>No recent division activity found</p></div>');
                }
            })
            .fail((error) => {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading recent divisions</p></div>');
            });
        },

        loadAlphabeticalDivisions: function(sanctionId, skiYear, formatCode, eventCode, selectedRound) {
            // Use the passed event code
            const selectedEvent = eventCode;
            
            if (!selectedEvent || selectedEvent === '0') {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Please select an event first</p></div>');
                return;
            }
            
            // Show loading message
            $('#leaderboardContent').html('<div class="text-center p-4"><p>Loading divisions alphabetically for selected event...</p></div>');
            
            // Get divisions for the selected event (already in alphabetical order from server)
            $.getJSON('GetLeaderboardSP.aspx', {
                SID: sanctionId,
                SY: skiYear,
                TN: AppState.currentTournamentName,
                FC: formatCode,
                FT: '0',
                UN: '0',
                UT: '0',
                EV: selectedEvent
            })
            .done((response) => {
                if (response.success && response.availableDivisions) {
                    // Create event-division combinations for the selected event only
                    const allDivisions = [];
                    
                    response.availableDivisions.forEach(division => {
                        if (division.code && division.code !== 'ALL' && division.code !== '0') {
                            allDivisions.push({
                                event: selectedEvent,
                                division: division.code,
                                eventName: this.getEventName(selectedEvent)
                            });
                        }
                    });
                    
                    // Store all divisions for infinite scroll (server order preserved - alphabetical)
                    this.allPrioritizedDivisions = allDivisions;
                    this.currentBatchIndex = 0;
                    this.isLoading = false;
                    
                    // Load first batch of 5 divisions using existing batch function
                    const firstBatch = allDivisions.slice(0, 5);
                    this.currentBatchIndex = 5;
                    this.loadDivisionsBatch(firstBatch, sanctionId, skiYear, formatCode, selectedRound);
                    
                    // Set up infinite scroll
                    this.setupInfiniteScroll(sanctionId, skiYear, formatCode, selectedRound);
                } else {
                    $('#leaderboardContent').html('<div class="text-center p-4"><p>No divisions found for selected event</p></div>');
                }
            })
            .fail((error) => {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading divisions</p></div>');
            });
        },

        loadRecentScores: function() {
            // Stop infinite scroll and clean up any existing observers/state
            this.stopInfiniteScroll();
            
            // Show loading message
            $('#leaderboardContent').html('<div><p>Loading recent scores...</p></div>');
            
            // Call GetLeaderboardSP.aspx with a new parameter to get recent scores
            $.getJSON('GetLeaderboardSP.aspx', {
                SID: AppState.currentSelectedTournamentId,
                SY: "0",
                TN: AppState.currentTournamentName,
                FC: this.currentTournamentInfo.formatCode,
                FT: '0',
                UN: '0',
                UT: '0',
                GET_RECENT_SCORES: '1',  // New parameter to trigger recent scores
                OFFSET: 0                // Start from the beginning (first 20 records)
            })
            .done((response) => {
                if (response.success && response.recentScores && response.recentScores.length > 0) {
                    this.displayRecentScores(response.recentScores);
                } else {
                    $('#leaderboardContent').html('<div><p>No recent scores found</p></div>');
                }
            })
            .fail((error) => {
                $('#leaderboardContent').html('<div><p>Error loading recent scores</p></div>');
            });
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
                
                // Create skier link similar to other leaderboards
                const skierLink = `<a href="Trecap?SID=${score.sanctionId}&SY=0&MID=${score.memberId}&DV=${score.division}&EV=${score.event}&TN=${AppState.currentTournamentName}&FC=LBSP&FT=0&RP=1&UN=0&UT=0&SN=${encodeURIComponent(score.skierName)}"><strong>${score.skierName}</strong></a>`;
                
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
            if (this.isLoadingRecentScores) return;
            
            this.isLoadingRecentScores = true;
            
            // Load next batch of 20 records by incrementing offset
            this.recentScoresOffset = this.allRecentScores.length;
            
            // Call GetLeaderboardSP.aspx for next batch of scores
            $.getJSON('GetLeaderboardSP.aspx', {
                SID: AppState.currentSelectedTournamentId,
                SY: "0",
                TN: AppState.currentTournamentName,
                FC: this.currentTournamentInfo.formatCode,
                FT: '0',
                UN: '0',
                UT: '0',
                GET_RECENT_SCORES: '1',
                OFFSET: this.recentScoresOffset
            })
            .done((response) => {
                this.isLoadingRecentScores = false;
                
                if (response.success && response.recentScores && response.recentScores.length > 0) {
                    // Add new scores to the existing array (no need to filter since OFFSET ensures no duplicates)
                    this.allRecentScores.push(...response.recentScores);
                    
                    // Re-render the table with all scores
                    this.renderRecentScoresTable();
                    
                    // Re-setup the observer for the new last row
                    this.observeLastRecentScoreRow();
                } else {
                    // No more scores available, disable further loading
                    if (this.recentScoresObserver) {
                        this.recentScoresObserver.disconnect();
                        this.recentScoresObserver = null;
                    }
                }
            })
            .fail((error) => {
                this.isLoadingRecentScores = false;
                console.error('Error loading more recent scores:', error);
            });
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
                    console.log('Unknown event code:', eventCode);
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
            
            // Add placement format override buttons
            roundFilters.append('<button class="filter-btn" data-filter="placement" data-value="ROUND">Rounds View</button>');
            roundFilters.append('<button class="filter-btn" data-filter="placement" data-value="BEST">Divisions View</button>');
            
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
            
            // Add round buttons
            for (let i = 1; i <= maxRounds; i++) {
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
            
            // Set tournament title
            $('#leaderboardTitle').text(data.tournamentName + ' - ' + data.sanctionId + ' Leaderboard');
            
            // Setup event filter bubbles
            const eventFilters = $('#eventFilters');
            eventFilters.empty();
            eventFilters.append('<button class="filter-btn" data-filter="event" data-value="NONE">None</button>');
            eventFilters.append('<button class="filter-btn" data-filter="event" data-value="MIXED">Mixed</button>');
            
            if (data.availableEvents && data.availableEvents.length > 0) {
                data.availableEvents.forEach(event => {
                    eventFilters.append(`<button class="filter-btn" data-filter="event" data-value="${event.code}">${event.name}</button>`);
                });
            }
            
            // Load division filters with all available divisions from all events
            const divisionFilters = $('#divisionFilters');
            divisionFilters.empty();
            divisionFilters.append('<button class="filter-btn active" data-filter="division" data-value="MOST_RECENT">Most Recent</button>');
            divisionFilters.append('<button class="filter-btn" data-filter="division" data-value="ALL">Alphabetical</button>');
            // More division options will be populated dynamically
            
            // Load divisions from all events and add to filter
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
                
                // Update round filters based on selected event
                self.setupRoundFilters(self.tournamentData, eventCode);
                
                // Load event details if specific event is selected (for division options)
                if (eventCode !== 'NONE') {
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
                
                // For placement format buttons, handle differently
                if (filterType === 'placement') {
                    // Toggle active state for placement buttons only
                    $('#roundFilters .filter-btn[data-filter="placement"]').removeClass('active');
                    $btn.addClass('active');
                } else {
                    // Update active state within the same filter group (round or division)
                    $btn.siblings('[data-filter="' + filterType + '"]').removeClass('active');
                    $btn.addClass('active');
                }
                
                // Apply current filter combination
                self.applyFilterCombination();
            });
        },

        applyFilterCombination: function() {
            // Cancel any pending requests from previous filter selections
            Utils.cancelAllRequests();
            
            const selectedEvent = $('#eventFilters .filter-btn.active').data('value');
            const selectedDivision = $('#divisionFilters .filter-btn.active').data('value');
            const selectedRound = $('#roundFilters .filter-btn.active[data-filter="round"]').data('value');
            const selectedPlacement = $('#roundFilters .filter-btn.active[data-filter="placement"]').data('value');
            
            // Get current filter state
            const hasEvent = selectedEvent && selectedEvent !== 'NONE';
            const hasDivision = selectedDivision && selectedDivision !== 'MOST_RECENT' && selectedDivision !== 'ALL';
            const isAlphabetical = selectedDivision === 'ALL';
            const isMostRecent = selectedDivision === 'MOST_RECENT';
            const isMixed = selectedEvent === 'MIXED';
            const isOverall = selectedEvent === 'O';
            
            console.log('[FILTER-DEBUG] selectedEvent:', selectedEvent, 'selectedDivision:', selectedDivision);
            console.log('[FILTER-DEBUG] isOverall:', isOverall, 'isMixed:', isMixed, 'hasEvent:', hasEvent);
            
            // Case 0: Mixed recent scores
            if (isMixed) {
                this.loadRecentScores();
                return;
            }
            
            // Case 0.5: Overall event - load all overall divisions
            if (isOverall && !hasDivision) {
                this.loadOverallAllDivisions(selectedRound);
                return;
            }
            
            // Case 1: No filters selected / Most Recent (default)  
            if (isMostRecent) {
                if (hasEvent && !isOverall) {
                    // Most recent for specific event (but not Overall)
                    this.loadMostRecentDivisions(AppState.currentSelectedTournamentId, "0", this.currentTournamentInfo.formatCode, selectedEvent, selectedRound);
                } else if (hasEvent && isOverall) {
                    // Overall event - default to alphabetical instead of most recent
                    console.log('[OVERALL-DEBUG] Overall + Most Recent -> redirecting to Alphabetical');
                    $('#divisionFilters .filter-btn').removeClass('active');
                    $('#divisionFilters .filter-btn[data-value="ALL"]').addClass('active');
                    this.loadAlphabeticalDivisions(AppState.currentSelectedTournamentId, "0", this.currentTournamentInfo.formatCode, selectedEvent, selectedRound);
                } else {
                    // Most recent across all events
                    this.loadMostRecentDivisions(AppState.currentSelectedTournamentId, "0", this.currentTournamentInfo.formatCode, null, selectedRound);
                }
                return;
            }
            
            // Case 2: Alphabetical view
            if (isAlphabetical) {
                if (hasEvent) {
                    // Alphabetical for specific event
                    this.loadAlphabeticalDivisions(AppState.currentSelectedTournamentId, "0", this.currentTournamentInfo.formatCode, selectedEvent, selectedRound);
                } else {
                    // Alphabetical across all events - use existing division list, events in S,T,J order
                    this.loadAlphabeticalAllEvents(selectedRound);
                }
                return;
            }
            
            // Case 3: Specific division selected
            if (hasDivision) {
                if (hasEvent) {
                    // Check if division exists in selected event, then show event+division or error
                    this.loadEventDivisionCombination(selectedEvent, selectedDivision, selectedRound);
                } else {
                    // Show division across all events that have it
                    this.loadDivisionAcrossEvents(selectedDivision, selectedRound);
                }
                return;
            }
            
            // Case 4: Only event selected (no specific division)
            if (hasEvent) {
                if (isOverall) {
                    // Overall event - show all overall divisions
                    this.loadOverallAllDivisions(selectedRound);
                } else {
                    // Default to most recent for that event (except Overall)
                    $('#divisionFilters .filter-btn').removeClass('active');
                    $('#divisionFilters .filter-btn[data-value="MOST_RECENT"]').addClass('active');
                    this.loadMostRecentDivisions(AppState.currentSelectedTournamentId, "0", this.currentTournamentInfo.formatCode, selectedEvent);
                }
                return;
            }
            
            // Case 5: No meaningful filters (fallback)
            $('#leaderboardContent').html('<div class="text-center p-4 text-muted"><p>Select filters to display leaderboard data</p></div>');
        },

        loadEventDivisionCombination: function(eventCode, divisionCode, roundCode) {
            // Show loading state
            $('#leaderboardContent').html('<div class="text-center p-4"><p>Loading ' + eventCode + ' ' + divisionCode + '...</p></div>');
            
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
                        $('#leaderboardContent').html('<div class="text-center p-4"><p>No results found for division "' + divisionCode + '" in ' + eventName + '</p></div>');
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
            // Get all available events
            const availableEvents = [];
            $('#eventFilters .filter-btn').each(function() {
                const eventCode = $(this).data('value');
                if (eventCode !== 'NONE') {
                    availableEvents.push(eventCode);
                }
            });
            
            if (availableEvents.length === 0) {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>No events available</p></div>');
                return;
            }
            
            // Check each event to see which ones have this division
            const divisionPromises = availableEvents.map(eventCode => {
                return $.getJSON('GetLeaderboardSP.aspx', {
                    SID: AppState.currentSelectedTournamentId,
                    SY: "0", 
                    TN: AppState.currentTournamentName,
                    FC: this.currentTournamentInfo.formatCode,
                    EV: eventCode
                }).then(response => {
                    if (response.success && response.availableDivisions) {
                        const divisionExists = response.availableDivisions.some(div => div.code === divisionCode);
                        return divisionExists ? eventCode : null;
                    }
                    return null;
                }).catch(() => null);
            });
            
            // Wait for all event checks to complete
            Promise.all(divisionPromises).then(results => {
                const eventsWithDivision = results.filter(event => event !== null);
                
                if (eventsWithDivision.length === 0) {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-warning"><p>Division "' + divisionCode + '" not found in any event</p></div>');
                    return;
                }
                
                // Create event-division combinations for batch loading
                const divisionBatch = eventsWithDivision.map(eventCode => ({
                    event: eventCode,
                    division: divisionCode,
                    eventName: this.getEventName(eventCode)
                }));
                
                this.loadEventDivisionBatch(divisionBatch, 'Loading division "' + divisionCode + '" across all events...', roundCode);
            });
        },

        loadAlphabeticalAllEvents: function(selectedRound) {
            // Get available events in S,T,J order
            const availableEvents = [];
            $('#eventFilters .filter-btn').each(function() {
                const eventCode = $(this).data('value');
                if (eventCode !== 'NONE') {
                    availableEvents.push(eventCode);
                }
            });
            
            if (availableEvents.length === 0) {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>No events available</p></div>');
                return;
            }
            
            // Call LoadDvData for each event and combine results
            const divisionPromises = availableEvents.map(eventCode => {
                return $.getJSON('GetLeaderboardSP.aspx', {
                    SID: AppState.currentSelectedTournamentId,
                    SY: "0",
                    TN: AppState.currentTournamentName,
                    FC: this.currentTournamentInfo.formatCode,
                    FT: '0',
                    UN: '0',
                    UT: '0',
                    LOAD_ALL_DIVISIONS: '1',
                    EV: eventCode
                }).then(response => {
                    if (response.success && response.availableDivisions) {
                        return response.availableDivisions
                            .filter(div => div.code && div.code !== 'ALL' && div.code !== '0')
                            .map(div => ({
                                event: eventCode,
                                division: div.code,
                                eventName: this.getEventName(eventCode)
                            }));
                    }
                    return [];
                }).catch(() => []);
            });
            
            // Wait for all LoadDvData calls to complete
            Promise.all(divisionPromises).then(results => {
                // Combine all actual event-division combinations
                const actualCombinations = [];
                results.forEach(eventCombinations => {
                    actualCombinations.push(...eventCombinations);
                });
                
                if (actualCombinations.length === 0) {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-warning"><p>No divisions found</p></div>');
                    return;
                }
                
                // Sort alphabetically by division, then by event order (S, T, J)
                const eventOrder = ['S', 'T', 'J'];
                actualCombinations.sort((a, b) => {
                    if (a.division !== b.division) {
                        return a.division.localeCompare(b.division);
                    }
                    return eventOrder.indexOf(a.event) - eventOrder.indexOf(b.event);
                });
                
                this.loadEventDivisionBatch(actualCombinations, 'Loading all existing divisions alphabetically...', selectedRound);
            });
        },

        loadOverallAllDivisions: function(selectedRound) {
            // Show loading message
            $('#leaderboardContent').html('<div class="text-center p-4"><p>Loading overall scores...</p></div>');
            
            // Test: Direct call to GetLeaderboardSP with Overall event
            console.log('[OVERALL-JS] Direct call to Overall with All divisions');
            console.log('[OVERALL-JS] Tournament ID:', AppState.currentSelectedTournamentId);
            $.getJSON('GetLeaderboardSP.aspx', {
                SID: AppState.currentSelectedTournamentId,
                SY: "0",
                TN: AppState.currentTournamentName,
                FC: this.currentTournamentInfo.formatCode,
                EV: 'O',           // Overall event
                DV: 'All',         // All divisions  
                RND: selectedRound || '0',
                FT: '0',
                UN: '0',
                UT: '0'
            })
            .done((response) => {
                console.log('[OVERALL-JS] GetLeaderboardSP response:', response);
                if (response.success && response.htmlContent) {
                    $('#leaderboardContent').html(response.htmlContent);
                } else {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-warning"><p>No overall scores found</p></div>');
                }
            })
            .fail((error) => {
                console.error('[OVERALL-JS] Error loading overall:', error);
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading overall scores</p></div>');
            });
            
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

        loadEventDetails: function(eventCode) {
            // Load divisions for the selected event (just to populate division filter options)
            const sanctionId = AppState.currentSelectedTournamentId;
            const skiYear = "0";
            const tournamentName = AppState.currentTournamentName;
            
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
                    
                    // Always add Most Recent and Alphabetical options first
                    divisionFilters.append('<button class="filter-btn" data-filter="division" data-value="MOST_RECENT">Most Recent</button>');
                    divisionFilters.append('<button class="filter-btn" data-filter="division" data-value="ALL">Alphabetical</button>');
                    
                    // Add event-specific divisions (excluding the "ALL" option from server)
                    response.availableDivisions.forEach(division => {
                        if (division.code !== 'ALL') {
                            divisionFilters.append(`<button class="filter-btn" data-filter="division" data-value="${division.code}">${division.name}</button>`);
                        }
                    });
                    
                    // Try to preserve the previous division selection, otherwise default to Most Recent
                    let targetButton = divisionFilters.find(`[data-value="${currentDivisionValue}"]`);
                    if (targetButton.length === 0) {
                        targetButton = divisionFilters.find('[data-value="MOST_RECENT"]');
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
            
            // Show loading message
            $('#leaderboardContent').html('<div class="text-center p-4"><p>Loading ' + divisions.length + ' divisions...</p></div>');
            
            // Prepare batch request data
            const batchData = divisions.map(combo => ({
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
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading batch divisions</p></div>');
                }
            })
            .fail((error) => {
                // Check if this is still the current request before showing error
                if (!request.isCurrent()) {
                    console.log('Ignoring error from cancelled request');
                    return;
                }
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading divisions</p></div>');
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
            
            // Prepare batch request data
            const batchData = divisions.map(combo => ({
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
            const selectedEvent = $('#eventFilters .filter-btn.active').data('value');
            const selectedDivision = $('#divisionFilters .filter-btn.active').data('value');
            const selectedRound = $('#roundFilters .filter-btn.active[data-filter="round"]').data('value');
            const selectedPlacement = $('#roundFilters .filter-btn.active[data-filter="placement"]').data('value');
            
            if (!selectedEvent || selectedEvent === '0') {
                $('#leaderboardContent').html('<p class="text-center text-muted">Please select an event to display the leaderboard</p>');
                return;
            }
            
            // Show loading state
            $('#leaderboardContent').html('<div class="text-center p-4"><p>Loading leaderboard data...</p></div>');
            
            // Prepare request data
            const requestData = {
                SID: this.currentTournamentInfo.sanctionId,
                SY: this.currentTournamentInfo.skiYear,
                TN: this.currentTournamentInfo.name,
                UN: '0',  // Use NOPS - false
                FC: this.currentTournamentInfo.formatCode,
                FT: '0',  // From TRecap - needs EV and DV parameters
                UT: '0',  // Use Teams - false
                EV: selectedEvent,
                DV: selectedDivision,
                RND: selectedRound
            };
            
            // Add placement format override if selected
            if (selectedPlacement) {
                requestData.FORCE_PLACEMENT = selectedPlacement;
            }
            
            // Make API call for leaderboard content
            $.getJSON('GetLeaderboardSP.aspx', requestData)
            .done(function(response) {
                if (response.success && response.htmlContent) {
                    // Apply or remove round-format class based on placement format
                    if (response.placementFormat?.toUpperCase() === 'ROUND') {
                        $('#leaderboardContent').addClass('round-format');
                    } else {
                        $('#leaderboardContent').removeClass('round-format');
                    }
                    
                    $('#leaderboardContent').html(response.htmlContent);
                    
                    // Clean up empty columns and rows in the loaded content
                    $('#leaderboardContent table').each(function() {
                        TournamentInfo.removeEmptyColumnsAndRows(this);
                    });
                } else {
                    $('#leaderboardContent').html('<p class="text-center text-danger">Error loading leaderboard data</p>');
                }
            })
            .fail(function(xhr, status, error) {
                $('#leaderboardContent').html('<p class="text-center text-danger">Error: ' + error + '</p>');
            });
        }
    };

    const TournamentList = {
        init: function() {
            window.addEventListener('resize', Utils.debounce(() => {
                this.handleViewportChange();
            }, CONFIG.RESIZE_DEBOUNCE));

            const tlistDiv = document.getElementById('TList');
            if (!tlistDiv) return;

            const tables = tlistDiv.querySelectorAll('table');
            if (!tables.length) return;

            const table = tables[0];
            const mobileTListDiv = document.getElementById('tMobile');

            this.addTableHeader(table);
            this.processTableRows(table, mobileTListDiv);
            this.markLastVisibleRow(table);
        },

        addTableHeader: function(table) {
            let thead = table.querySelector('thead');
            if (!thead) {
                thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                headerRow.innerHTML = `
                    <th class="date-col">Date</th>
                    <th class="name-col">Name</th>
                    <th class="loc-col">Location</th>
                    <th class="sanction-col">Sanction</th>
                `;
                thead.appendChild(headerRow);
                table.insertBefore(thead, table.firstChild);
            }
        },

        processTableRows: function(table, mobileTListDiv) {
            const rows = table.querySelectorAll('tbody tr, tr');

            if (mobileTListDiv) {
                mobileTListDiv.innerHTML = '';
            }
            
            let cardsCreated = 0;
            rows.forEach(row => {
                const tournamentData = this.extractTournamentData(row);
                if (tournamentData) {
                    this.createMobileCard(tournamentData, mobileTListDiv, row);
                    this.updateDesktopRow(row, tournamentData);
                    cardsCreated++;
                }
            });

            if (mobileTListDiv && cardsCreated === 0) {
                mobileTListDiv.innerHTML = '<div class="text-warning">No tournaments found.</div>';
            }
        },

        extractTournamentData: function(row) {
            const tds = row.querySelectorAll('td');
            if (tds.length !== 2) return null;

            const flagHtml = tds[0].innerHTML.trim();
            const cell = tds[1];
            const bolds = cell.querySelectorAll('b');
            let nameHtml = '', name = '', date = '', sanction = '', loc = '';

            // Tournament name is in first <a> tag
            const a = cell.querySelector('a');
            if (a) {
                nameHtml = a.outerHTML;
                name = a.textContent.trim();
            }

            // Date and sanction are in second <b> tag, space-separated
            if (bolds.length >= 2) {
                const dsText = bolds[1].textContent.trim();
                const parts = dsText.split(/\s+/);
                if (parts.length >= 2) {
                    date = parts[0];
                    sanction = parts[1];
                }
            }
            // Location is the first text node after the second <b> tag
            let foundLoc = false;
            for (let i = 0; i < cell.childNodes.length; i++) {
                const node = cell.childNodes[i];
                if (node === bolds[1]) {
                    foundLoc = true;
                    continue;
                }
                if (foundLoc && node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    loc = node.textContent.replace(/^\s*["']?\s*/, '').replace(/["']?\s*$/, '').trim();
                    break;
                }
            }

            const hasVideo = flagHtml && flagHtml.includes('<img');
            const trickVideoText = hasVideo ? 'Available' : 'Not Available';

            return {
                flagHtml, nameHtml, name, date, sanction, loc, hasVideo,
                trickVideoText, element: a
            };
        },

        createMobileCard: function(data, mobileTListDiv, originalRow) {
            if (!mobileTListDiv) return;

            const card = document.createElement('div');
            card.className = 'mobile-tournament-card';
            card.setAttribute('data-sanction-id', data.sanction);

            const videoIndicator = data.hasVideo ? data.flagHtml : '';

            card.innerHTML = `
                <div class="mobile-tournament-header">
                    <span class="mobile-tournament-date">${data.date || 'N/A'}</span>
                    <span class="mobile-tournament-title">${data.nameHtml || 'N/A'}</span>
                    ${videoIndicator}
                </div>
                <div class="mobile-tournament-row">
                    <span class="mobile-tournament-value small-text">${data.loc || 'N/A'} | <i>Sanction:</i> <i>${data.sanction || 'N/A'}</i></span>
                </div>
            `;

            if (originalRow.hasAttribute('data-trick-video')) {
                card.setAttribute('data-trick-video', originalRow.getAttribute('data-trick-video'));
            }
            card.addEventListener('click', (e) => {
                e.preventDefault();

                document.querySelectorAll('.mobile-tournament-card').forEach(c => {
                    c.classList.remove('selected');
                });
                card.classList.add('selected');


                TournamentInfo.load(data.sanction, data.trickVideoText);
                // Keep desktop table in sync when mobile card is clicked
                if (!Utils.isMobile() && originalRow) {
                    const allRows = document.querySelectorAll('#TList table tr');
                    allRows.forEach(r => r.classList.remove('selected'));
                    originalRow.classList.add('selected');
                }
            });

            mobileTListDiv.appendChild(card);
        },

        updateDesktopRow: function(row, data) {
            row.setAttribute('data-trick-video', data.trickVideoText);
            
            row.innerHTML = `
                <td class="date-col">${data.date}</td>
                <td class="name-col">${data.nameHtml}</td>
                <td class="loc-col">${data.loc}</td>
                <td class="sanction-col">${data.sanction}</td>
            `;

            row.addEventListener('click', function () {
                document.querySelectorAll('#TList tr').forEach(r => {
                    r.classList.remove('selected');
                });
                this.classList.add('selected');
                
                const sanctionCell = this.querySelector('.sanction-col');
                const trickVideoText = this.getAttribute('data-trick-video');
                if (sanctionCell) {
                    const sanctionId = sanctionCell.textContent.trim();
                    TournamentInfo.load(sanctionId, trickVideoText);
                }
            });
        },

        markLastVisibleRow: function(table) {
            const tbodyRows = table.querySelectorAll('tbody tr');
            if (tbodyRows.length > 0) {
                tbodyRows.forEach(row => row.classList.remove('table-last-visible'));
                tbodyRows[tbodyRows.length - 1].classList.add('table-last-visible');
            }
        },

        // Handle mobile/desktop view transitions while preserving selection
        handleViewportChange: function() {
            const currentWidth = window.innerWidth;
            const isMobile = currentWidth < CONFIG.MOBILE_BREAKPOINT;
            const wasMobile = AppState.lastKnownMobile;


            if (wasMobile !== isMobile && AppState.currentSelectedTournamentId) {
                // Reposition first, then wait for scroll to complete before loading panel
                this.selectTournamentInView(isMobile, AppState.currentSelectedTournamentId);
                
                // Wait for scroll animation to complete before rendering details panel
                setTimeout(() => {
                    TournamentInfo.load(AppState.currentSelectedTournamentId, AppState.currentTrickVideoText);
                }, CONFIG.SCROLL_DELAY + 200); // Wait for scroll delay + animation time
            }

            AppState.lastKnownMobile = isMobile;
        },

        selectTournamentInView: function(isMobile, sanctionId) {
            if (isMobile) {
                // Find and select the mobile card, create detail panel
                let selectedCard = null;
                document.querySelectorAll('.mobile-tournament-card').forEach(card => {
                    card.classList.remove('selected');
                    if (card.getAttribute('data-sanction-id') === sanctionId) {
                        card.classList.add('selected');
                        selectedCard = card;
                    }
                });

            } else {
                // Find and select the desktop table row
                let selectedRow = null;
                document.querySelectorAll('#TList table tr').forEach(row => {
                    row.classList.remove('selected');
                    const sanctionCell = row.querySelector('.sanction-col');
                    if (sanctionCell && sanctionCell.textContent.trim() === sanctionId) {
                        row.classList.add('selected');
                        selectedRow = row;
                    }
                });
                
                // Scroll to the selected row with offset, similar to mobile
                if (selectedRow) {
                    setTimeout(() => {
                        const rowRect = selectedRow.getBoundingClientRect();
                        const currentScroll = window.scrollY;
                        const targetY = currentScroll + rowRect.top - 140; 
                        window.scrollTo({ top: targetY, behavior: 'smooth' });
                    }, CONFIG.SCROLL_DELAY);
                }
            }
        }
    };

    document.addEventListener('DOMContentLoaded', function() {
        DropdownMenu.init();
        TournamentList.init();
        
        // Ensure tournament search elements are visible on page load (only on mobile)
        if (window.innerWidth <= 1000) {
            $('#tMobile').show();
        }
    });

})();
