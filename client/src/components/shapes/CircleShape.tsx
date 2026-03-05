import { Ellipse } from 'react-konva';
import { CircleShape as CircleShapeType } from '../../types';

interface Props {
  shape: CircleShapeType;
  isSelected: boolean;
  draggable?: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onContextMenu: (e: any, id: string) => void;
}

export default function CircleShape({ shape, isSelected, draggable = true, onSelect, onDragEnd, onContextMenu }: Props) {
  return (
    <Ellipse
      id={shape.id}
      x={shape.x}
      y={shape.y}
      radiusX={shape.radiusX}
      radiusY={shape.radiusY}
      fill={shape.fill}
      stroke={isSelected ? '#2563eb' : shape.stroke}
      strokeWidth={isSelected ? Math.max(shape.strokeWidth, 2) : shape.strokeWidth}
      rotation={shape.rotation}
      opacity={shape.opacity}
      draggable={draggable}
      onClick={(e) => onSelect(shape.id, e.evt.shiftKey || e.evt.metaKey)}
      onTap={() => onSelect(shape.id, false)}
      onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
      onContextMenu={(e) => onContextMenu(e, shape.id)}
    />
  );
}
