import { useState, useEffect } from 'react';
import { OnboardingContainer } from './OnboardingContainer';
import { OnboardingCard } from './OnboardingCard';
import { VisualChoice } from './VisualChoice';
import { ConfettiCelebration } from './ConfettiCelebration';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface NurseOnboardingProps {
  onComplete: () => void;
  onClose?: () => void;
}

export function NurseOnboarding({ onComplete, onClose }: NurseOnboardingProps) {
  const { user } = useAuthStore();

  console.log('🎓 NurseOnboarding rendered!');

  const handleComplete = async (data: Record<string, any>) => {
    if (!user) return;

    // Update profile with onboarding data
    const updates: any = {};

    if (data.preferredCities?.length > 0) {
      updates.preferredCities = data.preferredCities;
    }

    if (data.specialties?.length > 0) {
      updates.specialties = data.specialties;
    }

    if (data.bio) {
      updates.bio = data.bio;
    }

    if (Object.keys(updates).length > 0) {
      const result = await authService.updateProfile(user.id, updates);
      if (!result.success) {
        toast.error('Failed to save profile');
        return;
      }
    }

    toast.success('Profile completed! 🎉');
    onComplete();
  };

  const steps = [
    {
      id: 'welcome',
      component: ({ isActive, onNext }: any) => (
        <WelcomeStep isActive={isActive} onNext={onNext} />
      ),
    },
    {
      id: 'destination',
      component: ({ isActive, onNext, onSkip }: any) => (
        <DestinationStep isActive={isActive} onNext={onNext} onSkip={onSkip} />
      ),
    },
    {
      id: 'vibe',
      component: ({ isActive, onNext, onSkip }: any) => (
        <VibeStep isActive={isActive} onNext={onNext} onSkip={onSkip} />
      ),
    },
    {
      id: 'space',
      component: ({ isActive, onNext, onSkip }: any) => (
        <SpaceStep isActive={isActive} onNext={onNext} onSkip={onSkip} />
      ),
    },
    {
      id: 'specialties',
      component: ({ isActive, onNext, onSkip }: any) => (
        <SpecialtiesStep isActive={isActive} onNext={onNext} onSkip={onSkip} />
      ),
    },
    {
      id: 'complete',
      component: ({ isActive, onNext }: any) => (
        <CompleteStep isActive={isActive} onNext={onNext} />
      ),
    },
  ];

  return <OnboardingContainer steps={steps} onComplete={handleComplete} onClose={onClose} />;
}

// Step 1: Welcome
function WelcomeStep({ isActive, onNext }: any) {
  const { profile } = useAuthStore();

  return (
    <OnboardingCard isActive={isActive} onNext={() => onNext({})} nextLabel="Let's go! 🚀">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
        <h2 className="nm-heading-lg" style={{ fontSize: 28, marginBottom: 12 }}>
          Welcome to NightShift, {profile?.name?.split(' ')[0]}!
        </h2>
        <p className="nm-body" style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
          Let's find your perfect home away from home. We'll ask a few quick questions to help match you with
          the best places for your next assignment.
        </p>
        <p className="nm-body" style={{ fontSize: 14, color: '#9ca3af', fontStyle: 'italic' }}>
          This will only take 2 minutes, and you can skip any question.
        </p>
      </div>
    </OnboardingCard>
  );
}

// Step 2: Destination
function DestinationStep({ isActive, onNext, onSkip }: any) {
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const popularCities = [
    { id: 'seattle', label: 'Seattle, WA', icon: '🌲' },
    { id: 'austin', label: 'Austin, TX', icon: '🎸' },
    { id: 'denver', label: 'Denver, CO', icon: '⛰️' },
    { id: 'portland', label: 'Portland, OR', icon: '🌹' },
    { id: 'phoenix', label: 'Phoenix, AZ', icon: '🌵' },
    { id: 'nashville', label: 'Nashville, TN', icon: '🎵' },
  ];

  return (
    <OnboardingCard
      isActive={isActive}
      onNext={() => onNext({ preferredCities: selectedCities })}
      onSkip={onSkip}
      showSkip={true}
      nextLabel="Continue"
    >
      <div>
        <h3 className="nm-heading-lg" style={{ fontSize: 22, marginBottom: 8 }}>
          Where are you headed?
        </h3>
        <p className="nm-body" style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
          Select the cities you're interested in for your next assignment. We'll show you the best places
          there.
        </p>

        <VisualChoice
          options={popularCities}
          selectedIds={selectedCities}
          onSelect={setSelectedCities}
          multiSelect={true}
          columns={2}
        />
      </div>
    </OnboardingCard>
  );
}

