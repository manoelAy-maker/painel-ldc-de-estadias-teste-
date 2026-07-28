import { describe, expect, it } from 'vitest'
import { calculateStayHours, normalizePlate } from './format'

describe('normalizePlate', () => {
  it('normaliza placa Mercosul', () => {
    expect(normalizePlate('bzg-2b32')).toBe('BZG2B32')
  })
})

describe('calculateStayHours', () => {
  it('inicia a contagem 48 horas após a emissão', () => {
    expect(
      calculateStayHours('2026-03-16T08:00:00-03:00', '2026-03-20T10:00:00-03:00'),
    ).toBe(50)
  })

  it('nunca retorna tempo negativo', () => {
    expect(
      calculateStayHours('2026-03-16T08:00:00-03:00', '2026-03-17T08:00:00-03:00'),
    ).toBe(0)
  })
})

