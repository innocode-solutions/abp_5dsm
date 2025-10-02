import { PropsWithChildren } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import colors from '../theme/colors';

type Props = PropsWithChildren<{
  title: string;
  style?: ViewStyle;
}>;

export default function Section({ title, children, style }: Props) {
  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={{ marginTop: 8 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
});
