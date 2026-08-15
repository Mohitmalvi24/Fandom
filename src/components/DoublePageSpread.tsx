/**
 * DoublePageSpread — renders two comic pages side-by-side for landscape/spread mode.
 *
 * Layout decisions documented:
 * - Cover/first page is shown ALONE (not paired), like most comic readers
 * - Mixed type A/B heights: both pages scale to fit within the shorter
 *   page's aspect ratio at half-screen width, maintaining alignment
 * - Odd page count: last "spread" shows single page centered
 * - 1-page chapters: single page displayed centered, no blank slot
 */
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SkeletonBox } from './SkeletonBox';
import { Colors } from '../constants/theme';
import type { Page } from '../types/api';

interface DoublePageSpreadProps {
  leftPage: Page;
  rightPage?: Page; // undefined for single-page spreads (cover, last odd, 1-page chapter)
}

export const DoublePageSpread = React.memo(function DoublePageSpread({
  leftPage,
  rightPage,
}: DoublePageSpreadProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  if (!rightPage) {
    // Single page — center it, scale to fit screen height
    const ar = leftPage.width / leftPage.height;
    const fitHeight = screenHeight;
    const fitWidth = fitHeight * ar;
    const displayWidth = Math.min(fitWidth, screenWidth * 0.8);
    const displayHeight = displayWidth / ar;

    return (
      <View style={[styles.container, { width: screenWidth, height: screenHeight }]}>
        <View style={styles.singlePage}>
          <Image
            source={{ uri: leftPage.url }}
            style={{ width: displayWidth, height: displayHeight }}
            contentFit="contain"
            cachePolicy="disk"
            placeholder={{ blurhash: 'L5H2EC=PM+yV0g-mq.wG9c010J}I' }}
            transition={200}
          />
        </View>
      </View>
    );
  }

  // Two pages side-by-side, each gets half the screen width
  const halfWidth = screenWidth / 2;

  // Compute display height for each page at half-width
  const leftAr = leftPage.width / leftPage.height;
  const rightAr = rightPage.width / rightPage.height;
  const leftDisplayHeight = halfWidth / leftAr;
  const rightDisplayHeight = halfWidth / rightAr;

  // Use the TALLER of the two to set container height,
  // both pages align to top (like reading a physical comic spread)
  const spreadHeight = Math.max(leftDisplayHeight, rightDisplayHeight);
  // Cap to screen height
  const containerHeight = Math.min(spreadHeight, screenHeight);

  // If we need to scale down to fit screen, compute scale factor
  const scaleFactor = containerHeight / spreadHeight;
  const finalLeftHeight = leftDisplayHeight * scaleFactor;
  const finalRightHeight = rightDisplayHeight * scaleFactor;
  const finalHalfWidth = halfWidth * scaleFactor;

  return (
    <View style={[styles.container, { width: screenWidth, height: screenHeight }]}>
      <View style={styles.spreadContainer}>
        <Image
          source={{ uri: leftPage.url }}
          style={{
            width: scaleFactor < 1 ? finalHalfWidth : halfWidth,
            height: scaleFactor < 1 ? finalLeftHeight : leftDisplayHeight,
          }}
          contentFit="cover"
          cachePolicy="disk"
          placeholder={{ blurhash: 'L5H2EC=PM+yV0g-mq.wG9c010J}I' }}
          transition={200}
        />
        <Image
          source={{ uri: rightPage.url }}
          style={{
            width: scaleFactor < 1 ? finalHalfWidth : halfWidth,
            height: scaleFactor < 1 ? finalRightHeight : rightDisplayHeight,
          }}
          contentFit="cover"
          cachePolicy="disk"
          placeholder={{ blurhash: 'L5H2EC=PM+yV0g-mq.wG9c010J}I' }}
          transition={200}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  singlePage: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  spreadContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
