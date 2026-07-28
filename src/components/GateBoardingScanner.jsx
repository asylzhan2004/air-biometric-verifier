import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, QrCode, ShieldCheck, Users, AlertCircle, Plane, RefreshCw } from 'lucide-react';
import { SAMPLE_PASSENGERS } from '../utils/mockData';

export default function GateBoardingScanner() {
  const [activePassengerIdx, setActivePassengerIdx] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [boardedStatus, setBoardedStatus] = useState(null);
  const [boardedPassengers, setBoardedPassengers] = useState([]);

  const currentPassenger = SAMPLE_PASSENGERS[activePassengerIdx];

  const handleGateScan = () => {
    setScanning(true);
    setBoardedStatus(null);

    setTimeout(() => {
      setScanning(false);
      setBoardedStatus({
        status: 'APPROVED',
        passenger: currentPassenger,
        seat: currentPassenger.seat,
        confidence: 99.2,
        time: new Date().toLocaleTimeString('ru-RU')
      });
      setBoardedPassengers(prev => [...prev, currentPassenger.pnr]);
    }, 1500);
  };

  const nextPassenger = () => {
    setActivePassengerIdx((prev) => (prev + 1) % SAMPLE_PASSENGERS.length);
    setBoardedStatus(null);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', border: '1px solid #00f2fe', padding: '0.4rem 1rem', borderRadius: '50px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.8rem' }}>
          <Plane style={{ width: '18px' }} />
          АВТОМАТИЧЕСКИЙ ТЕРМИНАЛ ПОСАДКИ (TOUCHLESS GATE B14)
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Биометрический Экспресс-Гейт</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Камера распознает пассажира на подходе к гейту и сверяет с биометрической базой рейса SU-1420
        </p>
      </div>

      <div className="grid-2">
        {/* Left: Gate Camera Viewport */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Camera style={{ color: '#00f2fe', width: '18px' }} />
            Камера Турникета Посадки
          </h3>

          <div style={{ position: 'relative', width: '100%', height: '300px', background: '#000', borderRadius: '14px', overflow: 'hidden', border: '2px solid var(--border-glow)', marginBottom: '1rem' }}>
            <img
              src={currentPassenger?.photoUrl}
              alt="Passenger Face at Gate"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            <div className={`biometric-oval ${boardedStatus ? 'matched' : 'scanning'}`} />
            {scanning && <div className="scan-laser" />}

            {/* Verification Status Overlay */}
            {boardedStatus && (
              <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', background: 'rgba(16, 185, 129, 0.95)', color: '#040914', padding: '0.8rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 0 25px rgba(16, 185, 129, 0.6)' }}>
                ✓ ПОСАДКА РАЗРЕШЕНА | МЕСТО {boardedStatus.seat}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={handleGateScan} disabled={scanning}>
              <RefreshCw style={{ width: '16px', animation: scanning ? 'spin 1s linear infinite' : 'none' }} />
              {scanning ? 'Сканирование лица...' : 'Сканировать Лицо на Гейте'}
            </button>
            <button className="btn-secondary" onClick={nextPassenger}>
              Следующий пассажир
            </button>
          </div>
        </div>

        {/* Right: Manifest & Gate Log */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users style={{ color: '#00f2fe', width: '18px' }} />
            Манифест Пассажиров Рейса SU-1420
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {SAMPLE_PASSENGERS.map((passenger) => {
              const isBoarded = boardedPassengers.includes(passenger.pnr);
              const isCurrent = passenger.pnr === currentPassenger.pnr;

              return (
                <div
                  key={passenger.pnr}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    background: isCurrent ? 'rgba(0, 242, 254, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                    border: `1px solid ${isCurrent ? '#00f2fe' : 'rgba(148, 163, 184, 0.15)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <img src={passenger.photoUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{passenger.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Место {passenger.seat} • {passenger.pnr}</div>
                    </div>
                  </div>

                  <span className={`badge-status ${isBoarded ? 'badge-matched' : isCurrent ? 'badge-scanning' : ''}`}>
                    {isBoarded ? 'НА БОРТУ' : isCurrent ? 'У ТУРНИКЕТА' : 'ОЖИДАЕТ'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
