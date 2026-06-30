import { useState, useEffect } from 'react';
import { PARTS_LIST } from './data.js';

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y.slice(2)}`;
}

function daysBadge(d) {
  if (!d) return null;
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days < 3) return null;
  return <span style={{marginLeft:8,background:'white',color:'black',borderRadius:4,padding:'1px 6px',fontSize:11}}>{days}д</span>;
}

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
              <div className="meta">{car.yard} · Row {car.row}</div>
              <div className="meta">VIN: {car.vin} <button onClick={(e)=>{e.stopPropagation();navigator.clipboard.writeText(car.vin)}} style={{marginLeft:6,fontSize:11,padding:'1px 6px',cursor:'pointer'}}>📋</button> <a href={`https://partsouq.com/en/search/all?q=${car.vin}`} target="_blank" rel="noreferrer" onClick={(e)=>e.stopPropagation()} style={{marginLeft:6,fontSize:11,padding:'1px 6px',background:'#0469a2',color:'white',borderRadius:4,textDecoration:'none'}}>🔧</a></div>
              <div className="meta">{formatDate(car.dateAdded)}{daysBadge(car.dateAdded)}</div>
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
        <span className="label">Схемы</span>
        <a href={`https://partsouq.com/en/search/all?q=${car.vin}`} target="_blank" rel="noreferrer">
          Открыть на PartSouq
        </a>
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
      <div className="info-line">
        <span className="label">eBay</span>
        <a href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(car.year + ' ' + car.make + ' ' + car.model + ' parts')}&LH_Sold=1&LH_Complete=1`} target="_blank" rel="noreferrer">
          Проданные лоты по машине
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
  const ebaySoldUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(car.year + ' ' + car.make + ' ' + car.model + ' ' + part)}&LH_Sold=1&LH_Complete=1`;

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

      <a
        href={ebaySoldUrl}
        target="_blank"
        rel="noreferrer"
        className="part-btn"
        style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
      >
        📜 Посмотреть историю проданных на eBay
      </a>
    </div>
  );
}