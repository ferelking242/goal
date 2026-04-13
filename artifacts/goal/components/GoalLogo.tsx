import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

type Props = {
  size?: number;
};

/**
 * GOAL — SVG football logo
 * Shield shape with hexagonal net pattern and a football.
 */
export function GoalLogo({ size = 48 }: Props) {
  const s = size;
  const hw = s / 2;

  return (
    <View style={{ width: s, height: s }}>
      <Svg width={s} height={s} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#1A2A20" />
            <Stop offset="100%" stopColor="#0D1F15" />
          </LinearGradient>
          <LinearGradient id="accentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#00F09A" />
            <Stop offset="100%" stopColor="#00A865" />
          </LinearGradient>
          <LinearGradient id="ballGrad" x1="20%" y1="10%" x2="80%" y2="90%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#D0D8D4" />
          </LinearGradient>
        </Defs>

        {/* Shield outline */}
        <Path
          d="M50 4 L88 18 L88 52 C88 74 50 96 50 96 C50 96 12 74 12 52 L12 18 Z"
          fill="url(#shieldGrad)"
        />
        {/* Accent border on shield */}
        <Path
          d="M50 4 L88 18 L88 52 C88 74 50 96 50 96 C50 96 12 74 12 52 L12 18 Z"
          fill="none"
          stroke="url(#accentGrad)"
          strokeWidth="2.5"
        />

        {/* Inner shield glow line */}
        <Path
          d="M50 12 L81 24 L81 51 C81 69 50 87 50 87"
          fill="none"
          stroke="#00D084"
          strokeWidth="0.8"
          strokeOpacity="0.25"
        />

        {/* Goal net — horizontal lines */}
        {[32, 38, 44, 50, 56, 62, 68].map((y, i) => (
          <Path
            key={`h${i}`}
            d={`M${Math.max(18, 20 + i * 1)} ${y} L${Math.min(82, 80 - i * 1)} ${y}`}
            stroke="#00D084"
            strokeWidth="0.5"
            strokeOpacity="0.18"
          />
        ))}
        {/* Goal net — vertical lines */}
        {[28, 36, 44, 50, 56, 64, 72].map((x, i) => (
          <Path
            key={`v${i}`}
            d={`M${x} 24 L${x} ${Math.min(76, 72 + Math.abs(x - 50) * 0.4)}`}
            stroke="#00D084"
            strokeWidth="0.5"
            strokeOpacity="0.18"
          />
        ))}

        {/* Football */}
        <Circle cx="50" cy="52" r="22" fill="url(#ballGrad)" />
        <Circle cx="50" cy="52" r="22" fill="none" stroke="#C8D4CC" strokeWidth="0.8" />

        {/* Pentagon center */}
        <Polygon
          points="50,41 54.7,44.5 53,50 47,50 45.3,44.5"
          fill="#1A1A1A"
        />
        {/* Surrounding pentagon patches (simplified hex pattern) */}
        <Polygon points="50,41 55.8,37.5 62,41 60.5,48 54.7,44.5" fill="none" stroke="#1A1A1A" strokeWidth="1.2" />
        <Polygon points="50,41 44.2,44.5 38,41 39.5,34 46,37.5" fill="none" stroke="#1A1A1A" strokeWidth="1.2" />
        <Polygon points="53,50 60.5,48 64,55 59,61 52,58" fill="none" stroke="#1A1A1A" strokeWidth="1.2" />
        <Polygon points="47,50 41,53 38,60 44,62 49,58" fill="none" stroke="#1A1A1A" strokeWidth="1.2" />
        <Polygon points="52,58 59,61 57,68 50,70 43,68" fill="none" stroke="#1A1A1A" strokeWidth="1.2" />

        {/* Top gloss */}
        <Path
          d="M38 44 Q50 36 62 44"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Accent dot glow bottom */}
        <Circle cx="50" cy="88" r="3" fill="#00D084" fillOpacity="0.8" />
        <Circle cx="50" cy="88" r="5" fill="#00D084" fillOpacity="0.2" />
      </Svg>
    </View>
  );
}
