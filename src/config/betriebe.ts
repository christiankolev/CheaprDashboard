export interface Betrieb {
  code: string
  name: string
  adresse: string
}

export const betriebe: Record<string, Betrieb> = {
  b01: {
    code: 'B01',
    name: 'Bäckerei Name',
    adresse: 'Musterstraße 1, 12345 Musterstadt',
  },
  s02: {
    code: 'S02',
    name: 'Sushi Name',
    adresse: 'Fischweg 2, 12345 Musterstadt',
  },
  p03: {
    code: 'P03',
    name: 'Pizza Name',
    adresse: 'Pizzaplatz 3, 12345 Musterstadt',
  },
}

export function getBetriebById(id: string): Betrieb | undefined {
  return betriebe[id.toLowerCase()]
}
