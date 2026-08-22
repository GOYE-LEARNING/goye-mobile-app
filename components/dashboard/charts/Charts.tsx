// components/dashboard/charts/Charts.tsx
//
// A small, dependency-light chart kit built on react-native-svg + expo-linear-gradient.
// Replaces CSS-transform "fake circle" hacks with real arcs, real gradients, and
// real motion. Every chart takes a `color` / `data[].color` prop so it inherits
// whatever palette the screen is already using — nothing here hardcodes a look.
//
// Requires: react-native-svg, expo-linear-gradient, @expo/vector-icons

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Path, Line, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* ────────────────────────────────────────────────────────────────────────
   Shared types
   ──────────────────────────────────────────────────────────────────────── */

export interface ChartSlice {
  label: string;
  value: number;
  color: string;
}

/* ────────────────────────────────────────────────────────────────────────
   StatCard — the headline number tiles at the top of a dashboard.
   Instead of a white box with a small icon chip, the card takes on a soft
   tint of its own color, carries an oversized "ghost" icon bleeding off the
   corner, and a solid accent bar along the top. Each stat reads as its own
   color-coded object rather than four identical white rectangles.
   ──────────────────────────────────────────────────────────────────────── */

interface StatCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | number;
  color: string;
  valueColor?: string;
  delay?: number;
}

export function StatCard({ icon, label, value, color, valueColor = '#1A1A1A', delay = 0 }: StatCardProps) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 500,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [value]);

  return (
    <Animated.View
      style={[
        statStyles.card,
        {
          backgroundColor: color + '12',
          borderColor: color + '24',
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      <View style={[statStyles.accentBar, { backgroundColor: color }]} />
      <Ionicons name={icon} size={64} color={color} style={statStyles.ghostIcon} />
      <Text style={[statStyles.value, { color: valueColor }]}>{value}</Text>
      <View style={statStyles.labelRow}>
        <View style={[statStyles.labelDot, { backgroundColor: color }]} />
        <Text style={[statStyles.label, { color }]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  ghostIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.16,
    transform: [{ rotate: '-8deg' }],
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});

/* ────────────────────────────────────────────────────────────────────────
   ChartCard — shared shell for every chart block: a colored top accent bar
   plus a small uppercase eyebrow above the title, so the whole analytics
   section reads as one connected system instead of separate white boxes.
   ──────────────────────────────────────────────────────────────────────── */

interface ChartCardProps {
  title: string;
  eyebrow?: string;
  accentColor: string;
  badge?: React.ReactNode;
  cardBg?: string;
  borderColor?: string;
  style?: any;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  eyebrow,
  accentColor,
  badge,
  cardBg = '#FFFFFF',
  borderColor = '#EEF0F3',
  style,
  children,
}: ChartCardProps) {
  return (
    <View style={[chartCardStyles.card, { backgroundColor: cardBg, borderColor }, style]}>
      <View style={[chartCardStyles.accentBar, { backgroundColor: accentColor }]} />
      <View style={chartCardStyles.header}>
        <View style={{ flex: 1 }}>
          {eyebrow && (
            <Text style={[chartCardStyles.eyebrow, { color: accentColor }]}>{eyebrow}</Text>
          )}
          <Text style={chartCardStyles.title}>{title}</Text>
        </View>
        {badge}
      </View>
      {children}
    </View>
  );
}

const chartCardStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    paddingTop: 14,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 1,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
    color: '#1A1A1A',
  },
});

/* ────────────────────────────────────────────────────────────────────────
   DonutChart — real SVG arcs with soft gaps between segments and a
   center readout. Segments sweep in on mount.
   ──────────────────────────────────────────────────────────────────────── */

interface DonutChartProps {
  data: ChartSlice[];
  size?: number;
  strokeWidth?: number;
  gapDegrees?: number;
  centerValue?: string | number;
  centerLabel?: string;
  textColor?: string;
  mutedColor?: string;
}

