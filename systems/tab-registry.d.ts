interface TabConfig {
    /** Array of render function names to call when tab is shown */
    renders: string[];
    /** Optional one-time initialization function (called only on first view) */
    init: string | null;
    /** Optional cleanup function (called when leaving tab) */
    cleanup: string | null;
    /** Internal flag to track if init has been called */
    _initialized?: boolean;
}
/**
 * Tab-Render Registry - Maps tab names to their associated render functions
 */
declare const TAB_RENDER_REGISTRY: Record<string, TabConfig>;
/**
 * Execute all render functions for a given tab
 * Provides error handling and validation
 *
 * @param tabName - The tab identifier (e.g., 'dice', 'initiative')
 */
declare function renderTabContent(tabName: string): void;
/**
 * Validate the tab registry on app startup (DEBUG mode only)
 * Checks for missing functions and invalid configurations
 */
declare function validateTabRegistry(): void;
//# sourceMappingURL=tab-registry.d.ts.map