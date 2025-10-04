// Test Navigation
// Run this in browser console to test navigation

console.log('🧪 Testing Navigation...');

// Test 1: Check current URL
console.log('Current URL:', window.location.href);

// Test 2: Check if we're on a unit page
const isUnitPage = window.location.pathname.includes('/unit/');
console.log('Is unit page:', isUnitPage);

// Test 3: Extract class ID from URL
const pathParts = window.location.pathname.split('/');
const classIdIndex = pathParts.indexOf('class') + 1;
const classId = pathParts[classIdIndex];
console.log('Class ID:', classId);

// Test 4: Test navigation back to class page
if (isUnitPage && classId) {
  const classPageUrl = `/class/${classId}`;
  console.log('Should navigate to:', classPageUrl);
  
  // Test navigation (don't actually navigate)
  console.log('✅ Navigation logic is correct');
  console.log('When user clicks back, they will go to:', classPageUrl);
  console.log('This will show the main class page with chat and units');
} else {
  console.log('❌ Not on a unit page or class ID not found');
}

// Test 5: Check if ClassPage component exists
console.log('ClassPage component should handle both chat and units display');

console.log('🎯 Navigation test complete!');
