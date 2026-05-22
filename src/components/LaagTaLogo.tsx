import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface Props {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  showTagline?: boolean;
}

function AirplaneSVG({ size = 24, color = '#ffffff' }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ transform: [{ rotate: '-45deg' }] }}
    >
      <Path
        fill={color}
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
      />
    </Svg>
  );
}

const SIZES = {
  small: { text: 20, plane: 16, gap: 4 },
  medium: { text: 28, plane: 22, gap: 6 },
  large: { text: 40, plane: 32, gap: 8 },
};

export default function LaagTaLogo({ size = 'medium', color = '#ff6b2b', showTagline = false }: Props) {
  const s = SIZES[size];
  return (
    <View style={styles.container}>
      <View style={[styles.row, { gap: s.gap }]}>
        <Text style={[styles.text, { fontSize: s.text, color }]}>Laag Ta!</Text>
        <View style={{ marginTop: -s.gap }}>
          <AirplaneSVG size={s.plane} color={color} />
        </View>
      </View>
      {showTagline && (
        <Text style={[styles.tagline, { color }]}>Dali, adventure awaits!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
    opacity: 0.85,
  },
});
