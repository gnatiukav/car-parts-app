import { useState, useEffect } from 'react';
import { TRACKED_MODELS, PARTS_LIST } from './data.js';

// Ключ в localStorage, где храним VIN-ы машин, которые уже видели
const SEEN_KEY = 'seenCarVins';

function getSeenVins() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY)) || [];
  } catch {
    return [];
  }
}

function markAllSeen(cars) {
  const vins = cars.map((c) => c.vin);
  localStorage.setItem(SEEN_KEY, JSON.stringify(vins));
}

export default function App() {
  // screen: 'home' | 'car' | 'part'
  const [screen, setScreen] = useState('home');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeBrand, setActiveBrand] = useState('Все');
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);

  async function loadCars() {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setCars(data.cars || []);
    } catch (e) {
      console.error('Не удалось загрузить инвентарь', e);
      setCars([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadCars();
  }, []);

  const seenVins = getSeenVins();
  const brands = ['Все', ...new Set(cars.map((c) => c.make))];

  const filteredCars = cars.filter((c) => {
    const matchesSearch = `${c.make} ${c.model}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesBrand = activeBrand === 'Все' || c.make === activeBrand;
    return matchesSearch && matchesBrand;
  });

  function openCar(car) {
    setSelectedCar(car);
    setScreen('car');
  }

  function openPart(part) {
    setSelectedPart(part);
    setScreen('part');
  }

  function handleRefresh() {
    loadCars().then(() => markAllSeen(cars));
  }

  if (screen === 'car' && selectedCar) {
    return (
      <CarScreen
        car={selectedCar}
        onBack={() => setScreen('home')}
        onOpenPart={openPart}
      />
    );
  }

  if (screen === 'part' && selectedCar && selectedPart) {
    return (
      <PartScreen
        car={selectedCar}
        part={selectedPart}
        onBack={() => setScreen('car')}
      />
    );
  }

  return (
    <div className="screen">
      <div className="top-bar">
        <h1 className="title">Новые машины</h1>
        <button className="refresh-btn" onClick={handleRefresh}>
          Обновить
        </button>
      </div>

      <input
        className="search-input"
        placeholder="Поиск по марке или модели..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="filter-row">
        {brands.map((b) => (
          <button
            key={b}
            className={`filter-chip ${activeBrand === b ? 'active' : ''}`}
            onClick={() => setActiveBrand(b)}
          >
            {b}
          </button>
        ))}
      </div>

      {loading && <div className="loading">Загрузка...</div>}

      {!loading && filteredCars.length === 0 && (
        <div className="empty">Ничего не найдено</div>
      )}

      {!loading &&
        filteredCars.map((car) => {
          const isNew = !seenVins.includes(car.vin);
          return (
            <div
              key={car.vin}
              className="car-card"
              onClick={() => openCar(car)}
            >
              <img src={car.photo} alt={car.model} />
              <div className="info">
                <div className="name">
                  {car.make} {car.model}{' '}
                  {isNew && <span className="badge-new">новое</span>}
                </div>
                <div className="meta">
                  {car.year} · {car.yard}
                </div>
              </div>
            </div>
          );
        })}

      <div className="section-title">Отслеживаемые модели</div>
      <div className="meta" style={{ color: '#888', fontSize: 13 }}>
        {TRACKED_MODELS.join(' · ')}
      </div>
    </div>
  );
}

function CarScreen({ car, onBack, onOpenPart }) {
  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          ← Назад
        </button>
        <h1 className="title">
          {car.make} {car.model}
        </h1>
      </div>

      <div className="photo-row">
        <img src={car.photo} alt={car.model} />
      </div>

      <div className="info-line">
        <span className="label">Год</span>
        <span>{car.year}</span>
      </div>
      <div className="info-line">
        <span className="label">VIN</span>
        <span>{car.vin}</span>
      </div>
      <div className="info-line">
        <span className="label">Локация</span>
        <span>{car.yard}</span>
      </div>
      <div className="info-line">
        <span className="label">Источник</span>
        <a href={car.source} target="_blank" rel="noreferrer">
          Открыть на сайте
        </a>
      </div>

      <div className="section-title">
        Детали — нажми, чтобы узнать цену на eBay
      </div>
      <div className="part-grid">
        {PARTS_LIST.map((part) => (
          <button
            key={part}
            className="part-btn"
            onClick={() => onOpenPart(part)}
          >
            {part}
          </button>
        ))}
      </div>
    </div>
  );
}

function PartScreen({ car, part, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = `${car.year} ${car.make} ${car.model} ${part}`;
    setLoading(true);
    fetch(`/api/ebay?query=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [car, part]);

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          ← Назад
        </button>
        <h1 className="title">{part}</h1>
      </div>

      <div className="meta" style={{ marginBottom: 12 }}>
        {car.year} {car.make} {car.model}
      </div>

      {loading && <div className="loading">Ищем цены на eBay...</div>}

      {!loading && data && (
        <>
          <div className="price-summary">
            <div className="big">${data.avgPrice}</div>
            <div className="row">
              <span>Диапазон</span>
              <span>
                ${data.minPrice} – ${data.maxPrice}
              </span>
            </div>
            <div className="row">
              <span>Найдено лотов</span>
              <span>{data.count}</span>
            </div>
          </div>

          <div className="section-title">Объявления</div>
          {data.listings.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="listing-row"
              style={{ textDecoration: 'none', color: '#fff' }}
            >
              <span>{l.title}</span>
              <span className="lp">${l.price}</span>
            </a>
          ))}
        </>
      )}

      {!loading && !data && (
        <div className="empty">Не удалось получить данные</div>
      )}
    </div>
  );
}
