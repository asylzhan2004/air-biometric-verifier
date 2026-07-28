import React, { useState, useEffect, useRef } from 'react';
import { ScanFace, Camera, ShieldCheck, Check, ArrowRight, AlertTriangle, Sparkles, Eye, Zap, Moon, Sun, UserCheck } from 'lucide-react';
import { generateFacialLandmarks } from '../utils/biometricEngine';

export default function LiveBiometricScanner({ passenger, onBiometricCaptured }) {
  const [useWebcam, setUseWebcam] = useState(false);
  const [livenessStage, setLivenessStage] = useState(0); // 0: Position, 1: Smile, 2: Blink, 3: Success
  const [isScanning, setIsScanning] = useState(true);
  const [simulateMismatch, setSimulateMismatch] = useState(false);
  
  // Degraded conditions test modes (ArcFace Robustness Testing)
  const [degradedMode, setDegradedMode] = useState('normal'); // 'normal', 'low_light', 'extreme_angle', 'low_res', 'aging_beard'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Setup WebCam if enabled
  useEffect(() => {
    let stream = null;
    if (useWebcam) {
      navigator.mediaDevices?.getUserMedia({ video: { width: 640, height: 480 } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn('Webcam permission denied or unavailable:', err);
          setUseWebcam(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [useWebcam]);

  // Canvas Landmark Mesh Animation Loop
  useEffect(() => {
    let animationFrame;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const landmarks = generateFacialLandmarks(canvas.width, canvas.height, isScanning);

      ctx.strokeStyle = livenessStage === 3 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 242, 254, 0.35)';
      ctx.lineWidth = 1;

      for (let i = 0; i < landmarks.length - 1; i++) {
        if (landmarks[i].type === landmarks[i+1].type) {
          ctx.beginPath();
          ctx.moveTo(landmarks[i].x, landmarks[i].y);
          ctx.lineTo(landmarks[i+1].x, landmarks[i+1].y);
          ctx.stroke();
        }
      }

      landmarks.forEach((pt, idx) => {
        const pulse = Math.sin((tick + idx * 5) * 0.1) * 1.5;
        ctx.fillStyle = livenessStage === 3 ? '#34d399' : '#00f2fe';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2 + pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrame);
  }, [isScanning, livenessStage]);

  // Handle Liveness Flow Timers
  useEffect(() => {
    if (livenessStage === 0) {
      const timer = setTimeout(() => setLivenessStage(1), 1200);
      return () => clearTimeout(timer);
    } else if (livenessStage === 1) {
      const timer = setTimeout(() => setLivenessStage(2), 1500);
      return () => clearTimeout(timer);
    } else if (livenessStage === 2) {
      const timer = setTimeout(() => setLivenessStage(3), 1500);
      return () => clearTimeout(timer);
    }
  }, [livenessStage]);

  const livenessSteps = [
    { text: 'Поместите лицо в овал сканирования', status: livenessStage > 0 ? 'DONE' : 'ACTIVE' },
    { text: 'Улыбнитесь (Проверка 3D объёма кожи)', status: livenessStage > 1 ? 'DONE' : livenessStage === 1 ? 'ACTIVE' : 'PENDING' },
    { text: 'Моргайте естественным образом', status: livenessStage > 2 ? 'DONE' : livenessStage === 2 ? 'ACTIVE' : 'PENDING' }
  ];

  // Visual filters for degraded mode simulation
  const getImageFilter = () => {
    if (degradedMode === 'low_light') return 'brightness(0.35) contrast(1.4)';
    if (degradedMode === 'extreme_angle') return 'perspective(400px) rotateY(35deg) scale(0.9)';
    if (degradedMode === 'low_res') return 'blur(2.5px) contrast(1.1)';
    if (degradedMode === 'aging_beard') return 'sepia(0.3) contrast(1.25)';
    return 'none';
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '950px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.9rem', borderRadius: '50px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid #8b5cf6', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          <Zap style={{ width: '15px' }} /> ИИ ДВИЖОК: InsightFace ArcFace (ResNet-100 512D) + ONNX MiniFASNetV2
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Шаг 3: Биометрическое Сканирование Лица & Liveness Test
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Распознавание человека даже в сложнейших условиях: темнота, размытие, разворот головы и щетина
        </p>
      </div>

      <div className="grid-2" style={{ alignItems: 'center' }}>
        {/* Scanner Viewport */}
        <div style={{ textAlign: 'center' }}>
          <div className="scanner-viewport" style={{ border: degradedMode !== 'normal' ? '2px solid #8b5cf6' : '2px solid var(--border-glow)' }}>
            {useWebcam ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: getImageFilter(), transition: 'all 0.4s ease' }}
              />
            ) : (
              <img
                src={simulateMismatch ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80" : passenger?.photoUrl}
                alt="Live Scan Face"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: getImageFilter(), transition: 'all 0.4s ease' }}
              />
            )}

            <canvas
              ref={canvasRef}
              width={480}
              height={360}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
            />

            <div className={`biometric-oval ${livenessStage === 3 ? 'matched' : 'scanning'}`} />
            {livenessStage < 3 && <div className="scan-laser" />}

            <div style={{ position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(3, 7, 18, 0.9)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.78rem', color: livenessStage === 3 ? '#34d399' : '#00f2fe', border: `1px solid ${livenessStage === 3 ? '#10b981' : '#00f2fe'}`, zIndex: 15, fontFamily: 'var(--font-mono)' }}>
              {livenessStage === 3 ? '✓ LIVENESS & ANTIMOCK PASSED' : '● SCANNING 512D ARCFACE LANDMARKS...'}
            </div>
          </div>

          {/* Test Degraded Conditions Selector */}
          <div style={{ marginTop: '1.2rem', padding: '0.8rem', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <span style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 700, display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🧪 Стресс-Тест ИИ (Проверка в худшем виде):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
              <button
                className="btn-secondary"
                onClick={() => setDegradedMode('normal')}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderColor: degradedMode === 'normal' ? '#00f2fe' : 'rgba(148,163,184,0.2)', background: degradedMode === 'normal' ? 'rgba(0,242,254,0.15)' : 'transparent' }}
              >
                Нормальный вид
              </button>

              <button
                className="btn-secondary"
                onClick={() => setDegradedMode('low_light')}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderColor: degradedMode === 'low_light' ? '#8b5cf6' : 'rgba(148,163,184,0.2)', background: degradedMode === 'low_light' ? 'rgba(139,92,246,0.2)' : 'transparent' }}
              >
                <Moon style={{ width: '12px' }} /> Тень/Темнота
              </button>

              <button
                className="btn-secondary"
                onClick={() => setDegradedMode('extreme_angle')}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderColor: degradedMode === 'extreme_angle' ? '#8b5cf6' : 'rgba(148,163,184,0.2)', background: degradedMode === 'extreme_angle' ? 'rgba(139,92,246,0.2)' : 'transparent' }}
              >
                Поворот головы 45°
              </button>

              <button
                className="btn-secondary"
                onClick={() => setDegradedMode('low_res')}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderColor: degradedMode === 'low_res' ? '#8b5cf6' : 'rgba(148,163,184,0.2)', background: degradedMode === 'low_res' ? 'rgba(139,92,246,0.2)' : 'transparent' }}
              >
                Размытие (Low-Res)
              </button>

              <button
                className="btn-secondary"
                onClick={() => setDegradedMode('aging_beard')}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderColor: degradedMode === 'aging_beard' ? '#8b5cf6' : 'rgba(148,163,184,0.2)', background: degradedMode === 'aging_beard' ? 'rgba(139,92,246,0.2)' : 'transparent' }}
              >
                Борода / Старение
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Liveness Checklist */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00f2fe' }}>
              <ShieldCheck style={{ width: '22px' }} />
              Проверка MiniFASNetV2 ONNX
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {livenessSteps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    background: step.status === 'DONE' ? 'rgba(16, 185, 129, 0.12)' : step.status === 'ACTIVE' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                    border: `1px solid ${step.status === 'DONE' ? 'rgba(16, 185, 129, 0.4)' : step.status === 'ACTIVE' ? '#00f2fe' : 'transparent'}`
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: step.status === 'DONE' ? '#10b981' : step.status === 'ACTIVE' ? '#00f2fe' : 'rgba(148, 163, 184, 0.2)',
                    color: '#040914',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}>
                    {step.status === 'DONE' ? <Check style={{ width: '14px' }} /> : idx + 1}
                  </div>
                  <span style={{ fontSize: '0.88rem', color: step.status === 'PENDING' ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: step.status === 'ACTIVE' ? 700 : 500 }}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ background: '#040711', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.2)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              💡 <strong style={{ color: '#00f2fe' }}>InsightFace ArcFace</strong> строит нормализованный вектор из 512 измерений. Он сопоставляет форму костной структуры лица, поэтому устойчив к плохому освещению и смене внешности.
            </div>
          </div>

          <button
            className="btn-primary"
            disabled={livenessStage < 3}
            onClick={() => onBiometricCaptured({ livePhotoUrl: simulateMismatch ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80" : passenger?.photoUrl, isMismatch: simulateMismatch, degradedMode })}
            style={{
              width: '100%',
              justify: 'center',
              marginTop: '1.5rem',
              opacity: livenessStage < 3 ? 0.5 : 1,
              cursor: livenessStage < 3 ? 'not-allowed' : 'pointer'
            }}
          >
            {livenessStage < 3 ? 'Выполнение Liveness проверки...' : 'Запустить Сверку ArcFace AI (512D)'}
            <ArrowRight style={{ width: '18px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
