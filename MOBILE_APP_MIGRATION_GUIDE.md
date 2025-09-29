# 📱 Complete Mobile App Migration Guide
## Masomo Hub Connect Web → React Native Mobile App

---

## 🏗️ **PHASE 1: PROJECT SETUP & FOUNDATION**

### **1.1 Initialize React Native Project**
```bash
# Create new React Native project
npx react-native init MasomoHubConnect --template react-native-template-typescript

# OR use Expo (recommended for faster development)
npx create-expo-app MasomoHubConnect --template typescript
```

### **1.2 Install Core Dependencies**
```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# UI Components
npm install react-native-elements react-native-vector-icons
npm install react-native-paper @react-native-community/slider

# State Management
npm install @tanstack/react-query
npm install @reduxjs/toolkit react-redux

# Supabase (same as web)
npm install @supabase/supabase-js

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Media & Files
npm install react-native-image-picker react-native-video
npm install react-native-document-picker

# Notifications
npm install @react-native-async-storage/async-storage
npm install @react-native-community/push-notification-ios
npm install @react-native-firebase/messaging

# Charts & Animations
npm install react-native-chart-kit react-native-svg
npm install react-native-reanimated react-native-gesture-handler

# Utilities
npm install date-fns react-native-device-info
npm install react-native-keychain react-native-biometrics
```

---

## 🗂️ **PHASE 2: FILE STRUCTURE MIGRATION**

### **2.1 Create Mobile App Structure**
```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components (replaces pages/)
├── navigation/         # Navigation configuration
├── hooks/              # Custom hooks (same as web)
├── services/           # API services (replaces integrations/)
├── utils/              # Utility functions
├── types/              # TypeScript types
├── constants/          # App constants
├── assets/             # Images, fonts, etc.
└── store/              # Redux store (if using Redux)
```

---

## 📱 **PHASE 3: SCREEN MIGRATION (Pages → Screens)**

### **3.1 Main Screens to Create**

#### **A. Authentication Screens**
- `src/screens/auth/LoginScreen.tsx` (from `src/pages/Login.tsx`)
- `src/screens/auth/RegisterScreen.tsx` (from `src/pages/ApplicationForm.tsx`)
- `src/screens/auth/ApplicationStatusScreen.tsx` (from `src/pages/ApplicationStatus.tsx`)

#### **B. Main App Screens**
- `src/screens/DashboardScreen.tsx` (from `src/pages/Dashboard.tsx`)
- `src/screens/MasomoScreen.tsx` (from `src/pages/Units.tsx`)
- `src/screens/UkumbiScreen.tsx` (from `src/pages/Ukumbi.tsx`)
- `src/screens/AjiraScreen.tsx` (from `src/pages/Ajira.tsx`)
- `src/screens/TukioScreen.tsx` (from `src/pages/Events.tsx`)
- `src/screens/SifaScreen.tsx` (from `src/pages/Sifa.tsx`)
- `src/screens/ProfileScreen.tsx` (from `src/pages/Profile.tsx`)

#### **C. Admin Screens**
- `src/screens/admin/AdminDashboardScreen.tsx` (from `src/pages/AdminDashboard.tsx`)
- `src/screens/admin/AdminApplicationsScreen.tsx` (from `src/pages/admin/AdminApplications.tsx`)

---

## 🧩 **PHASE 4: COMPONENT MIGRATION**

### **4.1 UI Components Migration**

#### **A. Layout Components**
| Web Component | Mobile Equivalent | Actions Required |
|---------------|-------------------|------------------|
| `AppLayout.tsx` | `AppLayout.tsx` | Replace with React Native View, SafeAreaView |
| `ClientHeader.tsx` | `Header.tsx` | Use React Navigation header |
| `Sidebar.tsx` | `BottomTabNavigator.tsx` | Convert to bottom tab navigation |

