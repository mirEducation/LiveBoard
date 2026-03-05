import { Line } from 'react-konva';
import { PathShape as PathShapeType } from '../../types';

interface Props {
  shape: PathShapeType;
  isSelected: boolean;
  draggable?: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onContextMenu: (e: any, id: string) => void;
}

export default function PathShape({ shape, isSelected, draggable = true, onSelect, onDragEnd, onContextMenu }: Props) {
  return (
    <Line
      id={shape.id}
      x={shape.x}
      y={shape.y}
      points={shape.points}
      tension={shape.tension}
      stroke={isSelected ? '#2563eb' : shape.stroke}
      strokeWidth={isSelected ? Math.max(shape.strokeWidth, 2) : shape.strokeWidth}
      rotation={shape.rotation}
      opacity={shape.opacity}
      lineCap="round"
      lineJoin="round"
      hitStrokeWidth={20}
      draggable={draggable}
      onClick={(e) => onSelect(shape.id, e.evt.shiftKey || e.evt.metaKey)}
      onTap={() => onSelect(shape.id, false)}
      onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
      onContextMenu={(e) => onContextMenu(e, shape.id)}
    />
  );
}
