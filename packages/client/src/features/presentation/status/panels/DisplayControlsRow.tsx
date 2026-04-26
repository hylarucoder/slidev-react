import { ChromeToggleGroup } from '../../../../ui/primitives/ChromeToggleGroup'
import {
  CURSOR_MODE_OPTIONS,
  STAGE_SCALE_OPTIONS,
  type CursorModeOption,
} from '../../../../ui/tokens'

export interface DisplayControlsRowProps {
  stageScale: number
  cursorMode: CursorModeOption
  onStageScaleChange: (value: number) => void
  onCursorModeChange: (value: CursorModeOption) => void
}

export function DisplayControlsRow({
  stageScale,
  cursorMode,
  onStageScaleChange,
  onCursorModeChange,
}: DisplayControlsRowProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-4">
      <ChromeToggleGroup
        label="stage scale"
        size="sm"
        value={stageScale}
        options={STAGE_SCALE_OPTIONS}
        onChange={onStageScaleChange}
      />
      <ChromeToggleGroup
        label="cursor"
        size="sm"
        value={cursorMode}
        options={CURSOR_MODE_OPTIONS}
        onChange={onCursorModeChange}
      />
    </div>
  )
}
