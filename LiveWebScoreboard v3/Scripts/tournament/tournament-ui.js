/**
 * Tournament UI - Handles all UI interactions, panel positioning, and event binding
 * Manages tournament panel rendering, collapse events, and viewport-specific styling
 */

(function(window) {
    'use strict';
    
    const TournamentUI = {
        
        renderInfo: function(combinedHtml) {
            const tournamentInfoPanel = this.createOrGetTournamentPanel();
            const isScoresPage = this.isOnScoresPage();
            
            this.positionTournamentPanel(tournamentInfoPanel, isScoresPage);
            this.updatePanelContent(tournamentInfoPanel, combinedHtml);
            
            if (combinedHtml) {
                this.applyViewportSpecificStyling(tournamentInfoPanel, isScoresPage);
            }
        },

        createOrGetTournamentPanel: function() {
            let tournamentInfoPanel = document.querySelector('#tInfo');
            
            if (!tournamentInfoPanel) {
                tournamentInfoPanel = document.createElement('div');
                tournamentInfoPanel.id = 'tInfo';
                tournamentInfoPanel.className = 'tournament-info';
            }
            
            return tournamentInfoPanel;
        },

        isOnScoresPage: function() {
            const leaderboardSection = document.getElementById('leaderboardSection');
            return leaderboardSection && leaderboardSection.style.display !== 'none';
        },

        positionTournamentPanel: function(panel, isScoresPage) {
            if (isScoresPage) {
                this.positionPanelForScoresPage(panel);
            } else {
                this.positionPanelForSearchPage(panel);
            }
        },

        positionPanelForScoresPage: function(panel) {
            const leaderboardSection = document.getElementById('leaderboardSection');
            
            if (window.innerWidth <= 1000) {
                const firstChild = leaderboardSection.firstChild;
                if (firstChild) {
                    leaderboardSection.insertBefore(panel, firstChild);
                } else {
                    leaderboardSection.appendChild(panel);
                }
            } else {
                document.querySelector('.tournament-display').appendChild(panel);
            }
        },

        positionPanelForSearchPage: function(panel) {
            if (window.innerWidth <= 1000) {
                const selectedCard = document.querySelector('.mobile-tournament-card.selected');
                if (selectedCard && selectedCard.parentNode) {
                    selectedCard.parentNode.insertBefore(panel, selectedCard.nextSibling);
                } else {
                    document.querySelector('.tournament-display').appendChild(panel);
                }
            } else {
                document.querySelector('.tournament-display').appendChild(panel);
            }
        },

        updatePanelContent: function(panel, combinedHtml) {
            if (!combinedHtml) {
                panel.innerHTML = '<p>Loading tournament information...</p>';
            } else {
                panel.innerHTML = combinedHtml;
            }
        },

        applyViewportSpecificStyling: function(panel, isScoresPage) {
            if (window.innerWidth <= 1000) {
                this.applyMobileStyling(panel);
            } else {
                this.applyDesktopStyling(panel, isScoresPage);
            }
        },

        applyMobileStyling: function(panel) {
            // Mobile: Clear any desktop transform positioning and scroll to panel
            panel.style.transform = '';
            panel.style.position = '';
            setTimeout(() => {
                const panelRect = panel.getBoundingClientRect();
                const currentScroll = window.scrollY;
                const targetY = currentScroll + panelRect.top - 140; 
                window.scrollTo({ top: targetY, behavior: 'smooth' });
            }, CONFIG.SCROLL_DELAY);
        },

        applyDesktopStyling: function(panel, isScoresPage) {
            // Desktop: Remove mobile compact styling and apply desktop positioning
            $(panel).removeClass('compact-mobile-scores');
            panel.style.position = 'relative';
            
            if (isScoresPage) {
                // Scores page: Position at top
                panel.style.transform = 'translateY(0px)';
            } else {
                // Tournament search page: Position at current scroll location
                panel.style.transform = `translateY(${window.scrollY}px)`;
            }
        },

        bindCollapseEvents: function(response) {
            const bindCollapseToggle = (headerSelector, collapseSelector, chevronSelector) => {
                $(headerSelector).on('click', function () {
                    const $collapse = $(collapseSelector);
                    const $chevron = $(chevronSelector);
                    if ($collapse.is(':visible')) {
                        $collapse.css('display', 'none');
                        $chevron.removeClass('rotated');
                    } else {
                        $collapse.attr('style', 'display: block !important');
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
            
            // Initialize Details button functionality
            this.initializeDetailsButton();
        },

        initializeDetailsButton: function() {
            // Remove any existing handlers
            $(document).off('click', '#detailsToggleBtn');
            
            // Add click handler for Details button
            $(document).on('click', '#detailsToggleBtn', function() {
                const $button = $(this);
                const $headers = $('.tournament-section-header');
                const $content = $('.tournament-section-collapsible');
                
                if ($headers.is(':visible')) {
                    // Hide all sections
                    $headers.css('display', 'none');
                    $content.css('display', 'none');
                    $button.text('Details');
                } else {
                    // Show all sections - need !important to override CSS
                    $headers.attr('style', 'display: flex !important');
                    $content.attr('style', 'display: block !important');
                    $button.text('Hide Details');
                }
            });
        }
    };

    // Export to global scope
    window.TournamentUI = TournamentUI;
    
})(window);