import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, Play, Copy, Check } from 'lucide-react';
import { analyzeBiometricMatch } from '../utils/biometricEngine';
import { SAMPLE_PASSENGERS } from '../utils/mockData';

export default function ApiTesterModal() {
  const [selectedPerson, setSelectedPerson] = useState(SAMPLE_PASSENGERS[0]);
  const [isSimulatedMismatch, setIsSimulatedMismatch] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunApiRequest = () => {
    setLoading(true);
    setApiResponse(null);

    setTimeout(() => {
      const response = analyzeBiometricMatch(
        selectedPerson,
        { isMismatch: isSimulatedMismatch },
        isSimulatedMismatch
      );
      setApiResponse(response);
      setLoading(false);
    }, 600);
  };

  const copyResponse = () => {
    if (!apiResponse) return;
    navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid #8b5cf6', padding: '0.4rem 1rem', borderRadius: '50px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.8rem' }}>
          <Terminal style={{ width: '18px' }} />
          POST /api/v1/biometrics/verify
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>API Инспектора Биометрии & Документов</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Тестовая консоль сервиса: отправляет фотографии документа и лица, возвращая структурный JSON ответ с результатом <code style={{ color: '#00f2fe' }}>"status": "MATCH_FOUND"</code>
        </p>
      </div>

      <div className="grid-2">
        {/* Left: Input Payload Configuration */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.2rem', color: '#00f2fe' }}>
            1. Параметры Запроса (Request Payload)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Выберите Пассажира для Сверки:
              </label>
              <select
                value={selectedPerson.pnr}
                onChange={(e) => setSelectedPerson(SAMPLE_PASSENGERS.find(p => p.pnr === e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  background: '#040711',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                {SAMPLE_PASSENGERS.map(p => (
                  <option key={p.pnr} value={p.pnr}>
                    {p.fullName} ({p.documentType} - {p.documentNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Сценарий Тестирования:
              </label>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setIsSimulatedMismatch(false)}
                  style={{
                    flex: 1,
                    fontSize: '0.85rem',
                    borderColor: !isSimulatedMismatch ? '#10b981' : 'var(--border-glow)',
                    background: !isSimulatedMismatch ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.5)'
                  }}
                >
                  Успешное Совпадение (Found)
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setIsSimulatedMismatch(true)}
                  style={{
                    flex: 1,
                    fontSize: '0.85rem',
                    borderColor: isSimulatedMismatch ? '#f43f5e' : 'var(--border-glow)',
                    background: isSimulatedMismatch ? 'rgba(244, 63, 94, 0.15)' : 'rgba(30, 41, 59, 0.5)'
                  }}
                >
                  Несовпадение (Mismatch)
                </button>
              </div>
            </div>

            {/* Request preview snippet */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Тело HTTP Запроса (Body):
              </label>
              <pre style={{ background: '#040711', padding: '1rem', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>
{JSON.stringify({
  endpoint: "POST /api/v1/biometrics/verify",
  documentType: selectedPerson.documentType,
  documentNumber: selectedPerson.documentNumber,
  faceImageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  documentPhotoBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  enableLivenessCheck: true,
  antiSpoofStrictness: "HIGH"
}, null, 2)}
              </pre>
            </div>
          </div>

          <button className="btn-primary" onClick={handleRunApiRequest} style={{ width: '100%', justifyContent: 'center' }}>
            <Play style={{ width: '18px' }} />
            {loading ? 'Выполнение запроса...' : 'Отправить Запрос на Сервис Верификации'}
          </button>
        </div>

        {/* Right: API JSON Response Output */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#34d399' }}>
                2. Ответ Сервиса (HTTP 200 / JSON Response)
              </h3>
              {apiResponse && (
                <button className="btn-secondary" onClick={copyResponse} style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}>
                  {copied ? <Check style={{ width: '14px', color: '#34d399' }} /> : <Copy style={{ width: '14px' }} />}
                  {copied ? 'Скопировано!' : 'Копировать JSON'}
                </button>
              )}
            </div>

            {apiResponse ? (
              <pre className="json-viewer" style={{ maxHeight: '380px' }}>
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            ) : (
              <div style={{ background: '#040711', padding: '3rem 1.5rem', textAlign: 'center', borderRadius: '12px', border: '1px dashed var(--border-glow)', color: 'var(--text-muted)' }}>
                <Send style={{ width: '36px', height: '36px', margin: '0 auto 1rem', opacity: 0.5, color: '#00f2fe' }} />
                <p style={{ fontSize: '0.9rem' }}>Нажмите кнопку "Отправить Запрос", чтобы получить ответ микросервиса биометрии.</p>
              </div>
            )}
          </div>

          {apiResponse && (
            <div style={{ marginTop: '1rem', padding: '0.8rem 1rem', background: apiResponse.verified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)', border: `1px solid ${apiResponse.verified ? '#10b981' : '#f43f5e'}`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
              <CheckCircle2 style={{ color: apiResponse.verified ? '#34d399' : '#fb7185', width: '18px' }} />
              <span>Статус ответа: <strong style={{ color: apiResponse.verified ? '#34d399' : '#fb7185', fontFamily: 'var(--font-mono)' }}>{apiResponse.status}</strong> ({apiResponse.confidenceScore}% совпадения)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
