import React from 'react';
import { Search, FileText, ScanFace, CheckCircle2, Ticket } from 'lucide-react';

export default function StepIndicator({ currentStep, setStep }) {
  const steps = [
    { id: 1, label: 'Поиск рейса', icon: Search },
    { id: 2, label: 'Паспорт / ID', icon: FileText },
    { id: 3, label: 'Биометрия Лица', icon: ScanFace },
    { id: 4, label: 'Результат Сверки', icon: CheckCircle2 },
    { id: 5, label: 'Посадочный', icon: Ticket }
  ];

  return (
    <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div
              key={step.id}
              onClick={() => step.id <= currentStep && setStep(step.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: step.id <= currentStep ? 'pointer' : 'not-allowed',
                zIndex: 2,
                opacity: step.id <= currentStep ? 1 : 0.4
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive
                    ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(30, 41, 59, 0.8)',
                  color: isActive ? '#040914' : isCompleted ? '#34d399' : 'var(--text-muted)',
                  border: isActive
                    ? '2px solid #00f2fe'
                    : isCompleted
                    ? '1px solid #10b981'
                    : '1px solid var(--border-glow)',
                  boxShadow: isActive ? '0 0 15px rgba(0, 242, 254, 0.5)' : 'none',
                  fontWeight: 700,
                  transition: 'all 0.3s ease'
                }}
              >
                <Icon style={{ width: '20px', height: '20px' }} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#00f2fe' : isCompleted ? '#34d399' : 'var(--text-muted)' }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
