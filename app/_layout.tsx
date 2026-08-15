/**
 * Root layout — sets up providers, navigation container, and global styling.
 *
 * Providers:
 * - QueryClientProvider (React Query) for all data fetching
 * - GestureHandlerRootView for gesture support
 * - SafeAreaProvider for safe area insets
 * - StatusBar set to light on dark background
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../src/constants/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.surface,
            },
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: {
              fontWeight: '700',
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: Colors.background,
            },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'Fanon',
              headerLargeTitle: true,
            }}
          />
          <Stack.Screen
            name="story/[id]"
            options={{
              title: 'Chapters',
            }}
          />
          <Stack.Screen
            name="reader/[chapterId]"
            options={{
              title: 'Reader',
              headerShown: false,
              animation: 'fade',
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
