// Это serverless-функция Vercel. Доступна по адресу /api/ebay?query=...
// Сейчас отдаёт тестовые данные — позже здесь будет настоящий запрос
// к eBay Browse API (нужен бесплатный developer-аккаунт на developer.ebay.com).
//
// ЧТО НУЖНО СДЕЛАТЬ ПОЗЖЕ:
// 1. Зарегистрироваться на developer.ebay.com, получить ключи
// 2. Получить OAuth токен (хранить как переменную окружения в Vercel, НЕ в коде)
// 3. Сделать запрос к https://api.ebay.com/buy/browse/v1/item_summary/search
// 4. Вернуть реальные данные в формате ниже

export default async function handler(req, res) {
  const query = req.query.query || '';

  // --- ВРЕМЕННЫЕ ТЕСТОВЫЕ ДАННЫЕ ---
  const mockListings = [
    {
      title: `${query} — вариант 1`,
      price: 120,
      url: 'https://www.ebay.com/itm/0000000001',
    },
    {
      title: `${query} — вариант 2`,
      price: 95,
      url: 'https://www.ebay.com/itm/0000000002',
    },
    {
      title: `${query} — вариант 3`,
      price: 150,
      url: 'https://www.ebay.com/itm/0000000003',
    },
    {
      title: `${query} — вариант 4`,
      price: 110,
      url: 'https://www.ebay.com/itm/0000000004',
    },
  ];

  const prices = mockListings.map((l) => l.price);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  res.status(200).json({
    query,
    count: mockListings.length,
    avgPrice: avg,
    minPrice: min,
    maxPrice: max,
    listings: mockListings,
  });
}
