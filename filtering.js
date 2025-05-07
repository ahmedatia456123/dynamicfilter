(function() { // IIFE to avoid polluting global scope
    'use strict';
console.log("Filtering")
    // --- Configuration ---
    const categoryRules = [
        {
            slugIdentifier: "/product-category/skin-care/",
            queryParamValue: "skin-care",
            filterClass: "benefits-and-uses-for-skin"
        },
        {
            slugIdentifier: "/product-category/hair-care/",
            queryParamValue: "hair-care",
            filterClass: "benefits-and-uses-for-hair"
        },
        {
            slugIdentifier: "/product-category/personal-care/",
            queryParamValue: "personal-care",
            filterClass: "benefits-and-uses-personal"
        }
    ];
    const queryParamKey = "product_cat";
    // --- End Configuration ---

    // Store references to filter elements globally within this scope
    // This assumes the filter elements themselves are not re-rendered by AJAX.
    // If they ARE re-rendered, you'd need to re-query them inside updateFilterVisibility.
    const filterElementsCache = {};

    function queryFilterElements() {
        categoryRules.forEach(rule => {
            const element = document.querySelector('.' + rule.filterClass);
            if (element) {
                filterElementsCache[rule.filterClass] = element;
            } else {
                // Log warning only once or if element was previously found and now isn't
                if (!filterElementsCache[rule.filterClass]) { // Check if it wasn't found before
                    // console.warn(`Filter element with class "${rule.filterClass}" not found initially.`);
                } else if (filterElementsCache[rule.filterClass] && !element) {
                    // console.warn(`Filter element with class "${rule.filterClass}" was found previously but is now missing.`);
                }
            }
        });
    }


    // Helper function to show an element
    function showElement(element) {
        if (element) {
            element.style.display = ''; // Revert to stylesheet-defined display
        }
    }

    // Helper function to hide an element
    function hideElement(element) {
        if (element) {
            element.style.display = 'none';
        }
    }

    // --- Core Logic Function ---
    function updateFilterVisibility() {
        // console.log('updateFilterVisibility called. Current URL:', window.location.href);

        // Re-query elements in case AJAX replaces them.
        // If you are CERTAIN your filter *container* elements are never replaced by AJAX,
        // you can move queryFilterElements() outside and call it only once on DOMContentLoaded.
        // However, re-querying is safer for broader AJAX compatibility.
        queryFilterElements();

        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const urlParams = new URLSearchParams(currentSearch);
        const productCatQueryValue = urlParams.get(queryParamKey);

        // Initially hide all configured filter elements
        for (const key in filterElementsCache) {
            hideElement(filterElementsCache[key]);
        }

        let activeFilterClass = null;

        for (const rule of categoryRules) {
            let match = false;
            if (currentPath.includes(rule.slugIdentifier)) {
                match = true;
                // console.log(`Path match for: ${rule.slugIdentifier}`);
            }
            if (productCatQueryValue && productCatQueryValue === rule.queryParamValue) {
                match = true;
                // console.log(`Query param match for: ${queryParamKey}=${rule.queryParamValue}`);
            }

            if (match) {
                activeFilterClass = rule.filterClass;
                break;
            }
        }

        if (activeFilterClass && filterElementsCache[activeFilterClass]) {
            showElement(filterElementsCache[activeFilterClass]);
            // console.log(`Showing filter: ${activeFilterClass}`);
        } else {
            // console.log("No specific category identifier for benefits filters. All remain hidden.");
        }
    }

    // --- Event Listeners & History API Patching ---

    // Run on initial page load
    document.addEventListener('DOMContentLoaded', function() {
        queryFilterElements(); // Initial query of elements
        updateFilterVisibility();
    });

    // Listen for browser back/forward navigation
    window.addEventListener('popstate', updateFilterVisibility);

    // Monkey-patch history.pushState and history.replaceState
    // to detect URL changes made by AJAX scripts
    const originalPushState = history.pushState;
    history.pushState = function() {
        const result = originalPushState.apply(this, arguments);
        // Dispatch a custom event that our function can listen to, or call directly
        window.dispatchEvent(new Event('pushstate'));
        // Or, call directly: updateFilterVisibility(); (less flexible if other scripts need to know)
        return result;
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
        const result = originalReplaceState.apply(this, arguments);
        window.dispatchEvent(new Event('replacestate'));
        return result;
    };

    // Listen to our custom events triggered by patched history methods
    window.addEventListener('pushstate', updateFilterVisibility);
    window.addEventListener('replacestate', updateFilterVisibility);

    // --- WooCommerce Specific AJAX Event (Optional but Recommended) ---
    // Many WooCommerce AJAX filters (including some core ones and popular plugins)
    // trigger events on `document.body` when they complete.
    // Listening to these can be more reliable than just URL changes if the URL doesn't always change,
    // or if content updates before the URL.
    // Common events (jQuery-based, need vanilla JS equivalent or careful handling):
    // 'updated_wc_div', 'jet-filter-ajax-done', 'facetwp-loaded'
    // Example for a common jQuery pattern `$(document.body).on('event_name', function() { ... });`
    // Vanilla JS equivalent:
    if (typeof jQuery !== 'undefined') { // Check if jQuery is loaded
        jQuery(document.body).on('updated_wc_div', function() {
            // console.log('jQuery: updated_wc_div detected');
            updateFilterVisibility();
        });
        // Add other plugin-specific events here if you know them
        // jQuery(document.body).on('jet-filter-ajax-done', function() {
        //     console.log('jQuery: jet-filter-ajax-done detected');
        //     updateFilterVisibility();
        // });
    } else {
        // If jQuery is not available, you might need to find vanilla JS equivalents
        // or rely on the history API patching. Some plugins might dispatch vanilla events too.
        // Example:
        // document.body.addEventListener('somePluginAjaxCompleteEvent', updateFilterVisibility);
    }

    // Fallback: A more generic (but potentially less efficient) way if specific events aren't known
    // is to use a MutationObserver on the part of the page that AJAX updates (e.g., product grid).
    // This is more complex and should be a last resort if URL and specific events don't cover all cases.
    // For now, we'll rely on URL changes and the common 'updated_wc_div'.

    // console.log("Benefit filter script initialized and listening for changes.");

})(); // End of IIFE
