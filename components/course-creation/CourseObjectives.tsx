// components/course-creation/CourseObjectives.tsx
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  data: any;
  onChange: (data: any) => void;
}

export default function CourseObjectives({ data, onChange }: Props) {
  const { colors } = useTheme();
  const objectives = data.objectives || ['', '', '', '', ''];

  
  const updateObjective = (index: number, value: string) => {
    const updated = [...objectives];
    updated[index] = value;
    onChange({ objectives: updated });
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <Text style={s.sectionTitle}>Course Objectives</Text>

      {objectives.map((objective, index) => (
        <View key={index} style={s.field}>
          <Text style={s.label}>Objective {index + 1}</Text>
          <TextInput
            style={s.input}
            placeholder={
              index === 0 ? "Understand the call to discipleship" :
              index === 1 ? "Build daily habits of prayer and Bible study" :
              index === 2 ? "Apply biblical truths in everyday life" :
              index === 3 ? "Learn how to share your faith" :
              "Enter objective..."
            }
            placeholderTextColor={colors.textMuted}
            value={objective}
            onChangeText={(text) => updateObjective(index, text)}
          />
        </View>
      ))}
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: {
      paddingVertical: 20,
      backgroundColor: c.background,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 24,
    },
    field: {
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textSecondary,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: c.borderMid,
      padding: 14,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.background,
      borderRadius: 8,
    },
  });
}