import React from 'react';
import { ShieldCheck, UserCheck, QrCode, Terminal, Plane } from 'lucide-react';

export default function Navbar({ activeMode, setActiveMode }) {
  return (
    <header className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)' }}>
          <Plane style={{ color: '#040914', width: '24px', height: '24px' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(90deg, #ffffff 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AirBiometric <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', borderRadius: '4px', border: '1px solid rgba(0, 242, 254, 0.3)', verticalAlign: 'middle', fontWeight: 700 }}>VERIFIER v2.4</span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Сервис биометрической проверки лиц и документов</p>
        </div>
      </div>

      <nav style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.35rem', borderRadius: '14px', border: '1px solid var(--border-glow)' }}>
        <button
          className={activeMode === 'checkin' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveMode('checkin')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
        >
          <UserCheck style={{ width: '16px', height: '16px' }} />
          Регистрация пассажира
        </button>

        <button
          className={activeMode === 'gate' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveMode('gate')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
        >
          <QrCode style={{ width: '16px', height: '16px' }} />
          Сканер на Гейте
        </button>

        <button
          className={activeMode === 'api' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveMode('api')}
          style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}
        >
          <Terminal style={{ width: '16px', height: '16px' }} />
          API Тестер (Ответ JSON)
        </button>
      </nav>
    </header>
  );
}
