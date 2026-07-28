import React from 'react';
import { ShieldCheck, QrCode, Plane, Download, CheckCircle2, User } from 'lucide-react';

export default function BiometricBoardingPass({ passenger }) {
  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid #10b981', padding: '0.4rem 1rem', borderRadius: '50px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.8rem' }}>
          <ShieldCheck style={{ width: '18px' }} />
          BIOMETRIC EXPRESS BOARDING PASS
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Цифровой Посадочный Талон</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Предъявление паспорта не требуется. Проход на посадку по биометрии лица.
        </p>
      </div>

      {/* Ticket Container */}
      <div style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)', borderRadius: '24px', border: '1px solid rgba(0, 242, 254, 0.4)', boxShadow: '0 10px 40px rgba(0, 242, 254, 0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Ticket Header */}
        <div style={{ background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)', padding: '1rem 2rem', color: '#040914', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1.1rem' }}>
            <Plane style={{ width: '22px' }} />
            AIRLINE BIOMETRIC EXPRESS PASS
          </div>
          <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>РЕЙС: {passenger?.flightNumber}</span>
        </div>

        {/* Ticket Content */}
        <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ПАССАЖИР / PASSENGER</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{passenger?.fullName}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ОТКУДА</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#38bdf8' }}>{passenger?.origin?.split(' ')[0]}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>КУДА</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#38bdf8' }}>{passenger?.destination?.split(' ')[0]}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ВЫЛЕТ</span>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{passenger?.departureTime}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', background: 'rgba(3, 7, 18, 0.6)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.2)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ГЕЙТ</span>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#00f2fe' }}>{passenger?.gate}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>МЕСТО</span>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#34d399' }}>{passenger?.seat}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>КЛАСС</span>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{passenger?.class}</div>
              </div>
            </div>
          </div>

          {/* QR Code & Biometric Token Side */}
          <div style={{ borderLeft: '2px dashed rgba(148, 163, 184, 0.2)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ background: '#fff', padding: '0.8rem', borderRadius: '12px', marginBottom: '0.8rem', boxShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
              <QrCode style={{ width: '100px', height: '100px', color: '#000' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, marginBottom: '0.2rem' }}>
              ✓ BIOMETRIC ENROLLED
            </span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
              {passenger?.biometricToken}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <button className="btn-primary" onClick={() => window.print()}>
          <Download style={{ width: '18px' }} />
          Сохранить / Распечатать Талон
        </button>
      </div>
    </div>
  );
}