#### **B. Form Components**
| Web Component | Mobile Equivalent | Actions Required |
|---------------|-------------------|------------------|
| `button.tsx` | `Button.tsx` | Use React Native TouchableOpacity/Pressable |
| `input.tsx` | `TextInput.tsx` | Use React Native TextInput |
| `textarea.tsx` | `TextInput.tsx` | Use React Native TextInput with multiline |
| `select.tsx` | `Picker.tsx` | Use React Native Picker or custom modal |
| `card.tsx` | `Card.tsx` | Use React Native View with styling |

#### **C. Data Display Components**
| Web Component | Mobile Equivalent | Actions Required |
|---------------|-------------------|------------------|
| `table.tsx` | `FlatList.tsx` | Use React Native FlatList |
| `carousel.tsx` | `ScrollView.tsx` | Use React Native ScrollView with paging |
| `chart.tsx` | `Chart.tsx` | Use react-native-chart-kit |

### **4.2 Feature Components Migration**

#### **A. Achievement Components**
- `AchievementPost.tsx` → `AchievementCard.tsx`
- `CreateAchievementForm.tsx` → `CreateAchievementModal.tsx`
- `AchievementMediaCarousel.tsx` → `MediaCarousel.tsx`

#### **B. Unit Components**
- `NotesTab.tsx` → `NotesScreen.tsx`
- `PastPapersTab.tsx` → `PastPapersScreen.tsx`
- `AssignmentsTab.tsx` → `AssignmentsScreen.tsx`
- `EventsTab.tsx` → `EventsScreen.tsx`

---

## 🧭 **PHASE 5: NAVIGATION IMPLEMENTATION**

### **5.1 Navigation Structure**
```typescript
// src/navigation/AppNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Masomo" component={MasomoScreen} />
      <Tab.Screen name="Ukumbi" component={UkumbiScreen} />
      <Tab.Screen name="Ajira" component={AjiraScreen} />
      <Tab.Screen name="Tukio" component={TukioScreen} />
      <Tab.Screen name="Sifa" component={SifaScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Root Stack Navigator
function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}
```

---

## 🔧 **PHASE 6: DETAILED FILE MIGRATION**

### **6.1 Core App Files**

#### **A. App.tsx → App.tsx**
```typescript
// Current web App.tsx
// Actions:
// 1. Remove React Router imports
// 2. Replace with React Navigation
// 3. Update routing structure
// 4. Add navigation container
// 5. Update authentication flow
```

#### **B. main.tsx → index.js**
```typescript
// Current web main.tsx
// Actions:
// 1. Remove React DOM rendering
// 2. Add React Native AppRegistry
// 3. Update entry point
// 4. Add platform-specific code
```

### **6.2 Authentication Files**

#### **A. useAuth.tsx**
```typescript
// File: src/hooks/useAuth.tsx
// Actions:
// 1. Keep Supabase auth logic (same)
// 2. Add biometric authentication
// 3. Add secure storage for tokens
// 4. Add device-specific auth features
```

#### **B. Login.tsx → LoginScreen.tsx**
```typescript
// File: src/screens/auth/LoginScreen.tsx
// Actions:
// 1. Replace HTML form with React Native components
// 2. Add biometric login option
// 3. Update styling for mobile
// 4. Add keyboard handling
// 5. Add loading states
```

### **6.3 Dashboard Files**

#### **A. Dashboard.tsx → DashboardScreen.tsx**
```typescript
// File: src/screens/DashboardScreen.tsx
// Actions:
// 1. Replace AppLayout with React Native View
// 2. Update WelcomeSection for mobile
// 3. Update WallOfFameSection for mobile
// 4. Update UpcomingSection for mobile
// 5. Add pull-to-refresh
// 6. Add infinite scroll
```

#### **B. WelcomeSection.tsx**
```typescript
// File: src/components/dashboard/WelcomeSection.tsx
// Actions:
// 1. Replace Card with React Native View
// 2. Update typography for mobile
// 3. Add responsive design
// 4. Update animations for mobile
```

### **6.4 Feature Screens**

