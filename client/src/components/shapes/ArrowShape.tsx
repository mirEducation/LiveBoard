import { Arrow, Circle, Group } from 'react-konva';
import { ArrowShape as ArrowShapeType, AnchorSide, Shape } from '../../types';
import { computeArrowPoints, getAnchorPoint } from '../../utils/connectorHelpers';

interface Props {
  shape: ArrowShapeType;
  shapes: Record<string, Shape>;
  isSelected: boolean;
  draggable?: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onContextMenu: (e: any, id: string) => void;
}

export default function ArrowShapeComponent({
  shape,
  shapes,
  isSelected,
  draggable = true,
  onSelect,
  onDragEnd,
  onContextMenu,
}: Props) {
  // Arrow always uses x=0,y=0 — points are absolute world coordinates
  const points = computeArrowPoints(shape, shapes);

  return (
    <Arrow
      id={shape.id}
      x={0}
      y={0}
      points={points}
      pointerAtBeginning={shape.pointerAtStart}
      pointerAtEnd={shape.pointerAtEnd}
      pointerWidth={10}
      pointerLength={10}
      fill={isSelected ? '#2563eb' : shape.stroke}
      stroke={isSelected ? '#2563eb' : shape.stroke}
      strokeWidth={isSelected ? Math.max(shape.strokeWidth, 2) : shape.strokeWidth}
      opacity={shape.opacity}
      hitStrokeWidth={16}
      draggable={draggable}
      onClick={(e) => onSelect(shape.id, e.evt.shiftKey || e.evt.metaKey)}
      onTap={() => onSelect(shape.id, false)}
      onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
      onContextMenu={(e) => onContextMenu(e, shape.id)}
    />
  );
}

// Anchor dot overlay rendered on shapes when arrow tool is active
interface AnchorProps {
  shape: Shape;
  highlighted?: AnchorSide | null;
}

const ANCHORS: AnchorSide[] = ['n', 's', 'e', 'w'];

export function AnchorDots({ shape, highlighted }: AnchorProps) {
  if (shape.type === 'arrow' || shape.type === 'line' || shape.type === 'path') return null;

  return (
    <Group>
      {ANCHORS.map((anchor) => {
        const pt = getAnchorPoint(shape, anchor);
        const isHigh = highlighted === anchor;
        return (
          <Circle
            key={anchor}
            x={pt.x}
            y={pt.y}
            radius={6}
            fill={isHigh ? '#2563eb' : 'white'}
            stroke="#2563eb"
            strokeWidth={2}
            listening={false}
          />
        );
      })}
    </Group>
  );
}
