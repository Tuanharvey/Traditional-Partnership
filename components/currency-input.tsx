'use client'

import { NumericFormat } from 'react-number-format'

type QuickAmount = { label: string; value: number }

type CurrencyInputProps = {
  id: string
  value: string
  onChange: (value: string) => void
  name?: string
  placeholder?: string
  required?: boolean
  maxAmount?: number
  quickAmounts?: QuickAmount[]
}

export const standardQuickAmounts: QuickAmount[] = [
  { label: '+100K', value: 100_000 },
  { label: '+500K', value: 500_000 },
  { label: '+1Tr', value: 1_000_000 },
]

export function CurrencyInput({
  id,
  value,
  onChange,
  name,
  placeholder = '0',
  required = false,
  maxAmount = 100_000_000,
  quickAmounts = standardQuickAmounts,
}: CurrencyInputProps) {
  function addAmount(amount: number) {
    const current = Number(value || 0)
    onChange(String(Math.min(maxAmount, current + amount)))
  }

  return (
    <div className="currency-field">
      <NumericFormat
        id={id}
        className="currency-input"
        value={value}
        valueIsNumericString
        thousandSeparator="."
        decimalSeparator=","
        decimalScale={0}
        suffix=" ₫"
        allowNegative={false}
        allowLeadingZeros={false}
        inputMode="numeric"
        placeholder={placeholder}
        required={required}
        isAllowed={({ floatValue }) => floatValue === undefined || floatValue <= maxAmount}
        onValueChange={(values, sourceInfo) => {
          if (sourceInfo.source === 'event') onChange(values.value)
        }}
      />
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {quickAmounts.length ? (
        <div className="amount-shortcuts" role="group" aria-label="Cộng nhanh số tiền">
          {quickAmounts.map((amount) => (
            <button className="amount-chip" key={amount.label} type="button" onClick={() => addAmount(amount.value)}>
              {amount.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