#### **A. Sifa.tsx → SifaScreen.tsx**
```typescript
// File: src/screens/SifaScreen.tsx
// Actions:
// 1. Replace grid layout with FlatList
// 2. Update floating button for mobile
// 3. Add pull-to-refresh
// 4. Update search and filters for mobile
// 5. Add infinite scroll
// 6. Update media carousel for mobile
```

#### **B. Ukumbi.tsx → UkumbiScreen.tsx**
```typescript
// File: src/screens/UkumbiScreen.tsx
// Actions:
// 1. Replace chat interface with mobile chat
// 2. Add keyboard handling
// 3. Update message bubbles for mobile
// 4. Add swipe gestures
// 5. Add voice message support
// 6. Add emoji picker
```

### **6.5 Unit Components**

#### **A. NotesTab.tsx → NotesScreen.tsx**
```typescript
// File: src/screens/unit/NotesScreen.tsx
// Actions:
// 1. Replace tab with full screen
// 2. Update file upload for mobile
// 3. Add camera integration
// 4. Update comment system for mobile
// 5. Add swipe gestures
// 6. Update media preview for mobile
```

#### **B. PastPapersTab.tsx → PastPapersScreen.tsx**
```typescript
// File: src/screens/unit/PastPapersScreen.tsx
// Actions:
// 1. Same as NotesScreen
// 2. Add PDF viewer integration
// 3. Add download functionality
// 4. Add offline support
```

### **6.6 Admin Components**

#### **A. AdminDashboard.tsx → AdminDashboardScreen.tsx**
```typescript
// File: src/screens/admin/AdminDashboardScreen.tsx
// Actions:
// 1. Replace web charts with mobile charts
// 2. Update tables with mobile-friendly lists
// 3. Add mobile-specific admin features
// 4. Update navigation for mobile
```

---

## 🎨 **PHASE 7: STYLING MIGRATION**

### **7.1 Replace Tailwind CSS**
```typescript
// Create src/styles/theme.ts
export const theme = {
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    background: '#ffffff',
    surface: '#f8fafc',
    // ... other colors
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' },
    h2: { fontSize: 24, fontWeight: 'bold' },
    // ... other typography
  },
};
```

### **7.2 Create StyleSheet Components**
```typescript
// src/styles/Styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // ... other styles
});
```

---

## 📱 **PHASE 8: MOBILE-SPECIFIC FEATURES**

### **8.1 Push Notifications**
```typescript
// src/services/NotificationService.ts
import messaging from '@react-native-firebase/messaging';

export class NotificationService {
  static async requestPermission() {
    const authStatus = await messaging().requestPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
  }
  
  static async getToken() {
    return await messaging().getToken();
  }
  
  static setupNotificationHandlers() {
    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      // Show in-app notification
    });
    
    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      // Handle background message
    });
  }
}
```

### **8.2 Camera Integration**
```typescript
// src/components/CameraModal.tsx
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

export const CameraModal = () => {
  const openCamera = () => {
    launchCamera({ mediaType: 'photo' }, (response) => {
      if (response.assets) {
        // Handle captured image
      }
    });
  };
  
  const openGallery = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets) {
        // Handle selected image
      }
    });
  };
};
```

### **8.3 Biometric Authentication**
```typescript
// src/services/BiometricService.ts
import TouchID from 'react-native-touch-id';

export class BiometricService {
  static async isSupported() {
    return await TouchID.isSupported();
  }
  
  static async authenticate() {
    return await TouchID.authenticate('Authenticate to access the app');
  }
}
```

---

## 🗄️ **PHASE 9: DATABASE & API MIGRATION**

### **9.1 Supabase Integration (Same as Web)**
```typescript
// src/services/supabase.ts
// Actions:
// 1. Keep same Supabase client configuration
// 2. Update storage policies for mobile
// 3. Add offline support
// 4. Add data synchronization
// 5. Add conflict resolution
```

