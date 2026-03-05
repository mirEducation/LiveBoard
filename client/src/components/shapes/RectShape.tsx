import { Rect } from 'react-konva';
import { RectShape as RectShapeType } from '../../types';

interface Props {
  shape: RectShapeType;
  isSelected: boolean;
  draggable?: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onContextMenu: (e: any, id: string) => void;
  onDblClick?: (id: string) => void;
}

export default function RectShape({ shape, isSelected, draggable = true, onSelect, onDragEnd, onContextMenu }: Props) {
  return (
    <Rect
      id={shape.id}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      cornerRadius={shape.cornerRadius}
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
