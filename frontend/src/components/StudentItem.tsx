import { Image, StyleSheet, Text, View } from 'react-native';
import colors from '../theme/colors';

type Props = {
  name: string;
  course: string;
  avatar: string;
};

export default function StudentItem({ name, course, avatar }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.course}>{course}</Text>
      </View>
      <Image source={{ uri: avatar }} style={styles.avatar} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  course: {
    fontSize: 13,
    color: colors.primary,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.bg,
  },
});
