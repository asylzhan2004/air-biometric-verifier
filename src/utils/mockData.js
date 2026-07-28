// Mock Data for Airline Biometric Passenger System

export const SAMPLE_PASSENGERS = [
  {
    pnr: "AIR-7890",
    firstName: "АЛЕКСАНДР",
    lastName: "ИВАНОВ",
    fullName: "Александр Иванов",
    documentNumber: "4512 892104",
    documentType: "Паспорт РФ",
    issueCountry: "RUS",
    birthDate: "1992-05-14",
    gender: "M",
    expiryDate: "2032-05-14",
    flightNumber: "SU-1420",
    origin: "SVO (Москва)",
    destination: "LED (Санкт-Петербург)",
    departureTime: "14:30, Сегодня",
    gate: "B14",
    seat: "04A",
    class: "Бизнес",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    biometricToken: "BIO-HASH-99218-RUS-SVO",
    status: "ENROLLED"
  },
  {
    pnr: "FLY-4321",
    firstName: "ЕКАТЕРИНА",
    lastName: "СМИРНОВА",
    fullName: "Екатерина Смирнова",
    documentNumber: "7519 332810",
    documentType: "Загранпаспорт",
    issueCountry: "RUS",
    birthDate: "1996-11-22",
    gender: "F",
    expiryDate: "2030-11-22",
    flightNumber: "SU-2104",
    origin: "SVO (Москва)",
    destination: "DXB (Дубай)",
    departureTime: "18:45, Сегодня",
    gate: "C08",
    seat: "12C",
    class: "Эконом Премиум",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    biometricToken: "BIO-HASH-44120-RUS-DXB",
    status: "ENROLLED"
  },
  {
    pnr: "AERO-5512",
    firstName: "МАКСИМ",
    lastName: "ПЕТРОВ",
    fullName: "Максим Петров",
    documentNumber: "6504 118273",
    documentType: "ID Карта",
    issueCountry: "KAZ",
    birthDate: "1988-03-09",
    gender: "M",
    expiryDate: "2029-03-09",
    flightNumber: "KC-872",
    origin: "NQZ (Астана)",
    destination: "ALA (Алматы)",
    departureTime: "16:10, Сегодня",
    gate: "A03",
    seat: "02F",
    class: "Бизнес",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    biometricToken: "BIO-HASH-10823-KAZ-ALA",
    status: "ENROLLED"
  }
];

export const MOCK_FLIGHTS = [
  { id: "SU-1420", route: "Москва (SVO) → Санкт-Петербург (LED)", gate: "B14", boardTime: "14:00" },
  { id: "SU-2104", route: "Москва (SVO) → Дубай (DXB)", gate: "C08", boardTime: "18:15" },
  { id: "KC-872", route: "Астана (NQZ) → Алматы (ALA)", gate: "A03", boardTime: "15:40" }
];
