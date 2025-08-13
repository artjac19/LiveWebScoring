(function() {
    'use strict';

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
            
            if (!AppState.currentActiveView) {
                AppState.currentActiveView = 'home';
            }
            
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
            
            params.sanctionId = sanctionId;
            
            TournamentNav.updateUrlParameters(params);

            TournamentUI.renderInfo();
                
            $.getJSON(CONFIG.AJAX_ENDPOINT, { sid: sanctionId })
                .done((response) => {
                    this.processResponse(response, trickVideoText);
                })
                .fail((xhr, status, error) => {
                    const errorHtml = '<p class="text-danger">Error loading tournament information: ' + error + '</p>';
                    TournamentUI.renderInfo(errorHtml);
                });
        },

        processResponse: function(response, trickVideoText) {
            if (!response || typeof response !== 'object' || !response.Success) {
                const errorHtml = '<p class="text-danger">' + (response?.ErrorMessage || 'Error loading tournament information') + '</p>';
                this.renderInfo(errorHtml);
                return;
            }

            const combinedHtml = TournamentHTML.buildDetailsHtml(response, trickVideoText);
            TournamentUI.renderInfo(combinedHtml);
            TournamentUI.bindCollapseEvents(response);
            TournamentNav.bindTNav();
        },

        loadInitialContent: function(sanctionId, skiYear, formatCode) {
            const displayMode = AppState.currentDisplayMode;
            
            if (displayMode === 'running-order') {
                $('#leaderboardContent').html('<div class="text-center p-4"><p>Select an event to view running order...</p></div>');
            } else if (displayMode === 'by-division') {
                $('#leaderboardContent').html('<div class="text-center p-4"><p>Select a division to load information...</p></div>');
                this.applyFilterCombination();
            } else {
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
            
            this.renderRecentScoresTable();
            this.setupRecentScoresInfiniteScroll();
        },

        renderRecentScoresTable: function() {
            let html = '<div class="recent-scores-section">';
            html += '<table id="recentScoresTable">';
            html += '<tr class="table-header-row"><th>Time</th><th>Skier</th><th>Event</th><th>Score</th></tr>';
            
            this.allRecentScores.forEach((score, index) => {
                const timeAgo = this.formatTimeAgo(score.insertDate);
                const eventName = this.getEventName(score.event);
                
                const mergedEvent = `${eventName} ${score.division}, R${score.round}`;
                
                const tournamentNameEncoded = encodeURIComponent(AppState.currentTournamentName);
                const eventCode = score.event.trim().charAt(0);
                const trecapUrl = `Trecap?SID=${score.sanctionId}&SY=0&MID=${score.memberId}&DV=${score.division}&EV=${eventCode}&TN=${tournamentNameEncoded}&FC=LBSP&FT=0&RP=1&UN=0&UT=0&SN=${score.skierName}`;
                const skierLink = `<a href="#" onclick="window.location.href='${trecapUrl}'; return false;"><strong>${score.skierName}</strong></a>`;
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
            
            // watch for last row coming into view
            this.recentScoresObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !self.isLoadingRecentScores) {
                        self.loadMoreRecentScores();
                    }
                });
            }, {
                rootMargin: '100px'
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
                
                if (typeof dateString === 'string' && dateString.startsWith('/Date(') && dateString.endsWith(')/')) {
                    const timestampMatch = dateString.match(/\/Date\((\d+)\)\//);
                    if (timestampMatch) {
                        const timestamp = parseInt(timestampMatch[1]);
                        scoreDate = new Date(timestamp);
                    } else {
                        return 'Invalid Date Format';
                    }
                } else {
                    scoreDate = new Date(dateString);
                }
                if (isNaN(scoreDate.getTime())) {
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

        applyFilterCombination: function() {
            Utils.cancelAllRequests();
            
            const filterState = this.getFilterState();
            TournamentNav.updateLeaderboardUrl(filterState.selectedEvent, filterState.selectedDivision, filterState.selectedRound, filterState.selectedPlacement, filterState.selectedBestOf);
            
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
                // Default to Best of and auto-select the button --- currently All Rounds seems to override this
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
                // Special handling for Overall + Best Of + Specific Division
                if (filterState.isOverall && filterState.selectedBestOf === 'BESTOF') {
                    this.loadOverallBestOf(filterState.selectedDivision);
                } else {
                    this.loadEventDivisionCombination(filterState.selectedEvent, filterState.selectedDivision, filterState.selectedRound);
                }
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
            $('#leaderboardContent').html('<div class="text-center p-4"><p>Loading ' + eventCode + ' ' + divisionCode + '...</p></div>');
            
            if (!AppState.currentSelectedTournamentId || AppState.currentSelectedTournamentId.length < 6) {
                $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>No tournament selected</p></div>');
                return;
            }
            
            // Check if division exists using cached data
            const cachedDivisions = this.currentTournamentInfo?.availableDivisions?.[eventCode];
            if (cachedDivisions) {
                const divisionExists = cachedDivisions.some(div => div.code === divisionCode);
                
                if (divisionExists) {
                    this.updateLeaderboard();
                }
            } else {
                // Fallback: Division data not cached yet, load it to see if it exists.
                $.getJSON('GetLeaderboardSP.aspx', {
                    SID: AppState.currentSelectedTournamentId,
                    SY: "0",
                    TN: AppState.currentTournamentName,
                    FC: this.currentTournamentInfo.formatCode,
                    EV: eventCode
                })
                .done((response) => {
                    if (response.success && response.availableDivisions) {
                        // Cache the divisions for future use
                        if (!this.currentTournamentInfo.availableDivisions) {
                            this.currentTournamentInfo.availableDivisions = {};
                        }
                        this.currentTournamentInfo.availableDivisions[eventCode] = response.availableDivisions;
                        
                        const divisionExists = response.availableDivisions.some(div => div.code === divisionCode);
                        
                        if (divisionExists) {
                            this.updateLeaderboard();
                        }
                    } else {
                        $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error checking division availability</p></div>');
                    }
                })
                .fail(() => {
                    $('#leaderboardContent').html('<div class="text-center p-4 text-danger"><p>Error loading event data</p></div>');
                });
            }
        },

        loadEventDivisionBatch: function(combinations, loadingMessage, roundCode) {
            if (combinations.length === 0) {
                $('#leaderboardContent').html('<div class="text-center p-4 text-warning"><p>No event-division combinations available</p></div>');
                return;
            }
            
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
        },

        loadOverallBestOf: function (selectedDivision = null) {
            return TournamentDataLoader.loadOverallBestOf(selectedDivision);
        },

        calculateBestOfScores: function(htmlContent, selectedDivision = null) {
            
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
                        }
                    }
                    
                    // If no MID found, log the cell content for debugging
                    if (!memberID) {
                        memberID = 'NO_MID';
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
            
            this.generateBestOfTables(divisionData, selectedDivision);
        },

        generateBestOfTables: function(divisionData, selectedDivision = null) {
            let tablesHtml = '';
            
            // process all divisions returned from server
            const divisionsToProcess = Object.keys(divisionData).sort();
            
            divisionsToProcess.forEach(division => {
                const skiers = divisionData[division];
                const bestScores = [];
                
                // Calculate superscore for each skier (best of each event)
                Object.keys(skiers).forEach(skierName => {
                    const rounds = skiers[skierName];
                    
                    let bestSlalom = Math.max(...rounds.map(r => r.slalomNops));
                    let bestTrick = Math.max(...rounds.map(r => r.trickNops));
                    let bestJump = Math.max(...rounds.map(r => r.jumpNops));
                    
                    // Calculate superscore as sum of best individual event scores
                    let superscore = bestSlalom + bestTrick + bestJump;
                    
                    // Find which rounds produced these best scores (for display)
                    let slalomRound = rounds.find(r => r.slalomNops === bestSlalom)?.round || 0;
                    let trickRound = rounds.find(r => r.trickNops === bestTrick)?.round || 0;
                    let jumpRound = rounds.find(r => r.jumpNops === bestJump)?.round || 0;
                    
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
                
                tablesHtml += `
                    <table class="division-section" style="margin-bottom: 1rem;">
                        <tr class="table-header-row">
                            <td width="25%"><b>Overall ${division}</b></td>
                            <td>Overall</td><td>Slalom NOPS</td><td>Trick NOPS</td><td>Jump NOPS</td>
                        </tr>`;
                
                bestScores.forEach(skier => {
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
            
            $('#leaderboardContent').html(tablesHtml);
            
            if (!tablesHtml.trim()) {
                this.checkForEmptyContent();
            }
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



        splitOverallTablesByRound: function(selectedRound) {
            
            // Find all division-section tables (Overall tables have this class)
            const divisionTables = $('.division-section');
            
            divisionTables.each((tableIndex, table) => {
                const $table = $(table);
                const headerRow = $table.find('tr.table-header-row');
                
                if (headerRow.length === 0) return;
                
                const headerText = headerRow.text().toLowerCase();
                
                // Check if this is an Overall table
                if (!headerText.includes('overall')) {
                    return;
                }
                
                // Extract division from header pattern: "Overall OM - Round 1 - Sort by: BEST"
                const divisionMatch = headerText.match(/overall\s+([a-z0-9]+)\s+-/i);
                if (!divisionMatch) {
                    return;
                }
                
                const division = divisionMatch[1].toUpperCase();
                
                const dataRows = $table.find('tr').not('.table-header-row');
                
                if (dataRows.length <= 1) {
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
                    
                    if (round && round.match(/^[0-9]+$/)) {
                        if (!roundGroups[round]) {
                            roundGroups[round] = [];
                        }
                        roundGroups[round].push($row.clone());
                    }
                });
                
                const rounds = Object.keys(roundGroups);
                
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
                            $clonedRow.find('td:eq(1)').remove();
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
                    
                    $table.replaceWith(newTablesHtml);
                }
            });
            
            // remove other rounds if a specific round is selected
            if (selectedRound && selectedRound !== '0') {
                $('#leaderboardContent .division-section').each(function() {
                    const $table = $(this);
                    const headerText = $table.find('.table-header-row').text();
                    
                    // Check if this table is for the selected round
                    const roundMatch = headerText.match(/Round\s+(\d+)/i);
                    if (roundMatch) {
                        const tableRound = roundMatch[1];
                        if (tableRound != selectedRound) {
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
                        divisionFilters.append('<button class="filter-btn" data-filter="division" data-value="ALL">All</button>');
                    } else {
                        if (eventCode !== 'O') {
                            divisionFilters.append('<button class="filter-btn" data-filter="division" data-value="MOST_RECENT">Most Recent</button>');
                        }
                        divisionFilters.append('<button class="filter-btn" data-filter="division" data-value="ALL">Alphabetical</button>');
                    }
                    
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
                
                if (validCombinations.length === 0) {
                    $('#leaderboardContent').html(`<div class="text-center p-4 text-muted"><p>No events have Round ${selectedRound}</p></div>`);
                    return;
                }
            }
            
            $('#leaderboardContent').html('<div class="text-center p-4"><p>Loading divisions...</p></div>');
            
            // Prepare batch request data with valid combinations
            const batchData = validCombinations.map(combo => ({
                event: combo.event,
                division: combo.division
            }));
            
            // Get placement format override if selected
            const selectedPlacement = $('#roundFilters .filter-btn.active[data-filter="placement"]').data('value');
            
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
                        if (result.success && result.htmlContent && 
                            !(result.htmlContent.includes('NO') && 
                            result.htmlContent.includes('SCORES FOUND'))) {
                            $('#leaderboardContent').append(result.htmlContent);
                            
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
            });
        },

        removeEmptyColumnsAndRows: function(tableElement) {
            const rows = Array.from(tableElement.querySelectorAll('tr'));
            if (rows.length === 0) return;
            
            // First, remove empty rows
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
            
            for (let colIndex = maxCols - 1; colIndex >= 0; colIndex--) {
                let columnIsEmpty = true;
                
                for (let row of remainingRows) {
                    const cell = row.children[colIndex];
                    if (cell) {
                        // Never remove columns that have headers (th elements)
                        if (cell.tagName.toLowerCase() === 'th') {
                            columnIsEmpty = false;
                            break;
                        }
                        
                        const hasText = cell.textContent.trim() !== '';
                        const hasImages = cell.querySelector('img') !== null;
                        const hasOtherElements = cell.querySelector('*:not(br)') !== null; // Ignore empty <br> tags
                        
                        if (hasText || hasImages || hasOtherElements) {
                            columnIsEmpty = false;
                            break;
                        }
                    }
                }
                
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
            if (selectedPlacement) {
                params.placement = selectedPlacement;
            }
            if (selectedBestOf) {
                params.bestof = selectedBestOf;
            }
            
            // Update URL
            TournamentNav.updateUrlParameters(params);
        },
        
        restoreFilterStateFromUrl: function() {
            const urlParams = new URLSearchParams(window.location.search);
            
            // Restore event filter first using applyFilterCombination
            const eventParam = urlParams.get('event');
            if (eventParam) {
                const eventButton = $('#eventFilters .filter-btn[data-value="' + eventParam + '"]');
                if (eventButton.length > 0) {
                    $('#eventFilters .filter-btn').removeClass('active');
                    eventButton.addClass('active');
                    this.applyFilterCombination();
                    
                    // After delay, we can load the proper divisions and rounds for that event
                    setTimeout(() => {
                        this.restoreRemainingFilters(urlParams);
                    }, 1000); // Could be shorter potentially but not a big deal, people are expecting load time on refresh anyways.
                    return;
                }
            }
            
            this.restoreRemainingFilters(urlParams);
        },
        
        restoreRemainingFilters: function(urlParams) {
            let hasFiltersToRestore = false;
            
            const divisionParam = urlParams.get('division');
            if (divisionParam) {
                const divisionButton = $('#divisionFilters .filter-btn[data-value="' + divisionParam + '"]');
                if (divisionButton.length > 0) {
                    $('#divisionFilters .filter-btn').removeClass('active');
                    divisionButton.addClass('active');
                    hasFiltersToRestore = true;
                }
            }
            
            const roundParam = urlParams.get('round');
            if (roundParam) {
                const roundButton = $('#roundFilters .filter-btn[data-filter="round"][data-value="' + roundParam + '"]');
                if (roundButton.length > 0) {
                    $('#roundFilters .filter-btn[data-filter="round"]').removeClass('active');
                    roundButton.addClass('active');
                    hasFiltersToRestore = true;
                }
            }
            
            const placementParam = urlParams.get('placement');
            if (placementParam) {
                const placementButton = $('#roundFilters .filter-btn[data-filter="placement"][data-value="' + placementParam + '"]');
                if (placementButton.length > 0) {
                    $('#roundFilters .filter-btn[data-filter="placement"]').removeClass('active');
                    placementButton.addClass('active');
                    hasFiltersToRestore = true;
                }
            }
            
            const bestofParam = urlParams.get('bestof');
            if (bestofParam) {
                const bestofButton = $('#roundFilters .filter-btn[data-filter="bestof"][data-value="' + bestofParam + '"]');
                if (bestofButton.length > 0) {
                    $('#roundFilters .filter-btn[data-filter="bestof"]').removeClass('active');
                    bestofButton.addClass('active');
                    $('#roundFilters .filter-btn[data-filter="round"]').removeClass('active');
                    hasFiltersToRestore = true;
                }
            }
            
            if (hasFiltersToRestore) {
                this.applyFilterCombination();
            }
        }
    };

    // Export TournamentInfo to global scope for component access
    window.TournamentInfo = TournamentInfo;

    document.addEventListener('DOMContentLoaded', function() {
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
                    TournamentNav.updateUrlParameters({ search: searchValue });
                } else {
                    // Clear search parameter if input is empty
                    TournamentNav.updateUrlParameters({});
                }
            }, 500);
        });
    });

})();
