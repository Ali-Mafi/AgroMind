/** The keyboard covers the layout viewport on iOS. Pin above its visible edge. */
export function composerKeyboardInset(
  layoutHeight: number,
  viewport: { height: number; offsetTop: number; scale: number } | null,
  focused: boolean,
) {
  if (!focused || !viewport || Math.abs(viewport.scale - 1) > 0.01) return 0;
  return Math.max(0, layoutHeight - viewport.height - viewport.offsetTop);
}
