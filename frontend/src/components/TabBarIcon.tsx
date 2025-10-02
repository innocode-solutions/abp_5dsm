import { Feather } from '@expo/vector-icons';
import React from 'react';

type Props = {
  name: React.ComponentProps<typeof Feather>['name'];
  color: string;
  size?: number;
};

export default function TabBarIcon({ name, color, size = 22 }: Props) {
  return <Feather name={name} color={color} size={size} />;
}