// Step 3: Vibe
function VibeStep({ isActive, onNext, onSkip }: any) {
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  const vibes = [
    {
      id: 'budget',
      label: 'Budget-Friendly',
      icon: '💰',
      description: 'Best value for your money',
    },
    {
      id: 'close',
      label: 'Near Hospital',
      icon: '🏥',
      description: 'Short commute to work',
    },
    {
      id: 'quiet',
      label: 'Quiet & Peaceful',
      icon: '🌙',
      description: 'Rest after long shifts',
    },
    {
      id: 'social',
      label: 'Social Scene',
      icon: '🎉',
      description: 'Meet other nurses',
    },
  ];

  return (
    <OnboardingCard
      isActive={isActive}
      onNext={() => onNext({ vibes: selectedVibes })}
      onSkip={onSkip}
      showSkip={true}
    >
      <div>
        <h3 className="nm-heading-lg" style={{ fontSize: 22, marginBottom: 8 }}>
          What's your vibe?
        </h3>
        <p className="nm-body" style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
          Help us understand what matters most to you. Pick as many as you like!
        </p>

        <VisualChoice
          options={vibes}
          selectedIds={selectedVibes}
          onSelect={setSelectedVibes}
          multiSelect={true}
          columns={2}
        />
      </div>
    </OnboardingCard>
  );
}

// Step 4: Perfect Space
function SpaceStep({ isActive, onNext, onSkip }: any) {
  const [selectedSpace, setSelectedSpace] = useState<string[]>([]);

  const spaces = [
    {
      id: 'private-room',
      label: 'Private Room',
      icon: '🚪',
      description: 'Your own bedroom, shared common areas',
    },
    {
      id: 'entire-place',
      label: 'Entire Place',
      icon: '🏠',
      description: 'The whole space to yourself',
    },
    {
      id: 'shared',
      label: 'Shared Room',
      icon: '🛏️',
      description: 'Budget-friendly shared bedroom',
    },
  ];

  return (
    <OnboardingCard
      isActive={isActive}
      onNext={() => onNext({ preferredRoomTypes: selectedSpace })}
      onSkip={onSkip}
      showSkip={true}
    >
      <div>
        <h3 className="nm-heading-lg" style={{ fontSize: 22, marginBottom: 8 }}>
          Your perfect space
        </h3>
        <p className="nm-body" style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
          Imagine walking in after a long shift. What type of space feels like home?
        </p>

        <VisualChoice
          options={spaces}
          selectedIds={selectedSpace}
          onSelect={setSelectedSpace}
          multiSelect={true}
          columns={1}
        />
      </div>
    </OnboardingCard>
  );
}

// Step 5: Specialties (Optional)
function SpecialtiesStep({ isActive, onNext, onSkip }: any) {
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const specialties = [
    { id: 'er', label: 'Emergency', icon: '🚑' },
    { id: 'icu', label: 'ICU', icon: '💉' },
    { id: 'med-surg', label: 'Med-Surg', icon: '🏥' },
    { id: 'picu', label: 'PICU', icon: '👶' },
    { id: 'or', label: 'Operating Room', icon: '⚕️' },
    { id: 'labor', label: 'Labor & Delivery', icon: '👶' },
  ];

  return (
    <OnboardingCard
      isActive={isActive}
      onNext={() => onNext({ specialties: selectedSpecialties })}
      onSkip={onSkip}
      showSkip={true}
    >
      <div>
        <h3 className="nm-heading-lg" style={{ fontSize: 22, marginBottom: 8 }}>
          What's your specialty?
        </h3>
        <p className="nm-body" style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
          This helps us connect you with hosts who understand your schedule.
        </p>

        <VisualChoice
          options={specialties}
          selectedIds={selectedSpecialties}
          onSelect={setSelectedSpecialties}
          multiSelect={true}
          columns={2}
        />
      </div>
    </OnboardingCard>
  );
}

// Step 6: Complete
function CompleteStep({ isActive, onNext }: any) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowConfetti(true);
    }
  }, [isActive]);

  return (
    <OnboardingCard isActive={isActive} onNext={() => onNext({})} nextLabel="Start exploring! 🎉" isLastStep>
      {showConfetti && <ConfettiCelebration />}

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 64,
            marginBottom: 16,
            animation: 'celebrate 1s ease-in-out',
          }}
        >
          ✨
        </div>

        <style>
          {`
            @keyframes celebrate {
              0% {
                transform: scale(0) rotate(-180deg);
                opacity: 0;
              }
              50% {
                transform: scale(1.3) rotate(10deg);
              }
              100% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
              }
            }
          `}
        </style>
        <h2 className="nm-heading-lg" style={{ fontSize: 28, marginBottom: 12 }}>
          You're all set!
        </h2>
        <p className="nm-body" style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.6, marginBottom: 32 }}>
          Your profile is ready! Start browsing amazing places from verified hosts who understand the travel
          nurse lifestyle.
        </p>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <p className="nm-body" style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
            <strong style={{ color: '#4f46e5' }}>Pro tip:</strong> Complete your profile with a photo to get
            50% more responses from hosts!
          </p>
        </div>
      </div>
    </OnboardingCard>
  );
}
