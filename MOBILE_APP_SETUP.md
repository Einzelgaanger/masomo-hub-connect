# 📱 Mobile App Setup Guide - React Native/Expo

This guide will help you set up the mobile version of Bunifu using React Native and Expo.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac only) or Android Studio

## Quick Start

### 1. Install Expo CLI

```bash
npm install -g expo-cli
```

### 2. Create Expo Project

```bash
cd ..
npx create-expo-app bunifu-mobile --template blank-typescript
cd bunifu-mobile
```

### 3. Install Dependencies

```bash
# Core dependencies
npm install @supabase/supabase-js @tanstack/react-query
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-safe-area-context react-native-screens
npm install expo-image-picker expo-camera expo-notifications
npm install @react-native-async-storage/async-storage
npm install react-native-gesture-handler react-native-reanimated

# UI Components
npm install react-native-paper
npm install nativewind
npm install tailwindcss

# Forms and Validation
npm install react-hook-form zod @hookform/resolvers

# Date utilities
npm install date-fns

# Internationalization
npm install i18next react-i18next
```

### 4. Configure Supabase

Create `src/lib/supabase.ts`:

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 5. Set Up Environment Variables

Create `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Configure Navigation

Create `src/navigation/AppNavigator.tsx`:

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screens
import DashboardScreen from '../screens/DashboardScreen';
import MasomoScreen from '../screens/MasomoScreen';
import UkumbiScreen from '../screens/UkumbiScreen';
import InboxScreen from '../screens/InboxScreen';
import TukioScreen from '../screens/TukioScreen';
import AjiraScreen from '../screens/AjiraScreen';
import SifaScreen from '../screens/SifaScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Masomo" component={MasomoScreen} />
        <Tab.Screen name="Ukumbi" component={UkumbiScreen} />
        <Tab.Screen name="Inbox" component={InboxScreen} />
        <Tab.Screen name="Tukio" component={TukioScreen} />
        <Tab.Screen name="Ajira" component={AjiraScreen} />
        <Tab.Screen name="Sifa" component={SifaScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

## Mobile-Specific Features to Implement

### 1. Push Notifications

```bash
npm install expo-notifications
```

Configure in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

### 2. Biometric Authentication

```bash
npm install expo-local-authentication
```

### 3. Camera Integration

```bash
npm install expo-camera expo-image-picker
```

### 4. Offline Support

```bash
npm install @react-native-async-storage/async-storage
npm install @tanstack/react-query-persist-client
```

### 5. Deep Linking

Configure in `app.json`:

```json
{
  "expo": {
    "scheme": "bunifu",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "bunifu.world"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## Project Structure

```
bunifu-mobile/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── masomo/
│   │   └── ...
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── MasomoScreen.tsx
│   │   └── ...
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── ...
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── ...
├── assets/
├── app.json
├── package.json
└── tsconfig.json
```

## Running the App

### Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Key Differences from Web

1. **Navigation**: Use React Navigation instead of React Router
2. **Styling**: Use NativeWind or StyleSheet instead of Tailwind CSS
3. **Storage**: Use AsyncStorage instead of localStorage
4. **Components**: Use React Native components instead of HTML elements
5. **Images**: Use `expo-image` for optimized image loading
6. **Forms**: Adapt form components for mobile touch input

## Testing

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react-native jest

# Run tests
npm test
```

## Deployment

### iOS App Store

1. Create Apple Developer account
2. Configure app in App Store Connect
3. Build with EAS: `eas build --platform ios`
4. Submit for review

### Google Play Store

1. Create Google Play Developer account
2. Configure app in Play Console
3. Build with EAS: `eas build --platform android`
4. Submit for review

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [NativeWind](https://www.nativewind.dev/)

## Next Steps

1. ✅ Set up Expo project
2. ✅ Configure Supabase client
3. ✅ Implement authentication flow
4. ✅ Create navigation structure
5. ✅ Convert web components to mobile
6. ✅ Implement push notifications
7. ✅ Add offline support
8. ✅ Test on real devices
9. ✅ Submit to app stores
