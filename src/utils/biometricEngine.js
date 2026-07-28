/**
 * Biometric Verification & Document Matching Engine
 */

export function analyzeBiometricMatch(documentData, liveScanData, simulatedFailure = false) {
  // If simulated failure or mismatch explicitly selected
  if (simulatedFailure) {
    return {
      status: "MISMATCH_DETECTED",
      verified: false,
      code: 401,
      message: "Биометрический профиль лица не совпадает с фотографией в документе",
      confidenceScore: 42.3,
      matchThreshold: 85.0,
      livenessPassed: true,
      antiSpoofCheck: "PASSED",
      timestamp: new Date().toISOString(),
      details: {
        eyeDistanceSimilarity: 0.41,
        noseJawGeometryMatch: 0.44,
        facialLandmarksMatched: 28,
        totalLandmarksEvaluated: 68
      }
    };
  }

  // Calculate high confidence match
  const confidenceScore = Math.floor(950 + Math.random() * 45) / 10; // 95.0% - 99.5%
  
  return {
    status: "MATCH_FOUND",
    verified: true,
    code: 200,
    message: "Личность успешно подтверждена. Данные документа и биометрия лица совпадают.",
    confidenceScore: confidenceScore,
    matchThreshold: 85.0,
    livenessPassed: true,
    antiSpoofCheck: "PASSED_REAL_HUMAN",
    biometricToken: `BIO-TOKEN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    person: {
      fullName: documentData?.fullName || "Александр Иванов",
      documentNumber: documentData?.documentNumber || "4512 892104",
      documentType: documentData?.documentType || "Паспорт РФ",
      issueCountry: documentData?.issueCountry || "RUS",
      pnr: documentData?.pnr || "AIR-7890",
      flightNumber: documentData?.flightNumber || "SU-1420",
      seat: documentData?.seat || "04A"
    },
    biometricMetrics: {
      eyeDistanceRatio: 0.984,
      facialLandmarksMatched: 67,
      totalLandmarksEvaluated: 68,
      vectorDistance: 0.042
    }
  };
}

/**
 * Generate 68 facial mesh landmark points for Canvas visual rendering
 */
export function generateFacialLandmarks(width, height, isScanning = true) {
  const centerX = width / 2;
  const centerY = height / 2 - 10;
  const scale = Math.min(width, height) / 300;

  const points = [];

  // Jawline (17 points)
  for (let i = -8; i <= 8; i++) {
    const angle = (i * 10 * Math.PI) / 180;
    points.push({
      x: centerX + Math.sin(angle) * 75 * scale,
      y: centerY + Math.cos(angle) * 90 * scale + (Math.abs(i) * 3),
      type: 'jaw'
    });
  }

  // Eyebrows (10 points)
  for (let i = -4; i <= 4; i++) {
    points.push({ x: centerX - 35 * scale + (i * 7 * scale), y: centerY - 35 * scale, type: 'eyebrow' });
    points.push({ x: centerX + 35 * scale + (i * 7 * scale), y: centerY - 35 * scale, type: 'eyebrow' });
  }

  // Nose bridge & base (9 points)
  for (let i = 0; i < 4; i++) {
    points.push({ x: centerX, y: centerY - 25 * scale + (i * 10 * scale), type: 'nose' });
  }
  points.push({ x: centerX - 12 * scale, y: centerY + 15 * scale, type: 'nose' });
  points.push({ x: centerX - 6 * scale, y: centerY + 18 * scale, type: 'nose' });
  points.push({ x: centerX + 6 * scale, y: centerY + 18 * scale, type: 'nose' });
  points.push({ x: centerX + 12 * scale, y: centerY + 15 * scale, type: 'nose' });

  // Eyes (12 points)
  const leftEyeCenter = { x: centerX - 35 * scale, y: centerY - 15 * scale };
  const rightEyeCenter = { x: centerX + 35 * scale, y: centerY - 15 * scale };
  
  [leftEyeCenter, rightEyeCenter].forEach(eye => {
    points.push({ x: eye.x - 10 * scale, y: eye.y, type: 'eye' });
    points.push({ x: eye.x, y: eye.y - 5 * scale, type: 'eye' });
    points.push({ x: eye.x + 10 * scale, y: eye.y, type: 'eye' });
    points.push({ x: eye.x, y: eye.y + 5 * scale, type: 'eye' });
  });

  // Lips / Mouth (20 points)
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180;
    points.push({
      x: centerX + Math.cos(rad) * 22 * scale,
      y: centerY + 45 * scale + Math.sin(rad) * 10 * scale,
      type: 'mouth'
    });
  }

  return points;
}
