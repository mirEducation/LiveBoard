import { Layer, Group } from 'react-konva';
import { Shape, AnchorSide } from '../../types';
import RectShape from '../shapes/RectShape';
import CircleShape from '../shapes/CircleShape';
import LineShape from '../shapes/LineShape';
import ArrowShapeComponent, { AnchorDots } from '../shapes/ArrowShape';
import PathShape from '../shapes/PathShape';
import TextShapeComponent from '../shapes/TextShape';
import Konva from 'konva';

interface Props {
  shapes: Record<string, Shape>;
  selectedIds: string[];
  toolMode: string;
  arrowAnchorHighlight?: { shapeId: string; anchor: AnchorSide } | null;
  onSelect: (id: string, multi: boolean) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onContextMenu: (e: any, id: string) => void;
  onDblClick: (id: string, node: Konva.Text) => void;
}

export default function ShapeLayer({
  shapes,
  selectedIds,
  toolMode,
  arrowAnchorHighlight,
  onSelect,
  onDragEnd,
  onContextMenu,
  onDblClick,
}: Props) {
  const sortedShapes = Object.values(shapes).sort((a, b) => a.zIndex - b.zIndex);
  const isArrowTool = toolMode === 'arrow';
  // Only allow shape interaction in select mode — all other tools need raw stage events
  const isSelectMode = toolMode === 'select';
  const draggable = isSelectMode;

  return (
    // listening=false when drawing so clicks/drags pass through to the Stage
    <Layer name="shape-layer" listening={isSelectMode}>
      {sortedShapes.map((shape) => {
        const isSelected = selectedIds.includes(shape.id);
        const commonProps = { isSelected, draggable, onSelect, onDragEnd, onContextMenu };

        switch (shape.type) {
          case 'rect':
            return (
              <Group key={shape.id}>
                <RectShape {...commonProps} shape={shape} />
                {isArrowTool && (
                  <AnchorDots
                    shape={shape}
                    highlighted={
                      arrowAnchorHighlight?.shapeId === shape.id
                        ? arrowAnchorHighlight.anchor
                        : null
                    }
                  />
                )}
              </Group>
            );
          case 'circle':
            return (
              <Group key={shape.id}>
                <CircleShape {...commonProps} shape={shape} />
                {isArrowTool && (
                  <AnchorDots
                    shape={shape}
                    highlighted={
                      arrowAnchorHighlight?.shapeId === shape.id
                        ? arrowAnchorHighlight.anchor
                        : null
                    }
                  />
                )}
              </Group>
            );
          case 'line':
            return <LineShape key={shape.id} {...commonProps} shape={shape} />;
          case 'arrow':
            return (
              <ArrowShapeComponent
                key={shape.id}
                {...commonProps}
                shape={shape}
                shapes={shapes}
              />
            );
          case 'path':
            return <PathShape key={shape.id} {...commonProps} shape={shape} />;
          case 'text':
            return (
              <TextShapeComponent
                key={shape.id}
                {...commonProps}
                shape={shape}
                onDblClick={onDblClick}
              />
            );
          default:
            return null;
        }
      })}
    </Layer>
  );
}
