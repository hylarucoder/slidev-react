import { FormSelect } from '../../../../ui/primitives/FormSelect'
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
    <div className="mb-3 grid gap-2 sm:grid-cols-2">
      <FormSelect
        label="stage scale"
        size="sm"
        value={String(stageScale)}
        onChange={(event) => {
          onStageScaleChange(Number(event.target.value))
        }}
      >
        {STAGE_SCALE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        label="cursor"
        size="sm"
        value={cursorMode}
        onChange={(event) => {
          onCursorModeChange(event.target.value as CursorModeOption)
        }}
      >
        {CURSOR_MODE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </FormSelect>
    </div>
  )
}
