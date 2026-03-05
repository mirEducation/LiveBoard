import { Layer, Group, Circle, Text } from 'react-konva';
import { Cursor } from '../../types';

interface Props {
  cursors: Record<string, Cursor>;
}

export default function CursorLayer({ cursors }: Props) {
  return (
    <Layer listening={false}>
      {Object.values(cursors).map((cursor) => (
        <Group key={cursor.userId} x={cursor.x} y={cursor.y}>
          {/* Cursor dot */}
          <Circle radius={5} fill={cursor.color} opacity={0.9} />
          {/* Name label */}
          <Text
            x={8}
            y={-6}
            text={cursor.name}
            fontSize={12}
            fill="white"
            padding={3}
            cornerRadius={3}
            listening={false}
          />
          <Text
            x={7}
            y={-7}
            text={cursor.name}
            fontSize={12}
            fill={cursor.color}
            fontStyle="bold"
            listening={false}
          />
        </Group>
      ))}
    </Layer>
  );
}
