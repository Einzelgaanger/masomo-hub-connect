# Clear Browser Cache Instructions

## For Development Issues (Character Logging)

The excessive character logging is due to browser cache. To fix:

### Method 1: Hard Refresh
- **Chrome/Edge**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Safari**: `Cmd + Shift + R`

### Method 2: Clear Cache
1. Open Developer Tools (`F12`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Method 3: Disable Cache (Development)
1. Open Developer Tools (`F12`)
2. Go to Network tab
3. Check "Disable cache" checkbox
4. Keep DevTools open while developing

## For Network Connectivity Issues

### Check Network Status
1. Open Developer Tools (`F12`)
2. Go to Console tab
3. Look for `ERR_NAME_NOT_RESOLVED` errors
4. Check Network tab for failed requests

### Common Solutions
1. **Check Internet Connection**: Ensure you're connected to the internet
2. **DNS Issues**: Try using different DNS (8.8.8.8, 1.1.1.1)
3. **Firewall/Proxy**: Check if firewall is blocking Supabase
4. **Supabase Status**: Check if Supabase services are down

### Supabase Connection Test
Run this in the browser console:
```javascript
// Test Supabase connection
fetch('https://ztxgmqunqsookgpmluyp.supabase.co/rest/v1/profiles?select=id&limit=1', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0eGdtcXVucXNvb2tncG1sdXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMTAzODQsImV4cCI6MjA3Mjg4NjM4NH0.DK2oySyoBu29Z-uNsrmhX9VtuADqtjwg2OxBj1jXYas'
  }
})
.then(response => response.json())
.then(data => console.log('Supabase connection test:', data))
.catch(error => console.error('Supabase connection failed:', error));
```

## Expected Results After Fixes

### Character System
- ✅ No excessive logging in console
- ✅ Consistent character display between dashboard and profile
- ✅ Fast character loading with caching

### Chat System
- ✅ Messages send instantly
- ✅ Real-time updates work
- ✅ No network errors in console

### Network Issues
- ✅ No `ERR_NAME_NOT_RESOLVED` errors
- ✅ WebSocket connections work
- ✅ All API calls succeed
