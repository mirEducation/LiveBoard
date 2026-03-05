import { useRef } from 'react';
import { Text } from 'react-konva';
import { TextShape as TextShapeType } from '../../types';
import Konva from 'konva';

interface Props {
  shape: TextShapeType;
  isSelected: boolean;
  draggable?: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onContextMenu: (e: any, id: string) => void;
  onDblClick: (id: string, node: Konva.Text) => void;
}

export default function TextShapeComponent({
  shape,
  isSelected,
  draggable = true,
  onSelect,
  onDragEnd,
  onContextMenu,
  onDblClick,
}: Props) {
  const nodeRef = useRef<Konva.Text | null>(null);

  return (
    <Text
      ref={nodeRef}
      id={shape.id}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      text={shape.text}
      fontSize={shape.fontSize}
      fontFamily={shape.fontFamily}
      align={shape.align}
      fill={shape.fill === 'transparent' ? shape.stroke : shape.fill}
      stroke={isSelected ? '#2563eb' : undefined}
      strokeWidth={isSelected ? 1 : 0}
      rotation={shape.rotation}
      opacity={shape.opacity}
      padding={4}
      draggable={draggable}
      onClick={(e) => onSelect(shape.id, e.evt.shiftKey || e.evt.metaKey)}
      onTap={() => onSelect(shape.id, false)}
      onDragEnd={(e) => onDragEnd(shape.id, e.target.x(), e.target.y())}
      onContextMenu={(e) => onContextMenu(e, shape.id)}
      onDblClick={() => nodeRef.current && onDblClick(shape.id, nodeRef.current)}
      onDblTap={() => nodeRef.current && onDblClick(shape.id, nodeRef.current)}
    />
  );
}
