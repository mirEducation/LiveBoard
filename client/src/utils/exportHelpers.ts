import Konva from 'konva';

export function exportToPNG(stage: Konva.Stage, filename = 'whiteboard.png'): void {
  // Find the shape layer by name
  const shapeLayer = stage.findOne('.shape-layer') as Konva.Layer | null;
  if (!shapeLayer || shapeLayer.getChildren().length === 0) {
    alert('Nothing to export — draw something first!');
    return;
  }

  // Save current stage transform
  const prevScale = stage.scaleX();
  const prevX = stage.x();
  const prevY = stage.y();

  // Reset to 1:1 so clientRect matches world coordinates
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.draw(); // synchronous redraw at scale 1

  const box = shapeLayer.getClientRect({ skipTransform: false });

  if (!box || box.width === 0 || box.height === 0) {
    stage.scale({ x: prevScale, y: prevScale });
    stage.position({ x: prevX, y: prevY });
    stage.draw();
    alert('Nothing to export.');
    return;
  }

  const padding = 40;
  const exportW = box.width + padding * 2;
  const exportH = box.height + padding * 2;
  // Cap the output at 2048px on the longest side to avoid huge files
  const TARGET_MAX_PX = 2048;
  const pixelRatio = Math.min(1.5, TARGET_MAX_PX / Math.max(exportW, exportH));

  const dataURL = stage.toDataURL({
    pixelRatio,
    mimeType: 'image/png',
    x: box.x - padding,
    y: box.y - padding,
    width: exportW,
    height: exportH,
  });

  // Restore stage transform
  stage.scale({ x: prevScale, y: prevScale });
  stage.position({ x: prevX, y: prevY });
  stage.draw();

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
