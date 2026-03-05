import { useEffect, useRef } from 'react';
import { Layer, Transformer, Rect } from 'react-konva';
import Konva from 'konva';

interface Props {
  selectedIds: string[];
  stageRef: React.RefObject<Konva.Stage | null>;
  rubberBand?: { x: number; y: number; width: number; height: number } | null;
  onTransformEnd: (id: string, changes: Record<string, unknown>) => void;
}

export default function SelectionLayer({ selectedIds, stageRef, rubberBand, onTransformEnd }: Props) {
  const transformerRef = useRef<Konva.Transformer | null>(null);

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];
    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, stageRef]);

  const handleTransformEnd = () => {
    if (!stageRef.current) return;
    for (const id of selectedIds) {
      const node = stageRef.current.findOne(`#${id}`);
      if (!node) continue;
      const changes: Record<string, unknown> = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };
      // Preserve scale for shapes that have width/height
      if ('width' in node && 'height' in node) {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        changes.width = (node as Konva.Rect).width() * scaleX;
        changes.height = (node as Konva.Rect).height() * scaleY;
        node.scaleX(1);
        node.scaleY(1);
      }
      onTransformEnd(id, changes);
    }
  };

  return (
    <Layer>
      {rubberBand && (
        <Rect
          x={rubberBand.width < 0 ? rubberBand.x + rubberBand.width : rubberBand.x}
          y={rubberBand.height < 0 ? rubberBand.y + rubberBand.height : rubberBand.y}
          width={Math.abs(rubberBand.width)}
          height={Math.abs(rubberBand.height)}
          fill="rgba(37, 99, 235, 0.1)"
          stroke="#2563eb"
          strokeWidth={1}
          listening={false}
          dash={[4, 4]}
        />
      )}
      <Transformer
        ref={transformerRef}
        onTransformEnd={handleTransformEnd}
        onDragEnd={handleTransformEnd}
        boundBoxFunc={(oldBox, newBox) => {
          if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return oldBox;
          return newBox;
        }}
      />
    </Layer>
  );
}
