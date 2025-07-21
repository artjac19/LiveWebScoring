(function() {
    'use strict';
    const CONFIG = {
        MOBILE_BREAKPOINT: 1000,
        ANIMATION_DURATION: 300,
        SCROLL_DELAY: 100,
        AJAX_ENDPOINT: "TDetails.aspx",
        RESIZE_DEBOUNCE: 250
    };

    const AppState = {
        currentSelectedTournamentId: '',
        currentTrickVideoText: '',
        lastKnownMobile: false
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

    const MobilePanel = {
        create: function(selectedCard) {
            if (!selectedCard) return null;

            // Find existing panel or create new one
            let mobileDetailPanel = document.querySelector('.mobile-tournament-detail');
            if (!mobileDetailPanel) {
                mobileDetailPanel = document.createElement('div');
                mobileDetailPanel.className = 'mobile-tournament-detail';
            }
            
            selectedCard.parentNode.insertBefore(mobileDetailPanel, selectedCard.nextSibling);

            mobileDetailPanel.innerHTML = 'Loading tournament information...';

            setTimeout(() => {
                mobileDetailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, CONFIG.SCROLL_DELAY);

            return mobileDetailPanel;
        }
    };

    const TournamentInfo = {
        load: function(sanctionId, trickVideoText) {
            AppState.currentSelectedTournamentId = sanctionId;
            AppState.currentTrickVideoText = trickVideoText || '';

            const isMobile = Utils.isMobile();

            if (isMobile) {
                const mobileDetailPanel = document.querySelector('.mobile-tournament-detail');
                if (mobileDetailPanel) {
                    mobileDetailPanel.innerHTML = 'Loading tournament information...';
                }
            } else {
                $('#tournamentInfoPanel').html('<p>Loading tournament information...</p>');
            }

            $.getJSON(CONFIG.AJAX_ENDPOINT, { sid: sanctionId })
                .done((response) => {
                    this.processResponse(response, trickVideoText);
                })
                .fail((xhr, status, error) => {
                    System.Diagnostics.Debug.WriteLine('[LWS] AJAX FAIL for sid=' + sanctionId + ', status=' + status + ', error=' + error);
                    $('#tournamentInfoPanel').html('<p class="text-danger">Error loading tournament information: ' + error + '</p>' +
                        '<p>Status: ' + status + '</p>' +
                        '<pre class="small">' + (xhr.responseText || 'No response text') + '</pre>');
                });
        },

        processResponse: function(response, trickVideoText) {
            if (!response) {
                $('#tournamentInfoPanel').html('<div class="text-danger">Invalid response from server (null)</div>');
                return;
            }
            if (typeof response !== 'object') {
                $('#tournamentInfoPanel').html('<div class="text-danger">Invalid response format (not an object)</div>');
                return;
            }
            if (!response.Success) {
                const errorHtml = '<p class="text-danger">' + (response.ErrorMessage || 'Unknown error') + '</p>';
                
                // Show error in current view (mobile or desktop)
                if (Utils.isMobile()) {
                    const mobileDetailPanel = document.querySelector('.mobile-tournament-detail');
                    if (mobileDetailPanel) {
                        mobileDetailPanel.innerHTML = errorHtml;
                    }
                } else {
                    $('#tournamentInfoPanel').html(errorHtml);
                }
                return;
            }

            const combinedHtml = this.buildDetailsHtml(response, trickVideoText);
            this.renderDetails(combinedHtml);
            this.bindCollapseEvents(response);
        },

        buildDetailsHtml: function(response, trickVideoText) {
            let combinedHtml = '<div class="tournament-detail-panel">';
            let tournamentName = '';

            // Active Event Banner
            if (response.activeEvent && response.activeEvent.trim() !== "") {
                combinedHtml += '<div class="active-event-banner">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f8f9fa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="active-event-icon"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2.5 2.5"/></svg>' +
                    response.activeEvent +
                    '</div>';
            }

            // Tournament Details Section (extracts name during processing)
            const detailsResult = this.buildDetailsSection(response, trickVideoText);
            tournamentName = detailsResult.tournamentName;
            
            // Add tournament name with responsive font sizing
            if (tournamentName) {
                const sizeClass = tournamentName.length > 25 ? 'tournament-name-small' : 'tournament-name-large';
                combinedHtml += '<div class="tournament-name ' + sizeClass + '">' + tournamentName + '</div>';
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

        renderDetails: function(combinedHtml) {
            const isMobile = Utils.isMobile();
            
            if (isMobile) {
                const mobileDetailPanel = document.querySelector('.mobile-tournament-detail');
                if (mobileDetailPanel) {
                    mobileDetailPanel.innerHTML = combinedHtml;
                }
            } else {
                $('#tournamentInfoPanel').html(combinedHtml);
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
            
            if (response.teams && Array.isArray(response.teams) && response.teams.length > 0) {
                bindCollapseToggle('#teamsToggleHeader', '#teamsCollapse', '#teamsChevron');
                $('#teamsCollapse').show();
                $('#teamsChevron').addClass('rotated');
            }

            $('#tournamentDetailsCollapse').show();
            $('#tournamentDetailsChevron').addClass('rotated');
            $('#officialsCollapse').show();
            $('#officialsChevron').addClass('rotated');
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
            const mobileTListDiv = document.getElementById('MobileTList');

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
                    <span class="mobile-tournament-value small-text">${data.loc || 'N/A'} | <i>Sanction:</i> ${data.sanction || 'N/A'}</span>
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

                if (Utils.isMobile()) {
                    MobilePanel.create(card);
                }

                TournamentInfo.load(data.sanction, data.trickVideoText);
                positionPanelRelativeToItem(card);
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
                    positionPanelRelativeToItem(this);
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
                this.selectTournamentInView(isMobile, AppState.currentSelectedTournamentId);
                TournamentInfo.load(AppState.currentSelectedTournamentId, AppState.currentTrickVideoText);
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

                if (selectedCard) {
                    MobilePanel.create(selectedCard);
                }
            } else {
                // Find and select the desktop table row
                document.querySelectorAll('#TList table tr').forEach(row => {
                    row.classList.remove('selected');
                    const sanctionCell = row.querySelector('.sanction-col');
                    if (sanctionCell && sanctionCell.textContent.trim() === sanctionId) {
                        row.classList.add('selected');
                    }
                });
            }
        }
    };

    document.addEventListener('DOMContentLoaded', function() {
        DropdownMenu.init();
        TournamentList.init();
    });

})();
function positionPanelRelativeToItem(selectedElement) {
    const panel = document.getElementById('tournamentInfoPanel');
    if (panel && selectedElement) {
        panel.style.position.y = 'absolute';
        panel.style.top = selectedElement.offsetTop + 'px';
    }
}