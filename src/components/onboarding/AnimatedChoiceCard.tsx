import { useState } from 'react';
import type { ReactNode } from 'react';

interface AnimatedChoiceCardProps {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  animationDelay?: number;
}

export function AnimatedChoiceCard({
  label,
  icon,
  description,
  isSelected,
  onClick,
  animationDelay = 0,
}: AnimatedChoiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10; // Tilt range
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        padding: 20,
        borderRadius: 20,
        border: isSelected ? '2px solid #6366f1' : '2px solid transparent',
        background: isSelected
          ? 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)'
          : 'rgba(255,255,255,0.8)',
        boxShadow: isSelected
          ? '0 8px 24px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.8)'
          : isHovered
          ? '0 12px 32px rgba(148,163,184,0.25), -2px -2px 8px rgba(255,255,255,0.9)'
          : '6px 6px 16px rgba(148,163,184,0.2), -6px -6px 16px rgba(255,255,255,0.9)',
        cursor: 'pointer',
        textAlign: 'center',
        transform: isHovered
          ? `perspective(1000px) rotateX(${-mousePosition.y}deg) rotateY(${mousePosition.x}deg) scale(1.02)`
          : isSelected
          ? 'scale(1)'
          : 'scale(1)',
        transition: isHovered
          ? 'transform 0.1s ease-out, box-shadow 0.3s ease, background 0.3s ease, border 0.3s ease'
          : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, background 0.3s ease, border 0.3s ease',
        animation: `slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${animationDelay}ms backwards`,
        willChange: 'transform',
      }}
    >
      {/* Selection ripple effect */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            opacity: 0,
            animation: 'ripple 0.6s ease-out',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Checkmark */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
            animation: 'popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          }}
        >
          ✓
        </div>
      )}

      {/* Icon with bounce animation */}
      {icon && (
        <div
          style={{
            fontSize: 48,
            marginBottom: 14,
            opacity: isSelected ? 1 : 0.8,
            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            animation: isHovered ? 'bounce 0.6s ease-in-out' : 'none',
          }}
        >
          {icon}
        </div>
      )}

      {/* Label */}
      <div
        className="nm-body"
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: isSelected ? '#4f46e5' : '#1f2937',
          marginBottom: description ? 8 : 0,
          transition: 'color 0.3s ease',
        }}
      >
        {label}
      </div>

      {/* Description */}
      {description && (
        <div
          className="nm-body"
          style={{
            fontSize: 13,
            color: '#6b7280',
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      )}

      <style>
        {`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes popIn {
            0% {
              transform: scale(0) rotate(-180deg);
              opacity: 0;
            }
            50% {
              transform: scale(1.2) rotate(10deg);
            }
            100% {
              transform: scale(1) rotate(0deg);
              opacity: 1;
            }
          }

          @keyframes ripple {
            0% {
              transform: scale(0.95);
              opacity: 0.6;
            }
            100% {
              transform: scale(1.1);
              opacity: 0;
            }
          }

          @keyframes bounce {
            0%, 100% {
              transform: translateY(0) scale(1);
            }
            25% {
              transform: translateY(-8px) scale(1.05);
            }
            50% {
              transform: translateY(0) scale(1);
            }
            75% {
              transform: translateY(-4px) scale(1.02);
            }
          }
        `}
      </style>
    </button>
  );
}
