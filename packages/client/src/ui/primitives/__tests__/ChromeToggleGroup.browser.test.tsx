import { useState } from 'react'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { ChromeToggleGroup } from '../ChromeToggleGroup'

function Harness() {
  const [value, setValue] = useState<'a' | 'b' | 'c'>('a')
  return (
    <div>
      <span data-testid="value">{value}</span>
      <ChromeToggleGroup
        label="mode"
        value={value}
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
          { value: 'c', label: 'Gamma', disabled: true },
        ]}
        onChange={setValue}
      />
    </div>
  )
}

test('selects an option on click and exposes aria-pressed', async () => {
  await render(<Harness />)

  await expect.poll(() => document.querySelector('[data-testid="value"]')?.textContent).toBe('a')

  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
  const betaButton = buttons.find((button) => button.textContent === 'Beta')
  betaButton?.click()

  await expect.poll(() => document.querySelector('[data-testid="value"]')?.textContent).toBe('b')
  await expect
    .poll(() =>
      buttons.find((button) => button.textContent === 'Beta')?.getAttribute('aria-pressed'),
    )
    .toBe('true')
})

test('disabled option does not fire onChange', async () => {
  await render(<Harness />)

  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
  const gamma = buttons.find((button) => button.textContent === 'Gamma')
  expect(gamma?.disabled).toBe(true)
  gamma?.click()

  await expect.poll(() => document.querySelector('[data-testid="value"]')?.textContent).toBe('a')
})
