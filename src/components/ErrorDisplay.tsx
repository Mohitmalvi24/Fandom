/**
 * ErrorDisplay — shows API errors with distinct messaging per error code,
 * and a separate display for image load errors (429 rate-limiting).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ApiError } from '../api/client';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorDisplay({ error, onRetry, compact }: ErrorDisplayProps) {
  const isApiError = error instanceof ApiError;
  const code = isApiError ? error.code : null;
  const message = isApiError ? error.userMessage : error.message;

  const iconMap: Record<string, string> = {
    NOT_FOUND: '🔍',
    INVALID_CURSOR: '⏩',
    INVALID_LIMIT: '📏',
    MISSING_PARAMETER: '⚠️',
    METHOD_NOT_ALLOWED: '🚫',
    INTERNAL: '💥',
  };

  const icon = code ? iconMap[code] ?? '❌' : '❌';

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactText}>
          {icon} {message}
        </Text>
        {onRetry && (
          <Pressable
            onPress={onRetry}
            style={styles.compactRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>
        {code === 'NOT_FOUND' ? 'Not Found' : 'Error'}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {code && <Text style={styles.code}>Code: {code}</Text>}
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Retry loading"
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
    backgroundColor: Colors.background,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  code: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.title,
    color: '#fff',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.errorBg,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  compactText: {
    ...Typography.bodySmall,
    color: Colors.error,
    flex: 1,
  },
  compactRetry: {
    marginLeft: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.sm,
  },
  retryText: {
    ...Typography.bodySmall,
    color: '#fff',
    fontWeight: '600',
  },
});
