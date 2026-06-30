import { useState, useEffect, useMemo } from 'react';
import { PARTS_LIST } from './data.js';

// Карта бренд -> домен, чтобы подтягивать НАСТОЯЩИЕ логотипы через Clearbit Logo API.
// Если бренда нет в этом списке, используется fallback-кружок с буквой (НЕ логотип).
const BRAND_DOMAINS = {
  TOYOTA: 'toyota.com',
  LEXUS: 'lexus.com',
  HONDA: 'honda.com',
  ACURA: 'acura.com',
  NISSAN: 'nissan-usa.com',
  INFINITI: 'infinitiusa.com',
  MAZDA: 'mazdausa.com',
  SUBARU: 'subaru.com',
  MITSUBISHI: 'mitsubishicars.com',
  SUZUKI: 'suzukicars.com',
  ISUZU: 'isuzu.com',
  HYUNDAI: 'hyundaiusa.com',
  KIA: 'kia.com',
  CHEVROLET: 'chevrolet.com',
  GMC: 'gmc.com',
  BUICK: 'buick.com',
  CADILLAC: 'cadillac.com',
  FORD: 'ford.com',
  LINCOLN: 'lincoln.com',
  CHRYSLER: 'chrysler.com',
  DODGE: 'dodge.com',
  JEEP: 'jeep.com',
  RAM: 'ramtrucks.com',
  BMW: 'bmwusa.com',
  MERCEDES: 'mbusa.com',
  'MERCEDES-BENZ': 'mbusa.com',
  AUDI: 'audiusa.com',
  VOLKSWAGEN: 'vw.com',
  VOLVO: 'volvocars.com',
  PORSCHE: 'porsche.com',
  LAND: 'landrover.com',
  'LAND ROVER': 'landrover.com',
  JAGUAR: 'jaguar.com',
  MINI: 'miniusa.com',
  TESLA: 'tesla.com',
  FIAT: 'fiatusa.com',
  ALFA: 'alfaromeousa.com',
  'ALFA ROMEO': 'alfaromeousa.com',
};

function brandLogoUrl(make) {
  if (!make) return null;
  const key = make.trim().toUpperCase();
  const domain = BRAND_DOMAINS[key];
  if (!domain) return null;
  // Clearbit Logo API закрыт с 8 декабря 2025, используем Google Favicon Service (бесплатно, без ключа)
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function BrandLogo({ make }) {
  const url = brandLogoUrl(make);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    // fallback: не логотип, просто буква марки в кружке
    return (
      <span
        title="Логотип недоступен — показана буква марки"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#333',
          color: '#fff',
          fontSize: 11,
          fontWeight: 'bold',
          marginRight: 6,
          flexShrink: 0,
        }}
      >
        {make ? make[0] : '?'}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={make}
      onError={() => setFailed(true)}
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        objectFit: 'contain',
        background: '#fff',
        marginRight: 6,
        flexShrink: 0,
      }}
    />
  );
}

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

