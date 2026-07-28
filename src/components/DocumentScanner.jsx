import React, { useState } from 'react';
import { FileText, Camera, Upload, CheckCircle, ArrowRight, RefreshCw, Eye } from 'lucide-react';

export default function DocumentScanner({ passenger, onDocumentVerified }) {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(true); // Default loaded with passenger doc
  const [docImage, setDocImage] = useState(passenger?.photoUrl);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 1500);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Шаг 2: Сканирование Документа (Паспорт / ID Карта)
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Система считывает MRZ-строку, данные пассажира и вырезает биометрическое фото документа
        </p>
      </div>

      <div className="grid-2">
        {/* Left: Document Viewport & Capture */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <FileText style={{ color: '#00f2fe', width: '18px' }} />
            Камера Сканера Документов
          </h3>

          <div style={{ position: 'relative', width: '100%', height: '240px', background: '#090d16', borderRadius: '12px', overflow: 'hidden', border: '2px dashed var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
            {docImage ? (
              <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={docImage}
                  alt="Документ"
                  style={{ maxHeight: '180px', borderRadius: '8px', border: '2px solid #00f2fe', boxShadow: '0 0 20px rgba(0,242,254,0.3)' }}
                />
                <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.85)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', color: '#00f2fe', border: '1px solid #00f2fe' }}>
                  [ФОТО ИЗВЛЕЧЕНО ИЗ MRZ]
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>
                <Camera style={{ width: '48px', height: '48px', margin: '0 auto 0.5rem', opacity: 0.6 }} />
                <p style={{ fontSize: '0.85rem' }}>Поместите разворот паспорта в область сканирования</p>
              </div>
            )}

            {scanning && <div className="scan-laser" />}
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={handleScan} disabled={scanning} style={{ fontSize: '0.85rem' }}>
              <RefreshCw style={{ width: '16px', animation: scanning ? 'spin 1s linear infinite' : 'none' }} />
              {scanning ? 'Считывание OCR...' : 'Пересканировать'}
            </button>
          </div>
        </div>

        {/* Right: Recognized Data & OCR Summary */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(148,163,184,0.15)', paddingBottom: '0.8rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Распознанные Данные OCR</h3>
              <span className="badge-status badge-matched">
                <CheckCircle style={{ width: '14px' }} />
                MRZ ВАЛИДЕН
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>ФИО Пассажира:</span>
                <strong>{passenger?.fullName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Тип и № Документа:</span>
                <strong>{passenger?.documentType} № {passenger?.documentNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Гражданство:</span>
                <strong>{passenger?.issueCountry}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Дата Рождения:</span>
                <strong>{passenger?.birthDate}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Срок действия:</span>
                <strong style={{ color: '#34d399' }}>{passenger?.expiryDate} (Действителен)</strong>
              </div>
            </div>

            {/* MRZ Code Simulation */}
            <div style={{ marginTop: '1.5rem', background: '#040711', padding: '0.8rem', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#38bdf8', letterSpacing: '1px', wordBreak: 'break-all', border: '1px solid rgba(56,189,248,0.2)' }}>
              P&lt;RUS{passenger?.lastName}&lt;&lt;{passenger?.firstName}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br/>
              {passenger?.documentNumber?.replace(' ', '')}4RUS{passenger?.birthDate?.replace(/-/g, '').slice(2)}2M{passenger?.expiryDate?.replace(/-/g, '').slice(2)}0&lt;&lt;&lt;&lt;&lt;&lt;02
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => onDocumentVerified({ photoUrl: docImage, documentData: passenger })}
            style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
          >
            Перейти к Проверке Биометрии Лица
            <ArrowRight style={{ width: '18px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
