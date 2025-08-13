/**
 * Team Loading Signs - Adds loading sign videos next to team skiers in top 4 positions
 * Handles collegiate tournament team name display and positioning
 */

(function(window) {
    'use strict';
    
    const TeamLoadingSigns = {
        
        addLoadingSignsToTopTeamSkiers: function() {
            
            // Only show loading signs for leaderboard views, not running order
            if (AppState.currentDisplayMode === 'running-order') {
                return;
            }
            
            // Find all tables in the leaderboard content
            const tables = $('#leaderboardContent table');
            
            tables.each((tableIndex, table) => {
                this.processTableForTeamSigns($(table));
            });
        },
        
        processTableForTeamSigns: function($table) {
            // Find all data rows (skip header rows)
            const $dataRows = $table.find('tr').filter((index, row) => {
                const $row = $(row);
                // Skip header rows (those with table-warning, table-primary, table-info classes or containing "Leader Board", "Running Order", etc.)
                return !$row.hasClass('table-warning') && 
                       !$row.hasClass('table-primary') && 
                       !$row.hasClass('table-info') &&
                       !$row.find('td').hasClass('table-warning') &&
                       !$row.find('td').hasClass('table-primary') &&
                       !$row.find('td').hasClass('table-info') &&
                       !$row.text().includes('Leader Board') &&
                       !$row.text().includes('Running Order') &&
                       !$row.text().includes('EventGroup:') &&
                       !$row.text().includes('Group:');
            });
            
            // Process only the first 4 data rows
            $dataRows.slice(0, 4).each((rowIndex, row) => {
                this.addLoadingSignToTeamSkier($(row), rowIndex + 1);
            });
        },
        
        addLoadingSignToTeamSkier: function($row, position) {
            // Look for team code cell - typically the second cell after skier name
            const $cells = $row.find('td');
            
            if ($cells.length >= 2) {
                const $teamCell = $cells.eq(1); // Second cell should be team code
                const teamText = $teamCell.text().trim();
                
                // Only show loading signs for team "MAD"
                if (teamText === 'MAD') {
                    
                    // Check if loading sign already exists
                    if ($teamCell.find('.team-loading-sign').length === 0) {
                        // Create the loading sign video element
                        const $loadingSign = $('<video>', {
                            class: 'team-loading-sign',
                            src: 'images/loadingSign.mp4',
                            autoplay: true,
                            loop: true,
                            muted: true,
                            style: 'width: 20px; height: auto; margin-left: 5px; vertical-align: middle; display: inline-block;'
                        });
                        
                        // Add the loading sign after the team text
                        $teamCell.append($loadingSign);
                    } else {
                    }
                } else {
                }
            } else {
            }
        },
        
        // Remove all loading signs (useful for cleanup)
        removeAllLoadingSigns: function() {
            $('.team-loading-sign').remove();
        },
        
        // Re-scan and update loading signs (call this after content updates)
        updateLoadingSigns: function() {
            this.removeAllLoadingSigns();
            this.addLoadingSignsToTopTeamSkiers();
        }
    };
    
    // Export to global scope
    window.TeamLoadingSigns = TeamLoadingSigns;
    
})(window);