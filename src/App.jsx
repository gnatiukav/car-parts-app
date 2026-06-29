import { useState, useEffect } from 'react';
import { PARTS_LIST } from './data.js';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
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

  function openCar(car) {
    setSelectedCar(car);
    setScreen('car');
  }

  function openPart(part) {
    setSelectedPart(part);
    setScreen('part');
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
        <h1 className="title">Новые поступления</h1>
        <button className="refresh-btn" onClick={loadCars}>
          Обновить
        </button>
      </div>

      {loading && <div className="loading">Загрузка...</div>}

      {!loading && cars.length === 0 && (
        <div className="empty">Нет машин</div>
      )}

      {!loading &&
        cars.map((car) => (
          <div
            key={car.vin}
            className="car-card"
            onClick={() => openCar(car)}
          >
            <div className="info">
              <div className="name">{car.year} {car.make} {car.model}</div>
              <div className="meta">{car.yard}</div>
              <div className="meta">VIN: {car.vin}</div>
              <div className="meta">Добавлено: {car.dateAdded}</div>
            </div>
          </div>
        ))}
    </div>
  );
}

function CarScreen({ car, onBack, onOpenPart }) {
  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          назад
        </button>
        <h1 className="title">
          {car.make} {car.model}
        </h1>
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
        <span className="label">Добавлено</span>
        <span>{car.dateAdded}</span>
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
        Детали - нажми, чтобы узнать цену на eBay
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
    const query = car.year + ' ' + car.make + ' ' + car.model + ' ' + part;
    setLoading(true);
    fetch('/api/ebay?query=' + encodeURIComponent(query))
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [car, part]);

  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          назад
        </button>
        <h1 className="title">{part}</h1>
      </div>

      <div className="meta" style={{ marginBottom: 12 }}>
        {car.year} {car.make} {car.model}
      </div>

      {loading && <div className="loading">Ищем цены на eBay...</div>}

      {!loading && data && (
        <div>
          <div className="price-summary">
            <div className="big">${data.avgPrice}</div>
            <div className="row">
              <span>Диапазон</span>
              <span>${data.minPrice} - ${data.maxPrice}</span>
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
              style={{ textDecoration: 'none', color: 'white' }}
            >
              <span>{l.title}</span>
              <span className="lp">${l.price}</span>
            </a>
          ))}
        </div>
      )}

      {!loading && !data && (
        <div className="empty">Не удалось получить данные</div>
      )}
    </div>
  );
}
