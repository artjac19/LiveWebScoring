/**
 * Tournament HTML Builder - Handles all HTML generation for tournament details
 * Manages tournament details panels, officials sections, team sections, and skier links
 */

(function(window) {
    'use strict';
    
    const TournamentHTML = {
        
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

        addOverallSkierLinks: function(htmlContent) {
            if (!htmlContent || typeof htmlContent !== 'string') {
                return htmlContent;
            }
            
            // Add click handlers to skier names in Overall results to show recap
            return htmlContent.replace(
                /<td[^>]*class="[^"]*skier-name[^"]*"[^>]*>([^<]+)<\/td>/gi,
                function(match, skierName) {
                    const cleanName = skierName.trim();
                    if (cleanName && cleanName.length > 0) {
                        return `<td class="skier-name clickable-skier" data-skier-name="${cleanName}">${cleanName}</td>`;
                    }
                    return match;
                }
            );
        },

    };

    // Export to global scope
    window.TournamentHTML = TournamentHTML;
    
})(window);