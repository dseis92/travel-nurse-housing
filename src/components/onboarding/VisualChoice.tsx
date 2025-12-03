import type { ReactNode } from 'react';
import { AnimatedChoiceCard } from './AnimatedChoiceCard';

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
      {options.map((option, index) => {
        const isSelected = selectedIds.includes(option.id);

        return (
          <AnimatedChoiceCard
            key={option.id}
            id={option.id}
            label={option.label}
            icon={option.icon}
            description={option.description}
            isSelected={isSelected}
            onClick={() => handleClick(option.id)}
            animationDelay={index * 50} // Stagger animations
          />
        );
      })}
    </div>
  );
}
