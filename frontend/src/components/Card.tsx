import { PropsWithChildren } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import colors from '../theme/colors';

type Props = PropsWithChildren<{
  style?: ViewStyle;
  noPadding?: boolean;
}>;

export default function Card({ children, style, noPadding }: Props) {
  return (
    <View style={[styles.card, noPadding ? { padding: 0 } : null, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    // @ts-ignore - boxShadow é necessário para React Native Web
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
  },
});
