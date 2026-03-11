import { View, Text } from 'react-native';

interface StepDotsProps {
  current: 1 | 2 | 3;
}

export function StepDots({ current }: StepDotsProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, gap: 4 }}>
      {[1, 2, 3].map((n) => (
        <View
          key={n}
          style={{
            width: n === current ? 16 : 7,
            height: 7,
            borderRadius: 999,
            backgroundColor: n === current ? '#2563EB' : n < current ? '#93C5FD' : '#D1D5DB',
          }}
        />
      ))}
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB', marginLeft: 4 }}>
        Step {current}
      </Text>
    </View>
  );
}