### **9.2 Offline Support**
```typescript
// src/services/OfflineService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export class OfflineService {
  static async cacheData(key: string, data: any) {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }
  
  static async getCachedData(key: string) {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  
  static async syncWhenOnline() {
    // Sync cached data when back online
  }
}
```

---

## 🧪 **PHASE 10: TESTING & OPTIMIZATION**

### **10.1 Testing Setup**
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react-native
npm install --save-dev jest
npm install --save-dev @testing-library/jest-native
```

### **10.2 Performance Optimization**
```typescript
// src/utils/PerformanceUtils.ts
import { InteractionManager } from 'react-native';

export const runAfterInteractions = (callback: () => void) => {
  InteractionManager.runAfterInteractions(callback);
};

export const optimizeImages = (uri: string) => {
  // Add image optimization logic
  return uri;
};
```

---

## 📋 **PHASE 11: PLATFORM-SPECIFIC CONFIGURATIONS**

### **11.1 Android Configuration**
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### **11.2 iOS Configuration**
```xml
<!-- ios/MasomoHubConnect/Info.plist -->
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to take photos for achievements</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photo library to select images</string>
```

---

## 🚀 **PHASE 12: DEPLOYMENT & DISTRIBUTION**

### **12.1 Build Configuration**
```bash
# Android
cd android && ./gradlew assembleRelease