export function DonutChart({
  data,
  size = 128,
  strokeWidth = 16,
  gapDegrees = 4,
  centerValue,
  centerLabel,
  textColor = '#1A1A1A',
  mutedColor = '#9AA1AC',
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    sweep.setValue(0);
    Animated.timing(sweep, {
      toValue: 1,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [data.map((d) => d.value).join(',')]);

  let cumulative = 0;
  const gapLength = (gapDegrees / 360) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {/* background track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={mutedColor}
            strokeOpacity={0.12}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {total > 0 &&
            data.map((slice) => {
              if (slice.value <= 0) return null;
              const fraction = slice.value / total;
              const fullLength = fraction * circumference;
              const visibleLength = Math.max(fullLength - gapLength, 1);
              const startAt = cumulative;
              cumulative += fullLength;

              const animatedDasharray = sweep.interpolate({
                inputRange: [0, 1],
                outputRange: [`0 ${circumference}`, `${visibleLength} ${circumference}`],
              });

              return (
                <AnimatedCircle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={animatedDasharray as unknown as string}
                  strokeDashoffset={-startAt}
                  strokeLinecap="round"
                  fill="none"
                />
              );
            })}
        </G>
      </Svg>
      {(centerValue !== undefined || centerLabel) && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.centerFill}>
            {centerValue !== undefined && (
              <Text style={[styles.centerValue, { fontSize: size * 0.19, color: textColor }]}>
                {centerValue}
              </Text>
            )}
            {centerLabel && (
              <Text style={[styles.centerLabel, { fontSize: size * 0.08, color: mutedColor }]}>
                {centerLabel}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

export function DonutLegend({
  data,
  total,
  textColor = '#1A1A1A',
  mutedColor = '#9AA1AC',
}: {
  data: ChartSlice[];
  total: number;
  textColor?: string;
  mutedColor?: string;
}) {
  return (
    <View style={{ gap: 10 }}>
      {data.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <View key={item.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendLabel, { color: textColor }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.legendPct, { color: mutedColor }]}>{pct}%</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   ProgressRing — single animated stroke with a subtle gradient, sweeping
   from 0 to the target percentage.
   ──────────────────────────────────────────────────────────────────────── */

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  textColor?: string;
  mutedColor?: string;
}

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 12,
  color,
  trackColor = '#EEF0F3',
  label,
  sublabel,
  textColor = '#1A1A1A',
  mutedColor = '#9AA1AC',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage));
  const gradientId = `ringGradient-${Math.round(size)}`;

  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: clamped,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.55} />
            <Stop offset="1" stopColor={color} stopOpacity={1} />
          </SvgLinearGradient>
        </Defs>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset as unknown as number}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.centerFill}>
          {label !== undefined && (
            <Text style={[styles.centerValue, { fontSize: size * 0.2, color: textColor }]}>{label}</Text>
          )}
          {sublabel && (
            <Text style={[styles.centerLabel, { fontSize: size * 0.09, color: mutedColor }]}>{sublabel}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   BarChart — horizontal gradient bars, each with its own tinted track
   so the bar reads as "filling" its own lane rather than a shared grey bar.
   Staggered entrance animation.
   ──────────────────────────────────────────────────────────────────────── */

interface BarChartProps {
  data: ChartSlice[];
  barHeight?: number;
  labelColor?: string;
  showRank?: boolean;
}

export function BarChart({ data, barHeight = 20, labelColor = '#1A1A1A', showRank = true }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={{ gap: 16 }}>
      {data.map((item, index) => (
        <BarRow
          key={item.label}
          item={item}
          max={max}
          barHeight={barHeight}
          labelColor={labelColor}
          rank={index}
          showRank={showRank}
        />
      ))}
    </View>
  );
}

function BarRow({
  item,
  max,
  barHeight,
  labelColor,
  rank,
  showRank,
}: {
  item: ChartSlice;
  max: number;
  barHeight: number;
  labelColor: string;
  rank: number;
  showRank: boolean;
}) {
  const pct = max > 0 ? (item.value / max) * 100 : 0;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    widthAnim.setValue(0);
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 750,
      delay: rank * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [item.value]);

  const width = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View>
      <View style={styles.barRowHeader}>
        <View style={styles.barRowLabelWrap}>
          {showRank && (
            <View style={[styles.rankBadge, { backgroundColor: item.color + '1F' }]}>
              <Text style={[styles.rankBadgeText, { color: item.color }]}>{rank + 1}</Text>
            </View>
          )}
          <Text style={[styles.barLabel, { color: labelColor }]} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
        <Text style={[styles.barValue, { color: item.color }]}>{item.value}</Text>
      </View>
      <View
        style={[
          styles.barTrack,
          { height: barHeight, borderRadius: barHeight / 2, backgroundColor: item.color + '14' },
        ]}
      >
        <Animated.View style={{ width, height: '100%' }}>
          <LinearGradient
            colors={[item.color + 'B3', item.color]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: barHeight / 2 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   AreaChart — smooth cardinal-spline line with a soft gradient fill,
   faint horizontal guides, and an emphasized final point. Measures its
   own width via onLayout so it always fits its card.
   ──────────────────────────────────────────────────────────────────────── */

interface AreaChartPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaChartPoint[];
  height?: number;
  color: string;
  padding?: number;
}

export function AreaChart({ data, height = 150, color, padding = 18 }: AreaChartProps) {
  const [width, setWidth] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [data.map((d) => d.value).join(',')]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const gradientId = `areaGradient-${Math.round(height)}`;
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const chartW = Math.max(width - padding * 2, 1);
  const chartH = height - padding * 2;

  const points = data.map((d, i) => ({
    x: padding + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2),
    y: padding + chartH - ((d.value - min) / range) * chartH,
  }));

  let linePath = '';
  points.forEach((p, i) => {
    if (i === 0) {
      linePath += `M ${p.x} ${p.y}`;
    } else {
      const prev = points[i - 1];
      const midX = (prev.x + p.x) / 2;
      linePath += ` C ${midX} ${prev.y}, ${midX} ${p.y}, ${p.x} ${p.y}`;
    }
  });
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

  return (
    <Animated.View
      onLayout={onLayout}
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }}
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.38} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <Line
              key={f}
              x1={padding}
              x2={width - padding}
              y1={padding + chartH * f}
              y2={padding + chartH * f}
              stroke="#000000"
              strokeOpacity={0.05}
              strokeWidth={1}
            />
          ))}
          <Path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <Path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 5 : 3}
              fill="#FFFFFF"
              stroke={color}
              strokeWidth={2}
            />
          ))}
        </Svg>
      )}
      <View style={[styles.areaLabels, { paddingHorizontal: padding - 4 }]}>
        {data.map((d, i) => (
          <Text key={i} style={styles.areaLabel} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Styles
   ──────────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontWeight: '800',
  },
  centerLabel: {
    marginTop: 2,
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  legendPct: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
  barRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  barRowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  rankBadge: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  barValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  barTrack: {
    overflow: 'hidden',
  },
  areaLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  areaLabel: {
    fontSize: 10.5,
    color: '#9AA1AC',
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
});