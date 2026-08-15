/**
 * Custom hook to detect orientation changes via expo-screen-orientation.
 * Returns true when landscape, false when portrait.
 *
 * Uses the actual orientation API rather than just inferring from dimensions.
 */
import { useEffect, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    // Check initial orientation
    ScreenOrientation.getOrientationAsync().then((orientation) => {
      setIsLandscape(
        orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
          orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      );
    });

    // Listen for changes
    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        const { orientationInfo } = event;
        setIsLandscape(
          orientationInfo.orientation ===
            ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
            orientationInfo.orientation ===
              ScreenOrientation.Orientation.LANDSCAPE_RIGHT
        );
      }
    );

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  return { isLandscape };
}
