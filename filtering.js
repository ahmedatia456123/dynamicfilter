(function() { // IIFE
    'use strict';

    // --- Configuration (KEEP AS IS) ---
    const categoryRules = [ /* ... your existing rules ... */ ];
    const queryParamKey = "product_cat";
    // --- End Configuration ---

    const filterElementsCache = {};

    function queryFilterElements() { /* ... your existing function ... */ }
    function showElement(element) { /* ... your existing function ... */ }
    function hideElement(element) { /* ... your existing function ... */ }

    // --- Core Logic Function (KEEP AS IS) ---
    function updateFilterVisibility() {
        // console.log('updateFilterVisibility called. Current URL:', window.location.href);
        queryFilterElements();

        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const urlParams = new URLSearchParams(currentSearch);
        const productCatQueryValue = urlParams.get(queryParamKey);

        for (const key in filterElementsCache) {
            hideElement(filterElementsCache[key]);
        }

        let activeFilterClass = null;
        for (const rule of categoryRules) {
            let match = false;
            if (currentPath.includes(rule.slugIdentifier)) { match = true; }
            if (productCatQueryValue && productCatQueryValue === rule.queryParamValue) { match = true; }
            if (match) {
                activeFilterClass = rule.filterClass;
                break;
            }
        }

        if (activeFilterClass && filterElementsCache[activeFilterClass]) {
            showElement(filterElementsCache[activeFilterClass]);
        } else {
            // console.log("No specific category identifier. Filters hidden.");
        }
    }

    // --- Event Listeners & History API Patching ---

    document.addEventListener('DOMContentLoaded', function() {
        queryFilterElements();
        updateFilterVisibility();

        // --- NEW: Event listener for the specific filter button ---
        const filterToggleButton = document.querySelector('.em-button-outline.em-font-semibold.catalog-toolbar__filter-button');
        if (filterToggleButton) {
            filterToggleButton.addEventListener('click', function() {
                // console.log('Filter toggle button clicked. Re-checking filter visibility.');
                // Optional: Add a small delay if the click action itself takes time to update the DOM or URL
                // setTimeout(updateFilterVisibility, 100); // e.g., 100ms delay
                updateFilterVisibility(); // Or call directly
            });
        } else {
            // console.warn('Filter toggle button (.em-button-outline.em-font-semibold.catalog-toolbar__filter-button) not found.');
        }
        // --- END NEW ---
    });

    window.addEventListener('popstate', updateFilterVisibility);

    const originalPushState = history.pushState;
    history.pushState = function() {
        const result = originalPushState.apply(this, arguments);
        window.dispatchEvent(new Event('pushstate'));
        return result;
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
        const result = originalReplaceState.apply(this, arguments);
        window.dispatchEvent(new Event('replacestate'));
        return result;
    };

    window.addEventListener('pushstate', updateFilterVisibility);
    window.addEventListener('replacestate', updateFilterVisibility);

    // --- WooCommerce Specific AJAX Event (KEEP AS IS, if used) ---
    if (typeof jQuery !== 'undefined') {
        jQuery(document.body).on('updated_wc_div', function() {
            // console.log('jQuery: updated_wc_div detected');
            updateFilterVisibility();
        });
    }

    // console.log("Benefit filter script initialized and listening for changes.");

})(); // End of IIFE
