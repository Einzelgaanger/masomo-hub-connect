// Network connectivity utilities
import { supabase } from '@/integrations/supabase/client';

// Check if we're online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Test Supabase connectivity
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    return !error && data !== null;
  } catch (error) {
    console.warn('Supabase connection test failed:', error);
    return false;
  }
};

// Retry mechanism for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      console.warn(`Request attempt ${i + 1} failed:`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

// Network status monitoring
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private isConnected: boolean = navigator.onLine;
  private listeners: Array<(connected: boolean) => void> = [];

  private constructor() {
    window.addEventListener('online', () => {
      this.isConnected = true;
      this.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      this.isConnected = false;
      this.notifyListeners(false);
    });
  }

  public static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  public isOnline(): boolean {
    return this.isConnected;
  }

  public addListener(callback: (connected: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(connected: boolean): void {
    this.listeners.forEach(listener => listener(connected));
  }
}

// Enhanced Supabase client with retry logic
export const createResilientSupabaseClient = () => {
  const originalFrom = supabase.from.bind(supabase);
  
  return {
    ...supabase,
    from: (table: string) => {
      const tableClient = originalFrom(table);
      
      // Wrap select method with retry logic
      const originalSelect = tableClient.select.bind(tableClient);
      tableClient.select = (...args: any[]) => {
        const query = originalSelect(...args);
        
        // Wrap the query execution with retry logic
        const originalThen = query.then.bind(query);
        query.then = (onFulfilled?: any, onRejected?: any) => {
          return retryRequest(
            () => originalThen(onFulfilled, onRejected),
            3,
            1000
          );
        };
        
        return query;
      };
      
      return tableClient;
    }
  };
};

// Connection status hook
export const useNetworkStatus = () => {
  const monitor = NetworkMonitor.getInstance();
  const [isOnline, setIsOnline] = React.useState(monitor.isOnline());
  
  React.useEffect(() => {
    const unsubscribe = monitor.addListener(setIsOnline);
    return unsubscribe;
  }, []);
  
  return isOnline;
};

// Import React for the hook
import React from 'react';
