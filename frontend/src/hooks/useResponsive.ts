import { Dimensions } from 'react-native';
import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isMobile = width < 768;
  const isSmallScreen = width < 360;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  return {
    width,
    height,
    isMobile,
    isSmallScreen,
    isTablet,
    isDesktop,
  };
};
