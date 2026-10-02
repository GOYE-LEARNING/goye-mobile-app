// components/community/FormattedText.tsx
//
// Renders the same lightweight markdown subset web's renderFormattedText
// supports (bold/italic/underline, # / ## / ### headings, - and 1. lists),
// since React Native's Text can't use dangerouslySetInnerHTML like web does.
import { Text, View, StyleSheet } from 'react-native';

// Splits "before **bold** middle *italic* after" into plain/bold/italic/underline
// runs, applied in that priority order so nesting doesn't double-match.
function renderInline(line: string, baseStyle: any, key: string | number) {
  const parts: { text: string; bold?: boolean; italic?: boolean; underline?: boolean }[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line))) {
    if (match.index > lastIndex) {
      parts.push({ text: line.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) parts.push({ text: match[1], bold: true });
    else if (match[2] !== undefined) parts.push({ text: match[2], italic: true });
    else if (match[3] !== undefined) parts.push({ text: match[3], underline: true });
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < line.length) parts.push({ text: line.slice(lastIndex) });

  return (
    <Text key={key} style={baseStyle}>
      {parts.map((p, i) => (
        <Text
          key={i}
          style={{
            fontWeight: p.bold ? '700' : undefined,
            fontStyle: p.italic ? 'italic' : undefined,
            textDecorationLine: p.underline ? 'underline' : undefined,
          }}
        >
          {p.text}
        </Text>
      ))}
    </Text>
  );
}

export default function FormattedText({ content, style, color }: { content: string; style?: any; color: string }) {
  if (!content) return null;
  const lines = content.split('\n');
  const baseStyle = [styles.line, { color }, style];

  return (
    <View>
      {lines.map((line, idx) => {
        if (/^# /.test(line)) {
          return renderInline(line.slice(2), [baseStyle, styles.h1], idx);
        }
        if (/^## /.test(line)) {
          return renderInline(line.slice(3), [baseStyle, styles.h2], idx);
        }
        if (/^### /.test(line)) {
          return renderInline(line.slice(4), [baseStyle, styles.h3], idx);
        }
        if (/^- /.test(line)) {
          return (
            <View key={idx} style={styles.listRow}>
              <Text style={[baseStyle]}>{'•  '}</Text>
              {renderInline(line.slice(2), baseStyle, `${idx}-li`)}
            </View>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const marker = line.match(/^(\d+\.)\s/)![1];
          return (
            <View key={idx} style={styles.listRow}>
              <Text style={[baseStyle]}>{marker}{'  '}</Text>
              {renderInline(line.replace(/^\d+\.\s/, ''), baseStyle, `${idx}-ol`)}
            </View>
          );
        }
        if (line.trim() === '') {
          return <View key={idx} style={{ height: 6 }} />;
        }
        return renderInline(line, baseStyle, idx);
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { fontSize: 15, lineHeight: 22 },
  h1: { fontSize: 22, fontWeight: '700', marginVertical: 4 },
  h2: { fontSize: 19, fontWeight: '700', marginVertical: 4 },
  h3: { fontSize: 17, fontWeight: '600', marginVertical: 4 },
  listRow: { flexDirection: 'row', marginLeft: 8 },
});
