import React, { useState, useRef, useCallback, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000';

export default function App() {
  // Mode Selector: 'WEBCAM' vs 'PHOTO_BENCHMARK'
  const [appMode, setAppMode] = useState('WEBCAM'); 

  // Multiple Documents State (Webcam Mode)
  const [docFiles, setDocFiles] = useState([]);
  const [docPreviews, setDocPreviews] = useState([]);
  const docInputRef = useRef(null);

  // Photo & PDF Benchmark Mode State
  const [targetPhoto, setTargetPhoto] = useState(null);
  const [targetPreview, setTargetPreview] = useState(null);
  const targetInputRef = useRef(null);

  const [candidateFiles, setCandidateFiles] = useState([]);
  const [candidatePreviews, setCandidatePreviews] = useState([]);
  const candidatesInputRef = useRef(null);

  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);

  // Webcam State
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [simulatedCamera, setSimulatedCamera] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // eGov Interactive Real-Time AI Yaw Tracking State
  const [egovMode, setEgovMode] = useState(false);
  const [egovStep, setEgovStep] = useState(0); 
  const [currentPose, setCurrentPose] = useState('NONE'); 
  const [capturedFrames, setCapturedFrames] = useState({ left: null, right: null, center: null });
  const [stepStatus, setStepStatus] = useState({ left: false, right: false, center: false });

  // Verification & Search State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showJson, setShowJson] = useState(false);

  // ── Start Webcam ──
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setSimulatedCamera(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Ваш браузер не поддерживает прямое подключение к веб-камере');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });

      streamRef.current = stream;
      setCameraOn(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.warn('Auto-play caught:', err));
        }
      }, 100);

    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Веб-камера недоступна или заблокирована браузером.');
      setSimulatedCamera(true);
      setCameraOn(true);
    }
  }, []);

  // ── Stop Camera ──
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
    setSimulatedCamera(false);
  }, []);

  useEffect(() => {
    if (appMode === 'WEBCAM' && docFiles.length > 0 && !cameraOn && !result) {
      startCamera();
    } else if (appMode === 'PHOTO_BENCHMARK') {
      stopCamera();
    }
  }, [appMode, docFiles, cameraOn, result, startCamera, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Document Selection (Webcam Mode) ──
  const handleDocSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...docFiles, ...files];
    setDocFiles(newFiles);
    setResult(null);

    const previews = newFiles.map(file => {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      return {
        name: file.name,
        isPdf,
        url: isPdf ? null : URL.createObjectURL(file)
      };
    });
    setDocPreviews(previews);
  };

  const removeDoc = (index) => {
    const updatedFiles = docFiles.filter((_, idx) => idx !== index);
    const updatedPreviews = docPreviews.filter((_, idx) => idx !== index);
    setDocFiles(updatedFiles);
    setDocPreviews(updatedPreviews);
    setResult(null);
  };

  // ── Target Selection (Supports Photos & PDF Documents) ──
  const handleTargetSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTargetPhoto(file);
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    setTargetPreview({
      name: file.name,
      isPdf,
      url: isPdf ? null : URL.createObjectURL(file)
    });
    setBenchmarkResults(null);
  };

  // ── Candidates Selection (Supports Photos & PDF Documents) ──
  const handleCandidatesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...candidateFiles, ...files];
    setCandidateFiles(newFiles);
    setBenchmarkResults(null);

    const previews = newFiles.map(file => {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      return {
        name: file.name,
        isPdf,
        url: isPdf ? null : URL.createObjectURL(file)
      };
    });
    setCandidatePreviews(previews);
  };

  const removeCandidate = (index) => {
    setCandidateFiles(candidateFiles.filter((_, idx) => idx !== index));
    setCandidatePreviews(candidatePreviews.filter((_, idx) => idx !== index));
    setBenchmarkResults(null);
  };

  // ── Run Photo & PDF Benchmark ──
  const runPhotoBenchmark = async () => {
    if (!targetPhoto || candidateFiles.length === 0) return;
    setBenchmarkLoading(true);
    setBenchmarkResults(null);

    try {
      const formData = new FormData();
      formData.append('live_frame', targetPhoto, targetPhoto.name);
      candidateFiles.forEach(file => {
        formData.append('documents', file, file.name);
      });

      const res = await fetch(`${API_URL}/api/v1/biometrics/search`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Ошибка тестирования фото/PDF');
      }

      const data = await res.json();
      setBenchmarkResults(data);
    } catch (err) {
      console.error(err);
      setBenchmarkResults({ error: err.message });
    } finally {
      setBenchmarkLoading(false);
    }
  };

  // ── Capture Frame ──
  const captureFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    if (videoRef.current && videoRef.current.readyState >= 2 && !simulatedCamera) {
      ctx.translate(640, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 480);
      const testImg = new Image();
      testImg.crossOrigin = 'anonymous';
      testImg.src = docPreviews.find(p => p.url)?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
      ctx.drawImage(testImg, 170, 60, 300, 360);
    }

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.95);
    });
  }, [simulatedCamera, docPreviews]);

  // ── Real-Time AI Head Yaw Tracking Interval ──
  useEffect(() => {
    if (appMode !== 'WEBCAM' || !cameraOn || egovStep === 0 || loading) return;

    const interval = setInterval(async () => {
      const blob = await captureFrame();
      if (!blob) return;

      const formData = new FormData();
      formData.append('frame', blob, 'frame.jpg');

      try {
        const res = await fetch(`${API_URL}/api/v1/biometrics/detect-yaw`, {
          method: 'POST',
          body: formData
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.faceDetected) {
          setCurrentPose(data.pose);

          if (egovStep === 1 && (data.pose === 'LEFT' || data.pose === 'RIGHT')) {
            setCapturedFrames(prev => ({ ...prev, left: blob }));
            setStepStatus(prev => ({ ...prev, left: true }));
            setEgovStep(2);
          } else if (egovStep === 2 && (data.pose === 'RIGHT' || data.pose === 'LEFT')) {
            setCapturedFrames(prev => ({ ...prev, right: blob }));
            setStepStatus(prev => ({ ...prev, right: true }));
            setEgovStep(3);
          } else if (egovStep === 3 && data.pose === 'CENTER') {
            const updatedFrames = { ...capturedFrames, center: blob };
            setCapturedFrames(updatedFrames);
            setStepStatus(prev => ({ ...prev, center: true }));
            setEgovStep(0);
            submitEgovVerification(updatedFrames);
          }
        }
      } catch (err) {
        console.warn('Yaw tracking check:', err);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [appMode, cameraOn, egovStep, loading, captureFrame, capturedFrames]);

  // ── Start eGov 3D Flow ──
  const startEgovFlow = () => {
    setEgovStep(1);
    setResult(null);
    setStepStatus({ left: false, right: false, center: false });
    setCapturedFrames({ left: null, right: null, center: null });
  };

  const advanceEgovStep = async () => {
    const blob = await captureFrame();
    if (!blob) return;

    if (egovStep === 1) {
      setCapturedFrames(prev => ({ ...prev, left: blob }));
      setStepStatus(prev => ({ ...prev, left: true }));
      setEgovStep(2);
    } else if (egovStep === 2) {
      setCapturedFrames(prev => ({ ...prev, right: blob }));
      setStepStatus(prev => ({ ...prev, right: true }));
      setEgovStep(3);
    } else if (egovStep === 3) {
      const updatedFrames = { ...capturedFrames, center: blob };
      setCapturedFrames(updatedFrames);
      setStepStatus(prev => ({ ...prev, center: true }));
      setEgovStep(0);
      submitEgovVerification(updatedFrames);
    }
  };

  const submitEgovVerification = async (frames) => {
    if (docFiles.length === 0) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('document_photo', docFiles[0], docFiles[0].name);
      formData.append('frame_left', frames.left, 'left.jpg');
      formData.append('frame_right', frames.right, 'right.jpg');
      formData.append('frame_center', frames.center, 'center.jpg');

      const res = await fetch(`${API_URL}/api/v1/biometrics/egov-verify`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'ошибка при обработке eGov биометрии');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const runVerification = async () => {
    if (docFiles.length === 0) return;
    setLoading(true);
    setResult(null);
    setShowJson(false);

    try {
      const liveBlob = await captureFrame();
      if (!liveBlob) throw new Error('Не удалось получить снимок с камеры');

      const formData = new FormData();
      docFiles.forEach(file => {
        formData.append('documents', file, file.name);
      });
      formData.append('live_frame', liveBlob, 'live_frame.jpg');

      const res = await fetch(`${API_URL}/api/v1/biometrics/search`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Ошибка верификации на сервере');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="header">
        <div className="logo-group">
          <div className="logo-icon">🛫</div>
          <div>
            <h1>AIR BIOMETRIC — СИСТЕМА КОНТРОЛЯ ДОСТУПА И ТЕСТИРОВАНИЯ</h1>
            <p className="subtitle">Выберите режим работы системы ниже ⬇️</p>
          </div>
        </div>

        {/* Mode Switcher Bar */}
        <div className="main-nav-bar">
          <button 
            className={`nav-tab ${appMode === 'WEBCAM' ? 'active-tab' : ''}`}
            onClick={() => setAppMode('WEBCAM')}
          >
            📹 ВЕБ-КАМЕРА / ТУРНИКЕТ
          </button>
          <button 
            className={`nav-tab ${appMode === 'PHOTO_BENCHMARK' ? 'active-tab' : ''}`}
            onClick={() => setAppMode('PHOTO_BENCHMARK')}
          >
            🧪 ТЕСТ ПО ФОТО И PDF (ФОТО/PDF ↔ ФОТО/PDF)
          </button>
        </div>
      </header>

      {/* Mode 1: Live Webcam & Turnstile */}
      {appMode === 'WEBCAM' && (
        <main className="main-layout">
          {/* Left Column: Documents Upload */}
          <section className="card doc-section">
            <div className="card-header">
              <h2>📄 БАЗА ДОКУМЕНТОВ (ПАСПОРТА / ID)</h2>
              <span className="badge">{docFiles.length} загружено</span>
            </div>

            <div 
              className="upload-dropzone"
              onClick={() => docInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={docInputRef} 
                onChange={handleDocSelect} 
                multiple 
                accept="image/*,application/pdf" 
                style={{ display: 'none' }} 
              />
              <div className="upload-icon">📁</div>
              <p><strong>Загрузите паспорта или PDF документы</strong></p>
              <span className="small-text">Поддерживается мульти-загрузка JPG, PNG, WEBP, PDF</span>
            </div>

            {/* Document Grid */}
            <div className="doc-grid">
              {docPreviews.map((preview, idx) => {
                const scoreObj = result?.allDocumentScores?.find(s => s.index === idx);
                const isBest = result?.bestMatch?.index === idx;

                return (
                  <div key={idx} className={`doc-card ${isBest ? 'best-match' : ''}`}>
                    <button className="remove-btn" onClick={() => removeDoc(idx)}>✕</button>
                    <div className="doc-thumbnail">
                      {preview.isPdf ? (
                        <div className="pdf-placeholder">
                          <span className="pdf-icon">📕</span>
                          <span className="pdf-tag">PDF</span>
                        </div>
                      ) : (
                        <img src={preview.url} alt={preview.name} />
                      )}
                    </div>
                    <div className="doc-info">
                      <span className="doc-name" title={preview.name}>{preview.name}</span>
                      {scoreObj && (
                        <span className={`match-tag ${scoreObj.matched ? 'matched' : 'mismatch'}`}>
                          {scoreObj.matched ? `✓ ${scoreObj.confidenceScore}%` : `✕ ${scoreObj.confidenceScore}%`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Column: Webcam Stream */}
          <section className="card camera-section">
            <div className="card-header">
              <h2>🎥 КАМЕРА ТУРНИКЕТА В РЕАЛЬНОМ ВРЕМЕНИ</h2>
              <div className="controls">
                <button 
                  className={`mode-toggle ${egovMode ? 'active-egov' : ''}`} 
                  onClick={() => {
                    setEgovMode(!egovMode);
                    setEgovStep(0);
                    setResult(null);
                  }}
                >
                  {egovMode ? '🏛️ РЕЖИМ eGOV 3D LIVENESS' : '⚡ СТАНДАРТНОЕ СКАНИРОВАНИЕ'}
                </button>
              </div>
            </div>

            <div className={`camera-viewport ${egovStep > 0 ? 'egov-active' : ''}`}>
              {cameraOn ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`webcam-video mirrored ${simulatedCamera ? 'simulated' : ''}`}
                  />
                  
                  <div className="face-guide-oval">
                    <div className="scan-line"></div>
                  </div>

                  <div className="live-passenger-overlay">
                    <span className="live-icon">👤</span>
                    <span className="passenger-title">
                      {egovStep === 0 && 'Пассажир перед камерой'}
                      {egovStep === 1 && `Шаг 1 из 3: Поверните налево (ИИ Поза: ${currentPose})`}
                      {egovStep === 2 && `Шаг 2 из 3: Поверните направо (ИИ Поза: ${currentPose})`}
                      {egovStep === 3 && `Шаг 3 из 3: Смотрите прямо (ИИ Поза: ${currentPose})`}
                    </span>
                  </div>

                  {egovMode && (
                    <div className="egov-step-progress-bar">
                      <span className={`step-item ${stepStatus.left ? 'done' : egovStep === 1 ? 'active' : ''}`}>
                        {stepStatus.left ? '✓ Лево' : '👈 1. Лево'}
                      </span>
                      <span className="step-arrow">➔</span>
                      <span className={`step-item ${stepStatus.right ? 'done' : egovStep === 2 ? 'active' : ''}`}>
                        {stepStatus.right ? '✓ Право' : '👉 2. Право'}
                      </span>
                      <span className="step-arrow">➔</span>
                      <span className={`step-item ${stepStatus.center ? 'done' : egovStep === 3 ? 'active' : ''}`}>
                        {stepStatus.center ? '✓ Центр' : '🎯 3. Центр'}
                      </span>
                    </div>
                  )}

                  {egovStep === 1 && (
                    <div className="egov-hud-prompt prompt-left">
                      <span className="hud-arrow">👈</span>
                      <h3>ПОВЕРНИТЕ ГОЛОВУ НАЛЕВО</h3>
                      <button className="hud-action-btn" onClick={advanceEgovStep}>Зафиксировать вручную ➔</button>
                    </div>
                  )}

                  {egovStep === 2 && (
                    <div className="egov-hud-prompt prompt-right">
                      <span className="hud-arrow">👉</span>
                      <h3>ПОВЕРНИТЕ ГОЛОВУ НАПРАВО</h3>
                      <button className="hud-action-btn" onClick={advanceEgovStep}>Зафиксировать вручную ➔</button>
                    </div>
                  )}

                  {egovStep === 3 && (
                    <div className="egov-hud-prompt prompt-center">
                      <span className="hud-arrow">🎯</span>
                      <h3>СМОТРИТЕ ПРЯМО В КАМЕРУ</h3>
                      <button className="hud-action-btn" onClick={advanceEgovStep}>Зафиксировать вручную ➔</button>
                    </div>
                  )}

                  <div className="camera-live-badge">
                    <span className="red-dot"></span> LIVE
                  </div>
                </>
              ) : (
                <div className="camera-off-placeholder">
                  <div className="cam-icon">📹</div>
                  <p>Веб-камера выключена</p>
                  <button className="btn primary" onClick={startCamera}>Включить Камеру</button>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="action-bar">
              {egovMode ? (
                <button 
                  className="btn egov-btn" 
                  disabled={docFiles.length === 0 || loading}
                  onClick={startEgovFlow}
                >
                  {loading ? '⏳ ОБРАБОТКА eGOV LIVENESS...' : '🏛️ НАЧАТЬ АВТОМАТИЧЕСКИЙ eGOV 3D LIVENESS'}
                </button>
              ) : (
                <button 
                  className="btn primary-btn" 
                  disabled={docFiles.length === 0 || loading}
                  onClick={runVerification}
                >
                  {loading ? '🔍 СКАНИРОВАНИЕ И ПОИСК...' : '🔍 СКАНИРОВАТЬ ЛИЦО И НАЙТИ ДОКУМЕНТ'}
                </button>
              )}
            </div>

            {result && !result.error && (
              <div className={`result-banner ${result.verified ? 'success' : 'failed'}`}>
                <div className="result-icon">{result.verified ? '🔓' : '🔒'}</div>
                <div className="result-text">
                  <h3>{result.verified ? 'ЛИЧНОСТЬ ПОДТВЕРЖДЕНА — ПРОХОД РАЗРЕШЕН' : 'ОШИБКА БИОМЕТРИИ — ПРОХОД ЗАПРЕЩЕН'}</h3>
                  {result.bestMatch && (
                    <p>Совпадение с документом: <strong>{result.bestMatch.filename}</strong> ({result.bestMatch.confidenceScore}%)</p>
                  )}
                </div>
                <button className="json-btn" onClick={() => setShowJson(!showJson)}>
                  {showJson ? 'Скрыть JSON' : '🔍 JSON API'}
                </button>
              </div>
            )}
          </section>
        </main>
      )}

      {/* Mode 2: Photo & PDF Benchmark Mode */}
      {appMode === 'PHOTO_BENCHMARK' && (
        <main className="benchmark-layout">
          <div className="card benchmark-header-card">
            <h2>🧪 ТЕСТИРОВАНИЕ РАСПОЗНАВАНИЯ ПО ФОТО И PDF ДОКУМЕНТАМ</h2>
            <p className="subtitle">
              Загрузите эталонное фото или PDF-паспорт человека и список файлов (JPG, PNG, WEBP, PDF) для проверки совпадений без веб-камеры.
            </p>
          </div>

          <div className="benchmark-grid">
            {/* Target Person Photo / PDF */}
            <section className="card target-section">
              <div className="card-header">
                <h2>🎯 ЭТАЛОННОЕ ФОТО ИЛИ PDF ПАСПОРТ</h2>
              </div>

              <div 
                className="upload-dropzone target-dropzone"
                onClick={() => targetInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={targetInputRef} 
                  onChange={handleTargetSelect} 
                  accept="image/*,application/pdf" 
                  style={{ display: 'none' }} 
                />
                {targetPreview ? (
                  <div className="target-preview-box">
                    {targetPreview.isPdf ? (
                      <div className="pdf-placeholder target-pdf">
                        <span className="pdf-icon">📕</span>
                        <span className="pdf-tag">PDF ДОКУМЕНТ</span>
                      </div>
                    ) : (
                      <img src={targetPreview.url} alt="Target" />
                    )}
                    <span className="target-filename">{targetPreview.name}</span>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">📄</div>
                    <p><strong>Загрузите 1 фото или PDF документ</strong></p>
                    <span className="small-text">Поддерживается JPG, PNG, WEBP и PDF</span>
                  </>
                )}
              </div>
            </section>

            {/* Candidate Photos & PDF Documents to Compare */}
            <section className="card candidates-section">
              <div className="card-header">
                <h2>📸 ФОТОГРАФИИ И PDF ДОКУМЕНТЫ (СПИСОК)</h2>
                <span className="badge">{candidateFiles.length} файлов</span>
              </div>

              <div 
                className="upload-dropzone"
                onClick={() => candidatesInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={candidatesInputRef} 
                  onChange={handleCandidatesSelect} 
                  multiple 
                  accept="image/*,application/pdf" 
                  style={{ display: 'none' }} 
                />
                <div className="upload-icon">📂</div>
                <p><strong>Загрузите фото и PDF документы для проверки</strong></p>
                <span className="small-text">Добавьте файлы того же человека + других людей (JPG, PNG, PDF)</span>
              </div>

              <div className="doc-grid">
                {candidatePreviews.map((prev, idx) => {
                  const scoreObj = benchmarkResults?.allDocumentScores?.find(s => s.index === idx);

                  return (
                    <div key={idx} className={`doc-card ${scoreObj?.matched ? 'best-match' : ''}`}>
                      <button className="remove-btn" onClick={() => removeCandidate(idx)}>✕</button>
                      <div className="doc-thumbnail">
                        {prev.isPdf ? (
                          <div className="pdf-placeholder">
                            <span className="pdf-icon">📕</span>
                            <span className="pdf-tag">PDF</span>
                          </div>
                        ) : (
                          <img src={prev.url} alt={prev.name} />
                        )}
                      </div>
                      <div className="doc-info">
                        <span className="doc-name" title={prev.name}>{prev.name}</span>
                        {scoreObj && (
                          <div className="score-details">
                            <span className={`match-tag ${scoreObj.matched ? 'matched' : 'mismatch'}`}>
                              {scoreObj.matched ? `✓ СВОЙ (${scoreObj.confidenceScore}%)` : `✕ ЧУЖОЙ (${scoreObj.confidenceScore}%)`}
                            </span>
                            <span className="raw-sim">Sim: {(scoreObj.rawSimilarity * 100).toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                className="btn primary-btn benchmark-run-btn"
                disabled={!targetPhoto || candidateFiles.length === 0 || benchmarkLoading}
                onClick={runPhotoBenchmark}
              >
                {benchmarkLoading ? '⏳ АНАЛИЗ И СРАВНЕНИЕ ФОТО/PDF ДОКУМЕНТОВ...' : '🧪 ЗАПУСТИТЬ СРАВНЕНИЕ ФОТО И PDF'}
              </button>

              {benchmarkResults && !benchmarkResults.error && (
                <div className={`result-banner ${benchmarkResults.verified ? 'success' : 'failed'}`}>
                  <div className="result-icon">{benchmarkResults.verified ? '✓' : '⚠️'}</div>
                  <div className="result-text">
                    <h3>{benchmarkResults.verified ? 'ОБНАРУЖЕНО СОВПАДЕНИЕ' : 'СОВПАДЕНИЙ НЕ НАЙДЕНО'}</h3>
                    {benchmarkResults.bestMatch && (
                      <p>Наиболее похожий документ: <strong>{benchmarkResults.bestMatch.filename}</strong> (Сходство: {(benchmarkResults.bestMatch.rawSimilarity * 100).toFixed(1)}%)</p>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      )}

    </div>
  );
}
