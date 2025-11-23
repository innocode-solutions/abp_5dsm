import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CarouselProps {
  children: React.ReactNode[];
  showIndicators?: boolean;
  showNavigation?: boolean;
  onPageChange?: (index: number) => void;
}

export default function Carousel({
  children,
  showIndicators = true,
  showNavigation = true,
  onPageChange,
}: CarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      onPageChange?.(index);
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const goToNext = () => {
    if (currentIndex < children.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {children.map((child, index) => (
          <View key={index} style={styles.page}>
            {child}
          </View>
        ))}
      </ScrollView>

      {showNavigation && children.length > 1 && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={goToPrevious}
            disabled={currentIndex === 0}
          >
            <Feather
              name="chevron-left"
              size={24}
              color={currentIndex === 0 ? colors.muted : colors.text}
            />
          </TouchableOpacity>

          {showIndicators && (
            <View style={styles.indicators}>
              {children.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.indicator,
                    currentIndex === index && styles.indicatorActive,
                  ]}
                  onPress={() => scrollToIndex(index)}
                />
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.navButton,
              currentIndex === children.length - 1 && styles.navButtonDisabled,
            ]}
            onPress={goToNext}
            disabled={currentIndex === children.length - 1}
          >
            <Feather
              name="chevron-right"
              size={24}
              color={currentIndex === children.length - 1 ? colors.muted : colors.text}
            />
          </TouchableOpacity>
        </View>
      )}

      {showIndicators && !showNavigation && (
        <View style={styles.indicatorsOnly}>
          {children.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                currentIndex === index && styles.indicatorActive,
              ]}
              onPress={() => scrollToIndex(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20, // Espaço para tab bar
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicatorsOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: colors.primary || '#4A90E2',
  },
});

