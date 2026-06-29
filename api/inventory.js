// Это serverless-функция Vercel. Доступна по адресу /api/inventory
// Сейчас отдаёт тестовые данные — позже здесь будет реальный парсинг
// сайтов разборок (pyp.com, picknpull.com, ipullupull.com).
//
// ЧТО НУЖНО СДЕЛАТЬ ПОЗЖЕ:
// 1. Найти реальный URL поиска инвентаря (через DevTools -> Network)
// 2. Сделать fetch() на этот URL отсюда
// 3. Распарсить ответ (JSON или HTML через cheerio) в формат ниже

export default async function handler(req, res) {
  // --- ВРЕМЕННЫЕ ТЕСТОВЫЕ ДАННЫЕ ---
  const mockCars = [
    {
      vin: 'TESTVIN0001',
      make: 'Land Rover',
      model: 'Velar',
      year: 2018,
      photo: 'https://placehold.co/400x300/111/888?text=Velar',
      source: 'https://www.pyp.com/inventory/',
      yard: 'Pick Your Part — Anaheim',
    },
    {
      vin: 'TESTVIN0002',
      make: 'Jaguar',
      model: 'F-Pace',
      year: 2019,
      photo: 'https://placehold.co/400x300/111/888?text=F-Pace',
      source: 'https://www.picknpull.com/',
      yard: 'Pick-n-Pull — Oakland',
    },
    {
      vin: 'TESTVIN0003',
      make: 'Lexus',
      model: 'RX',
      year: 2017,
      photo: 'https://placehold.co/400x300/111/888?text=RX',
      source: 'https://ipullupull.com/',
      yard: 'iPull-uPull — Sacramento',
    },
  ]

  res.status(200).json({ cars: mockCars })
}