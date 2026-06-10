export interface Betrieb {
  code: string
  name: string
  adresse: string
  kategorie: string
  bild: string
}

export const betriebe: Record<string, Betrieb> = {
  b01: {
    code: 'B01',
    name: 'Bäckerei Name',
    adresse: 'Musterstraße 1, 12345 Musterstadt',
    kategorie: 'Bäckerei',
    bild: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
  },
  s02: {
    code: 'S02',
    name: 'Sushi Name',
    adresse: 'Fischweg 2, 12345 Musterstadt',
    kategorie: 'Sushi',
    bild: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&q=80',
  },
  p03: {
    code: 'P03',
    name: 'Pizza Name',
    adresse: 'Pizzaplatz 3, 12345 Musterstadt',
    kategorie: 'Pizza',
    bild: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  },
}

export function getBetriebById(id: string): Betrieb | undefined {
  return betriebe[id.toLowerCase()]
}
