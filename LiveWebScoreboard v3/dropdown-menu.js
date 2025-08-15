/**
 * Dropdown Menu component for LiveWebScoreboard
 * Handles the resources dropdown menu functionality
 */

(function(window) {
    'use strict';
    
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

    // Export to global scope
    window.DropdownMenu = DropdownMenu;
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        DropdownMenu.init();
    });
    
})(window);