# iOS
cd ios && xcodebuild -workspace MasomoHubConnect.xcworkspace -scheme MasomoHubConnect -configuration Release
```

### **12.2 App Store Preparation**
```typescript
// src/config/AppConfig.ts
export const APP_CONFIG = {
  version: '1.0.0',
  buildNumber: 1,
  appName: 'Masomo Hub Connect',
  bundleId: 'com.masomohub.connect',
  // ... other config
};
```

---

## 📊 **SUMMARY: COMPLETE FILE MIGRATION CHECKLIST**

### **✅ Core Files (15 files)**
- [ ] `src/App.tsx` - Update routing to React Navigation
- [ ] `src/main.tsx` - Convert to React Native entry point
- [ ] `src/index.css` - Convert to StyleSheet
- [ ] `src/App.css` - Convert to StyleSheet
- [ ] `src/vite-env.d.ts` - Update for React Native

### **✅ Pages → Screens (25 files)**
- [ ] `src/pages/Index.tsx` → `src/screens/IndexScreen.tsx`
- [ ] `src/pages/Dashboard.tsx` → `src/screens/DashboardScreen.tsx`
- [ ] `src/pages/Login.tsx` → `src/screens/auth/LoginScreen.tsx`
- [ ] `src/pages/Profile.tsx` → `src/screens/ProfileScreen.tsx`
- [ ] `src/pages/Sifa.tsx` → `src/screens/SifaScreen.tsx`
- [ ] `src/pages/Ukumbi.tsx` → `src/screens/UkumbiScreen.tsx`
- [ ] `src/pages/Ajira.tsx` → `src/screens/AjiraScreen.tsx`
- [ ] `src/pages/Events.tsx` → `src/screens/TukioScreen.tsx`
- [ ] `src/pages/Units.tsx` → `src/screens/MasomoScreen.tsx`
- [ ] `src/pages/UnitPage.tsx` → `src/screens/UnitScreen.tsx`
- [ ] `src/pages/ApplicationForm.tsx` → `src/screens/auth/RegisterScreen.tsx`
- [ ] `src/pages/ApplicationStatus.tsx` → `src/screens/auth/ApplicationStatusScreen.tsx`
- [ ] `src/pages/ClassSelection.tsx` → `src/screens/ClassSelectionScreen.tsx`
- [ ] `src/pages/Inbox.tsx` → `src/screens/InboxScreen.tsx`
- [ ] `src/pages/AdminDashboard.tsx` → `src/screens/admin/AdminDashboardScreen.tsx`
- [ ] `src/pages/admin/AdminApplications.tsx` → `src/screens/admin/AdminApplicationsScreen.tsx`
- [ ] `src/pages/admin/AdminClasses.tsx` → `src/screens/admin/AdminClassesScreen.tsx`
- [ ] `src/pages/admin/AdminConcerns.tsx` → `src/screens/admin/AdminConcernsScreen.tsx`
- [ ] `src/pages/AdminLogin.tsx` → `src/screens/admin/AdminLoginScreen.tsx`
- [ ] `src/pages/Alumni.tsx` → `src/screens/AlumniScreen.tsx`
- [ ] `src/pages/ApplicationRejected.tsx` → `src/screens/auth/ApplicationRejectedScreen.tsx`
- [ ] `src/pages/AuthCallback.tsx` → `src/screens/auth/AuthCallbackScreen.tsx`
- [ ] `src/pages/DevLogin.tsx` → `src/screens/auth/DevLoginScreen.tsx`
- [ ] `src/pages/GamificationDashboard.tsx` → `src/screens/GamificationScreen.tsx`
- [ ] `src/pages/Info.tsx` → `src/screens/InfoScreen.tsx`

### **✅ Components (87 files)**
- [ ] `src/components/layout/AppLayout.tsx` - Convert to React Native View
- [ ] `src/components/layout/ClientHeader.tsx` - Convert to React Navigation header
- [ ] `src/components/layout/Sidebar.tsx` - Convert to bottom tab navigator
- [ ] `src/components/ui/button.tsx` - Convert to TouchableOpacity
- [ ] `src/components/ui/input.tsx` - Convert to TextInput
- [ ] `src/components/ui/card.tsx` - Convert to View with styling
- [ ] `src/components/ui/dialog.tsx` - Convert to Modal
- [ ] `src/components/ui/table.tsx` - Convert to FlatList
- [ ] `src/components/ui/carousel.tsx` - Convert to ScrollView
- [ ] `src/components/ui/chart.tsx` - Convert to react-native-chart-kit
- [ ] `src/components/ui/select.tsx` - Convert to Picker
- [ ] `src/components/ui/textarea.tsx` - Convert to TextInput multiline
- [ ] `src/components/ui/checkbox.tsx` - Convert to TouchableOpacity
- [ ] `src/components/ui/radio-group.tsx` - Convert to TouchableOpacity
- [ ] `src/components/ui/slider.tsx` - Convert to Slider
- [ ] `src/components/ui/switch.tsx` - Convert to Switch
- [ ] `src/components/ui/tabs.tsx` - Convert to TabView
- [ ] `src/components/ui/toast.tsx` - Convert to Toast
- [ ] `src/components/ui/tooltip.tsx` - Convert to Tooltip
- [ ] `src/components/ui/avatar.tsx` - Convert to Image
- [ ] `src/components/ui/badge.tsx` - Convert to View with text
- [ ] `src/components/ui/breadcrumb.tsx` - Convert to View with text
- [ ] `src/components/ui/calendar.tsx` - Convert to Calendar
- [ ] `src/components/ui/collapsible.tsx` - Convert to Animated.View
- [ ] `src/components/ui/command.tsx` - Convert to FlatList
- [ ] `src/components/ui/context-menu.tsx` - Convert to ActionSheet
- [ ] `src/components/ui/drawer.tsx` - Convert to DrawerLayoutAndroid
- [ ] `src/components/ui/dropdown-menu.tsx` - Convert to Modal
- [ ] `src/components/ui/form.tsx` - Convert to form handling
- [ ] `src/components/ui/hover-card.tsx` - Convert to Modal
- [ ] `src/components/ui/input-otp.tsx` - Convert to TextInput
- [ ] `src/components/ui/label.tsx` - Convert to Text
- [ ] `src/components/ui/menubar.tsx` - Convert to Menu
- [ ] `src/components/ui/navigation-menu.tsx` - Convert to navigation
- [ ] `src/components/ui/pagination.tsx` - Convert to FlatList
- [ ] `src/components/ui/popover.tsx` - Convert to Modal
- [ ] `src/components/ui/progress.tsx` - Convert to ProgressBarAndroid
- [ ] `src/components/ui/radio-group.tsx` - Convert to TouchableOpacity
- [ ] `src/components/ui/resizable.tsx` - Convert to PanGestureHandler
- [ ] `src/components/ui/scroll-area.tsx` - Convert to ScrollView
- [ ] `src/components/ui/separator.tsx` - Convert to View
- [ ] `src/components/ui/sheet.tsx` - Convert to Modal
- [ ] `src/components/ui/sidebar.tsx` - Convert to DrawerLayoutAndroid
- [ ] `src/components/ui/skeleton.tsx` - Convert to Animated.View
- [ ] `src/components/ui/sonner.tsx` - Convert to Toast
- [ ] `src/components/ui/table.tsx` - Convert to FlatList
- [ ] `src/components/ui/tabs.tsx` - Convert to TabView
- [ ] `src/components/ui/toggle.tsx` - Convert to TouchableOpacity
- [ ] `src/components/ui/toggle-group.tsx` - Convert to TouchableOpacity
- [ ] `src/components/ui/use-toast.ts` - Convert to Toast
- [ ] `src/components/achievements/AchievementPost.tsx` - Convert to mobile card
- [ ] `src/components/achievements/CreateAchievementForm.tsx` - Convert to modal
- [ ] `src/components/achievements/AchievementComments.tsx` - Convert to mobile comments
- [ ] `src/components/achievements/AchievementMediaCarousel.tsx` - Convert to ScrollView
- [ ] `src/components/dashboard/WelcomeSection.tsx` - Convert to mobile section
- [ ] `src/components/dashboard/WallOfFameSection.tsx` - Convert to mobile section
- [ ] `src/components/dashboard/UpcomingSection.tsx` - Convert to mobile section
- [ ] `src/components/dashboard/DashboardHeader.tsx` - Convert to mobile header
- [ ] `src/components/gamification/CharacterSelector.tsx` - Convert to mobile selector
- `src/components/gamification/CharacterCustomizer.tsx` - Convert to mobile customizer
- [ ] `src/components/gamification/CharacterProgression.tsx` - Convert to mobile progression
- [ ] `src/components/gamification/Leaderboard.tsx` - Convert to mobile leaderboard
- [ ] `src/components/unit/NotesTab.tsx` - Convert to mobile screen
- [ ] `src/components/unit/PastPapersTab.tsx` - Convert to mobile screen
- [ ] `src/components/unit/AssignmentsTab.tsx` - Convert to mobile screen
- [ ] `src/components/unit/EventsTab.tsx` - Convert to mobile screen
- [ ] `src/components/admin/AdminDashboardStats.tsx` - Convert to mobile stats
- [ ] `src/components/admin/AdminHeader.tsx` - Convert to mobile header
- [ ] `src/components/admin/AdminSidebar.tsx` - Convert to mobile sidebar
- [ ] `src/components/admin/AdminStatsSection.tsx` - Convert to mobile section
- [ ] `src/components/admin/ClassManagementSection.tsx` - Convert to mobile section
- [ ] `src/components/admin/StudentManagementSection.tsx` - Convert to mobile section
- [ ] `src/components/AdminGuard.tsx` - Convert to mobile guard
- [ ] `src/components/ApplicationGuard.tsx` - Convert to mobile guard
- [ ] `src/components/ApplicationStatusGuard.tsx` - Convert to mobile guard
- [ ] `src/components/ErrorBoundary.tsx` - Convert to mobile error boundary
- [ ] `src/components/PasswordStrengthIndicator.tsx` - Convert to mobile indicator
- [ ] `src/components/ProfileGuard.tsx` - Convert to mobile guard
- [ ] `src/components/SecurityProvider.tsx` - Convert to mobile provider
- [ ] `src/components/ui/BackButton.tsx` - Convert to mobile back button
- [ ] `src/components/ui/CharacterCard.tsx` - Convert to mobile card
- [ ] `src/components/ui/CharacterSelector.tsx` - Convert to mobile selector
- [ ] `src/components/ui/FloatingConcernsButton.tsx` - Convert to mobile floating button
- [ ] `src/components/ui/LoadingSpinner.tsx` - Convert to mobile spinner
- [ ] `src/components/ui/Logo.tsx` - Convert to mobile logo
- [ ] `src/components/ui/NotificationBadge.tsx` - Convert to mobile badge
- [ ] `src/components/ui/PrivacySelector.tsx` - Convert to mobile selector
- [ ] `src/components/ui/ProfilePictureModal.tsx` - Convert to mobile modal

### **✅ Hooks (11 files)**
- [ ] `src/hooks/useAuth.tsx` - Add biometric auth
- [ ] `src/hooks/use-toast.ts` - Convert to mobile toast
- [ ] `src/hooks/use-mobile.tsx` - Update for React Native
- [ ] `src/hooks/useApplicationStatus.tsx` - Keep same logic
- [ ] `src/hooks/useCSRFProtection.tsx` - Update for mobile
- [ ] `src/hooks/useInputValidation.tsx` - Keep same logic
- [ ] `src/hooks/useNotifications.tsx` - Add push notifications
- [ ] `src/hooks/useProfileGuard.tsx` - Keep same logic
- [ ] `src/hooks/useRateLimit.tsx` - Keep same logic
- [ ] `src/hooks/useSecureAuth.tsx` - Add mobile security
- [ ] `src/hooks/useSecureFileUpload.tsx` - Add mobile file upload

### **✅ Services (3 files)**
- [ ] `src/integrations/supabase/client.ts` - Keep same, add offline support
- [ ] `src/integrations/supabase/types.ts` - Keep same
- [ ] `src/lib/secureApiClient.ts` - Add mobile security
- [ ] `src/lib/security.ts` - Add mobile security
- [ ] `src/lib/utils.ts` - Update for React Native

### **✅ Data & Types (4 files)**
- [ ] `src/data/characters.ts` - Keep same
- [ ] `src/data/gamification.ts` - Keep same
- [ ] `src/types/characters.ts` - Keep same
- [ ] `src/types/gamification.ts` - Keep same

### **✅ Configuration Files (8 files)**
- [ ] `package.json` - Update dependencies
- [ ] `tsconfig.json` - Update for React Native
- [ ] `vite.config.ts` - Remove (not needed for React Native)
- [ ] `tailwind.config.ts` - Remove (use StyleSheet)
- [ ] `postcss.config.js` - Remove (not needed)
- [ ] `eslint.config.js` - Update for React Native
- [ ] `components.json` - Remove (not needed)
- [ ] `index.html` - Remove (not needed)

---

## 🎯 **TOTAL MIGRATION EFFORT**

### **📊 File Count Summary**
- **Total Files to Migrate**: 150+ files
- **Pages → Screens**: 25 files
- **Components**: 87 files
- **Hooks**: 11 files
- **Services**: 3 files
- **Data/Types**: 4 files
- **Configuration**: 8 files

### **⏱️ Estimated Time**
- **Setup & Foundation**: 2-3 days
- **Core Migration**: 3-4 weeks
- **Mobile Features**: 1-2 weeks
- **Testing & Optimization**: 1-2 weeks
- **Deployment**: 3-5 days

### **👥 Team Requirements**
- **React Native Developer**: 1-2 developers
- **UI/UX Designer**: 1 designer
- **Backend Developer**: 1 developer (for API updates)
- **QA Tester**: 1 tester

---

## 🚀 **NEXT STEPS**

1. **Start with Phase 1**: Set up React Native project
2. **Migrate core screens**: Dashboard, Login, Profile
3. **Convert UI components**: Start with most used components
4. **Add mobile features**: Camera, notifications, biometrics
5. **Test thoroughly**: On both iOS and Android
6. **Deploy**: To app stores

This comprehensive guide covers every single file and action needed to convert your web application into a mobile app! 🎉
