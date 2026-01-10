"use strict";
// D&D Tracker TypeScript Entry Point
// This is the new entry point replacing loader.js
if (typeof window.APP_CONFIG !== 'undefined' && window.APP_CONFIG.DEBUG_MODE) {
    console.log('🎲 D&D Tracker - TypeScript Migration starting...');
}
// TODO: Import and initialize all modules here
// For now, this is a placeholder to verify the build setup works
// Temporary: Load the old loader.js to keep app functional during migration
const script = document.createElement('script');
script.src = 'loader.js';
document.body.appendChild(script);
