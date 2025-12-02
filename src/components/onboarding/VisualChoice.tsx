import type { ReactNode } from 'react';

interface VisualChoiceOption {
  id: string;
  label: string;
  icon?: ReactNode;
  imageUrl?: string;
  description?: string;
}

interface VisualChoiceProps {
  options: VisualChoiceOption[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  multiSelect?: boolean;
  columns?: number;
}

export function VisualChoice({
  options,
  selectedIds,
  onSelect,
  multiSelect = false,
  columns = 2,
}: VisualChoiceProps) {
  const handleClick = (id: string) => {
    if (multiSelect) {
      if (selectedIds.includes(id)) {
        onSelect(selectedIds.filter((selectedId) => selectedId !== id));
      } else {
        onSelect([...selectedIds, id]);
      }
    } else {
      onSelect([id]);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 16,
      }}
    >
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id);

        return (
          <button
            key={option.id}
            onClick={() => handleClick(option.id)}
            style={{
              position: 'relative',
              padding: 20,
              borderRadius: 18,
              border: isSelected ? '2px solid #6366f1' : '2px solid transparent',
              background: isSelected
                ? 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)'
                : 'rgba(255,255,255,0.7)',
              boxShadow: isSelected
                ? '0 4px 12px rgba(99,102,241,0.2), inset 0 1px 3px rgba(99,102,241,0.1)'
                : '4px 4px 10px rgba(148,163,184,0.15), -4px -4px 10px rgba(255,255,255,0.8)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow =
                  '6px 6px 14px rgba(148,163,184,0.2), -6px -6px 14px rgba(255,255,255,0.9)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '4px 4px 10px rgba(148,163,184,0.15), -4px -4px 10px rgba(255,255,255,0.8)';
              }
            }}
          >
            {/* Checkmark for selected */}
            {isSelected && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 'bold',
                }}
              >
                ✓
              </div>
            )}

            {/* Icon or Image */}
            {option.imageUrl && (
              <div
                style={{
                  width: '100%',
                  height: 120,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: 'hidden',
                  background: `url(${option.imageUrl}) center/cover`,
                }}
              />
            )}

            {option.icon && (
              <div
                style={{
                  fontSize: 40,
                  marginBottom: 12,
                  opacity: isSelected ? 1 : 0.7,
                  transition: 'opacity 0.3s',
                }}
              >
                {option.icon}
              </div>
            )}

            {/* Label */}
            <div
              className="nm-body"
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: isSelected ? '#4f46e5' : '#1f2937',
                marginBottom: option.description ? 6 : 0,
              }}
            >
              {option.label}
            </div>

            {/* Description */}
            {option.description && (
              <div
                className="nm-body"
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                  lineHeight: 1.4,
                }}
              >
                {option.description}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
