/**
 * Tournament List component for LiveWebScoreboard
 * Handles tournament list display and mobile/desktop view management
 * Extracted from default.js for better modularity
 */

(function(window) {
    'use strict';
    
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
        },
        
        selectTournamentFromUrl: function(sanctionId, view) {
            // Try to find the tournament with the given sanctionId
            let found = false;
            let trickVideoText = '';
            
            // First, clear all existing selections
            document.querySelectorAll('#TList tr').forEach(r => r.classList.remove('selected'));
            document.querySelectorAll('.mobile-tournament-card').forEach(c => c.classList.remove('selected'));
            
            // Check desktop table rows first
            document.querySelectorAll('#TList table tr').forEach(row => {
                const sanctionCell = row.querySelector('.sanction-col');
                if (sanctionCell && sanctionCell.textContent.trim() === sanctionId) {
                    // Mark row as selected and get trick video text
                    row.classList.add('selected');
                    trickVideoText = row.getAttribute('data-trick-video') || '';
                    found = true;
                }
            });
            
            // Also check mobile cards and mark selected
            document.querySelectorAll('.mobile-tournament-card').forEach(card => {
                if (card.getAttribute('data-sanction-id') === sanctionId) {
                    card.classList.add('selected');
                    if (!found) {
                        // Get trick video text if not already found from desktop
                        trickVideoText = card.getAttribute('data-trick-video') || '';
                        found = true;
                    }
                }
            });
            
            if (found) {
                // Now load the tournament info - renderInfo will find the selected card/row
                TournamentInfo.load(sanctionId, trickVideoText);
                
                // If view parameter is specified, trigger that view after a short delay
                if (view) {
                    setTimeout(() => {
                        const viewButton = document.querySelector(`.tnav-btn[data-view="${view}"]`);
                        if (viewButton) {
                            viewButton.click();
                        }
                    }, 1000); // Wait for tournament info to load
                }
            } else {
                console.log('Tournament with sanctionId ' + sanctionId + ' not found in current view');
                // Try again after a longer delay in case the list is still loading
                setTimeout(() => {
                    this.selectTournamentFromUrl(sanctionId, view);
                }, 1000);
            }
        }
    };

    // Export to global scope
    window.TournamentList = TournamentList;
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        TournamentList.init();
    });
    
})(window);