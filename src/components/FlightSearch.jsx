import React, { useState } from 'react';
import { Search, Plane, ArrowRight, UserCheck } from 'lucide-react';
import { SAMPLE_PASSENGERS } from '../utils/mockData';

export default function FlightSearch({ onSelectPassenger }) {
  const [pnrInput, setPnrInput] = useState('');
  const [selectedPnr, setSelectedPnr] = useState('AIR-7890');

  const handleSearch = (e) => {
    e.preventDefault();
    const found = SAMPLE_PASSENGERS.find(p => p.pnr.toUpperCase() === pnrInput.trim().toUpperCase());
    if (found) {
      onSelectPassenger(found);
    } else {
      alert('Пассажир с таким кодом бронирования не найден. Используйте быструю выборку ниже.');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Шаг 1: Поиск Бронирования Пассажира
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Введите код бронирования (PNR) или выберите подготовленный тестовый профиль
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: '20px', height: '20px' }} />
          <input
            type="text"
            placeholder="Например: AIR-7890 или FLY-4321"
            value={pnrInput}
            onChange={(e) => setPnrInput(e.target.value)}
            style={{
              width: '100%',
              padding: '0.9rem 1rem 0.9rem 3rem',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid var(--border-glow)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
        </div>
        <button type="submit" className="btn-primary">
          Найти Бронь
        </button>
      </form>

      <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Быстрый выбор готовых профилей пассажиров:
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {SAMPLE_PASSENGERS.map((passenger) => (
            <div
              key={passenger.pnr}
              onClick={() => onSelectPassenger(passenger)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.2rem 1.5rem',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f2fe';
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.85)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-glow)';
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <img
                  src={passenger.photoUrl}
                  alt={passenger.fullName}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00f2fe' }}
                />
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{passenger.fullName}</h4>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <span>PNR: <strong style={{ color: '#00f2fe' }}>{passenger.pnr}</strong></span>
                    <span>Рейс: <strong style={{ color: '#f8fafc' }}>{passenger.flightNumber}</strong> ({passenger.origin} → {passenger.destination})</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00f2fe', fontWeight: 600, fontSize: '0.9rem' }}>
                Выбрать профиль
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
