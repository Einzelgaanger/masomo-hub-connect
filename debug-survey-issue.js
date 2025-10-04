// Debug Survey2024 Issue
// Run this in browser console to debug the missing component

console.log('🔍 Debugging Survey2024 Issue...');

// Check current route
console.log('Current URL:', window.location.href);
console.log('Current pathname:', window.location.pathname);

// Check if we're on a survey route
const isSurveyRoute = window.location.pathname.includes('survey');
console.log('Is survey route:', isSurveyRoute);

// Check React Router state
if (window.__REACT_ROUTER_STATE__) {
  console.log('React Router state:', window.__REACT_ROUTER_STATE__);
}

// Check for any cached components
console.log('Checking for cached components...');

// Check if there are any dynamic imports
const scripts = Array.from(document.scripts);
const surveyScripts = scripts.filter(script => 
  script.src && script.src.includes('survey')
);
console.log('Survey-related scripts:', surveyScripts);

// Check for any hidden routes in the DOM
const routeElements = document.querySelectorAll('[data-route]');
console.log('Route elements found:', routeElements);

// Check for any error boundaries
const errorBoundaries = document.querySelectorAll('[data-error-boundary]');
console.log('Error boundaries:', errorBoundaries);

// Check for any lazy-loaded components
const lazyComponents = document.querySelectorAll('[data-lazy]');
console.log('Lazy components:', lazyComponents);

// Check React DevTools if available
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('React DevTools available');
  console.log('React version:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__.version);
}

// Check for any webpack chunks
const chunks = Object.keys(window.__webpack_require__.cache || {});
const surveyChunks = chunks.filter(chunk => chunk.includes('survey'));
console.log('Survey-related chunks:', surveyChunks);

// Check for any module errors
if (window.__webpack_require__) {
  const modules = window.__webpack_require__.cache;
  const surveyModules = Object.keys(modules).filter(key => 
    key.includes('Survey') || key.includes('survey')
  );
  console.log('Survey-related modules:', surveyModules);
}

console.log('🎯 Debug complete!');
console.log('If Survey2024 is still showing, try:');
console.log('1. Hard refresh (Ctrl+Shift+R)');
console.log('2. Clear browser cache');
console.log('3. Check if there are any hidden routes');
console.log('4. Check if there are any dynamic imports');
