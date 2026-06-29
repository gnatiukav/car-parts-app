const CSV_SOURCES = [
  { yard: 'iPull-uPull — Fresno', url: 'https://ipullupull.com/fresno.csv' },
  { yard: 'iPull-uPull — Pomona', url: 'https://ipullupull.com/pomona.csv' },
  { yard: 'iPull-uPull — Sacramento', url: 'https://ipullupull.com/sacramento.csv' },
  { yard: 'iPull-uPull — Stockton', url: 'https://ipullupull.com/stockton.csv' },
]

const TRACKED = [
  { make: 'LAND ROVER', model: 'VELAR' },
  { make: 'JAGUAR', model: 'F-PACE' },
  { make: 'LEXUS', model: 'RX' },
  { make: 'TOYOTA', model: 'PRIUS' },
]

function parseCsv(text) {
  const lines = text.trim().split('\n')
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim())
    const [dateAdded, year, make, model, vin, stock, yard, row, freshSet] = cols
    return { dateAdded, year, make, model, vin, stock, yard, row, freshSet }
  })
}

function isTracked(make, model) {
  return true;
}

export default async function handler(req, res) {
  try {
    const allCars = []
    for (const source of CSV_SOURCES) {
      const response = await fetch(source.url)
      if (!response.ok) continue
      const text = await response.text()
      const rows = parseCsv(text)
      for (const row of rows) {
        if (!row.vin || !isTracked(row.make, row.model)) continue
        allCars.push({
          vin: row.vin,
          make: row.make,
          model: row.model,
          year: Number(row.year) || row.year,
          photo: `https://placehold.co/400x300/111/888?text=${encodeURIComponent(row.make + ' ' + row.model)}`,
          source: 'https://ipullupull.com/inventory-pricing/',
          yard: source.yard,
          dateAdded: row.dateAdded,
        })
      }
    }
    allCars.sort((a, b) => (a.dateAdded < b.dateAdded ? 1 : -1))
    res.status(200).json({ cars: allCars })
  } catch (e) {
    console.error('Ошибка загрузки инвентаря', e)
    res.status(500).json({ cars: [], error: 'Не удалось загрузить инвентарь' })
  }
}