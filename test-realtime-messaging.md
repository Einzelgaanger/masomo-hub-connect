# Real-Time Messaging Test Guide

## What Was Fixed

### Ukumbi Real-Time Issues:
1. **Subscription Dependencies**: Fixed useEffect dependency to properly trigger when university_id changes
2. **Channel Naming**: Made channel names unique per university to avoid conflicts
3. **Duplicate Prevention**: Added check to prevent fetching own messages (avoiding duplicates)
4. **Debug Logging**: Added comprehensive console logging to track subscription status
5. **Cleanup**: Improved subscription cleanup to prevent memory leaks

### Inbox Real-Time Issues:
1. **Missing Cleanup**: Fixed useEffect to properly return cleanup function
2. **Channel Naming**: Made channel names unique per conversation and user
3. **Global Subscriptions**: Enhanced global subscription to handle both INSERT and UPDATE events
4. **Debug Logging**: Added comprehensive console logging to track subscription status
5. **Read Status Updates**: Added real-time updates for message read status

## Testing Steps

### Test Ukumbi Real-Time:
1. **Open Browser Console** (F12) on both users
2. **User A**: Navigate to Ukumbi tab
3. **User B**: Navigate to Ukumbi tab (same university)
4. **User A**: Send a message
5. **Expected**: User B should see the message appear instantly without refreshing
6. **Check Console**: Look for these logs:
   - "Setting up Ukumbi real-time subscription for university: [university_id]"
   - "Ukumbi subscription status: SUBSCRIBED"
   - "New message received via real-time: [message_data]"

### Test Inbox Real-Time:
1. **Open Browser Console** (F12) on both users
2. **User A**: Navigate to Inbox tab
3. **User B**: Navigate to Inbox tab
4. **User A**: Start a conversation with User B
5. **User B**: Send a message in the conversation
6. **Expected**: User A should see the message appear instantly without refreshing
7. **Check Console**: Look for these logs:
   - "Setting up global Inbox real-time subscription for user: [user_id]"
   - "Global Inbox subscription status: SUBSCRIBED"
   - "New DM received globally via real-time: [message_data]"

## Debug Information

### Console Logs to Look For:
- **Ukumbi**: 
  - `"Setting up Ukumbi real-time subscription for university: [id]"`
  - `"Ukumbi subscription status: SUBSCRIBED"`
  - `"New message received via real-time: [data]"`
  - `"Cleaning up Ukumbi real-time subscription"`

- **Inbox**:
  - `"Setting up global Inbox real-time subscription for user: [id]"`
  - `"Global Inbox subscription status: SUBSCRIBED"`
  - `"New DM received globally via real-time: [data]"`
  - `"Cleaning up global Inbox real-time subscription"`

### Troubleshooting:
1. **No Real-Time Updates**: Check if subscription status shows "SUBSCRIBED"
2. **Duplicate Messages**: Check if own messages are being filtered out
3. **Memory Leaks**: Check if cleanup functions are being called
4. **Connection Issues**: Check Supabase connection and network

## Expected Behavior

✅ **Instant Message Delivery**: Messages should appear immediately without page refresh  
✅ **No Duplicates**: Own messages shouldn't appear twice  
✅ **Proper Cleanup**: Subscriptions should be cleaned up when leaving pages  
✅ **Status Updates**: Like counts and read status should update in real-time  
✅ **Cross-User**: Messages between different users should work seamlessly  

## Performance Notes

- **Unique Channel Names**: Each subscription now uses unique channel names to prevent conflicts
- **Proper Dependencies**: useEffect dependencies are optimized to prevent unnecessary re-subscriptions
- **Memory Management**: Cleanup functions properly remove subscriptions to prevent memory leaks
- **Debug Visibility**: Console logs help track subscription status and message flow