const FAVORITES_KEY = 'carPartsFavorites';

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(set) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);

  const [favorites, setFavorites] = useState(() => loadFavorites());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');

  const [showBrandPanel, setShowBrandPanel] = useState(false);
  const [brandMode, setBrandMode] = useState('show'); // 'show' = показывать только выбранные, 'hide' = скрывать выбранные
  const [selectedBrands, setSelectedBrands] = useState(new Set());

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

  function toggleFavorite(vin) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(vin)) next.delete(vin);
      else next.add(vin);
      saveFavorites(next);
      return next;
    });
  }

  function openCar(car) {
    setSelectedCar(car);
    setScreen('car');
  }

  const allBrands = useMemo(() => {
    const set = new Set(cars.map((c) => c.make).filter(Boolean));
    return Array.from(set).sort();
  }, [cars]);

  function toggleBrandSelected(brand) {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      if (showFavoritesOnly && !favorites.has(car.vin)) return false;

      if (yearFrom && Number(car.year) < Number(yearFrom)) return false;
      if (yearTo && Number(car.year) > Number(yearTo)) return false;

      if (selectedBrands.size > 0) {
        const inSelected = selectedBrands.has(car.make);
        if (brandMode === 'show' && !inSelected) return false;
        if (brandMode === 'hide' && inSelected) return false;
      }

      return true;
    });
  }, [cars, showFavoritesOnly, favorites, yearFrom, yearTo, selectedBrands, brandMode]);

  if (screen === 'car' && selectedCar) {
    return (
      <CarScreen
        car={selectedCar}
        onBack={() => setScreen('home')}
        isFavorite={favorites.has(selectedCar.vin)}
        onToggleFavorite={() => toggleFavorite(selectedCar.vin)}
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setShowFavoritesOnly((v) => !v)}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            background: showFavoritesOnly ? '#f5b400' : '#333',
            color: showFavoritesOnly ? '#000' : '#fff',
            fontSize: 12,
          }}
        >
          ⭐ {showFavoritesOnly ? 'Все машины' : 'Только избранное'}
        </button>

        <button
          onClick={() => setShowBrandPanel((v) => !v)}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            background: showBrandPanel ? '#0469a2' : '#333',
            color: '#fff',
            fontSize: 12,
          }}
        >
          🏷 Марки {selectedBrands.size > 0 ? `(${selectedBrands.size})` : ''}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#aaa' }}>
          <span>Год от</span>
          <input
            type="number"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            style={{ width: 70, padding: '4px 6px', borderRadius: 4, border: '1px solid #444', background: '#111', color: '#fff' }}
            placeholder="1990"
          />
          <span>до</span>
          <input
            type="number"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            style={{ width: 70, padding: '4px 6px', borderRadius: 4, border: '1px solid #444', background: '#111', color: '#fff' }}
            placeholder="2026"
          />
          {(yearFrom || yearTo) && (
            <button
              onClick={() => { setYearFrom(''); setYearTo(''); }}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {showBrandPanel && (
        <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button
              onClick={() => setBrandMode('show')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: brandMode === 'show' ? '#0469a2' : '#333',
                color: '#fff',
                fontSize: 12,
              }}
            >
              Показывать только выбранные
            </button>
            <button
              onClick={() => setBrandMode('hide')}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: brandMode === 'hide' ? '#c0392b' : '#333',
                color: '#fff',
                fontSize: 12,
              }}
            >
              Скрывать выбранные
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allBrands.map((brand) => {
              const active = selectedBrands.has(brand);
              return (
                <button
                  key={brand}
                  onClick={() => toggleBrandSelected(brand)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: active ? '1px solid #fff' : '1px solid #444',
                    background: active ? (brandMode === 'show' ? '#0469a2' : '#c0392b') : '#222',
                    color: '#fff',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {brand}
                </button>
              );
            })}
          </div>

          {selectedBrands.size > 0 && (
            <button
              onClick={() => setSelectedBrands(new Set())}
              style={{ marginTop: 8, background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}
            >
              Сбросить выбор марок
            </button>
          )}
        </div>
      )}

      {loading && <div className="loading">Загрузка...</div>}

      {!loading && filteredCars.length === 0 && (
        <div className="empty">Нет машин по выбранным фильтрам</div>
      )}

      {!loading &&
        filteredCars.map((car) => {
          const isFav = favorites.has(car.vin);
          return (
            <div
              key={car.vin}
              className="car-card"
              onClick={() => openCar(car)}
            >
              <div className="info">
                <div className="name" style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(car.vin); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 18,
                      marginRight: 6,
                      lineHeight: 1,
                      color: isFav ? '#f5b400' : '#666',
                    }}
                    title={isFav ? 'Убрать из избранного' : 'В избранное'}
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                  <BrandLogo make={car.make} />
                  <span>{car.make} {car.model} {car.year}</span>
                </div>
                <div className="meta">{car.yard} · Row {car.row}</div>
                <div className="meta">VIN: {car.vin} <button onClick={(e)=>{e.stopPropagation();navigator.clipboard.writeText(car.vin)}} style={{marginLeft:6,fontSize:11,padding:'1px 6px',cursor:'pointer'}}>📋</button> <a href={`https://partsouq.com/en/search/all?q=${car.vin}`} target="_blank" rel="noreferrer" onClick={(e)=>e.stopPropagation()} style={{marginLeft:6,fontSize:11,padding:'1px 6px',background:'#0469a2',color:'white',borderRadius:4,textDecoration:'none'}}>🔧</a> <a href={`https://epicvin.com/en/check-vin-number-and-get-the-vehicle-history-report/checkout/${car.vin}?type=vin`} target="_blank" rel="noreferrer" onClick={(e)=>e.stopPropagation()} style={{marginLeft:6,fontSize:11,padding:'1px 6px',background:'#f5b400',color:'black',borderRadius:4,textDecoration:'none'}}>🛣️</a></div>
                <div className="meta">{formatDate(car.dateAdded)}{daysBadge(car.dateAdded)}</div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function CarScreen({ car, onBack, isFavorite, onToggleFavorite }) {
  return (
    <div className="screen">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          назад
        </button>
        <h1 className="title" style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={onToggleFavorite}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              marginRight: 8,
              lineHeight: 1,
              color: isFavorite ? '#f5b400' : '#666',
            }}
            title={isFavorite ? 'Убрать из избранного' : 'В избранное'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
          <BrandLogo make={car.make} />
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
        <span className="label">Пробег / история (платно)</span>
        <a href={`https://epicvin.com/en/check-vin-number-and-get-the-vehicle-history-report/checkout/${car.vin}?type=vin`} target="_blank" rel="noreferrer">
          Проверить на EpicVIN
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
        Детали
      </div>
      <div className="part-grid">
        {PARTS_LIST.map((part) => {
          const ebaySoldUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(car.year + ' ' + car.make + ' ' + car.model + ' ' + part)}&LH_Sold=1&LH_Complete=1`;
          return (
            <div key={part} className="part-btn" style={{ cursor: 'default' }}>
              <div style={{ marginBottom: 6 }}>{part}</div>
              <a
                href={ebaySoldUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: '#4dabf7', textDecoration: 'none' }}
              >
                📜 Проданные на eBay
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
