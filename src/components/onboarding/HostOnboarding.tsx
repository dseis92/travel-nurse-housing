import { useState, useEffect } from 'react';
import { OnboardingContainer } from './OnboardingContainer';
import { OnboardingCard } from './OnboardingCard';
import { VisualChoice } from './VisualChoice';
import { ConfettiCelebration } from './ConfettiCelebration';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface HostOnboardingProps {
  onComplete: () => void;
  onClose?: () => void;
}

export function HostOnboarding({ onComplete, onClose }: HostOnboardingProps) {
  const { user } = useAuthStore();

  const handleComplete = async (data: Record<string, any>) => {
    if (!user) return;

    // Update profile with onboarding data
    const updates: any = {};

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

    toast.success('Welcome to NightShift hosting! 🎉');
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
      id: 'why-host',
      component: ({ isActive, onNext }: any) => (
        <WhyHostStep isActive={isActive} onNext={onNext} />
      ),
    },
    {
      id: 'space-type',
      component: ({ isActive, onNext, onSkip }: any) => (
        <SpaceTypeStep isActive={isActive} onNext={onNext} onSkip={onSkip} />
      ),
    },
    {
      id: 'amenities',
      component: ({ isActive, onNext, onSkip }: any) => (
        <AmenitiesStep isActive={isActive} onNext={onNext} onSkip={onSkip} />
      ),
    },
    {
      id: 'hosting-style',
      component: ({ isActive, onNext, onSkip }: any) => (
        <HostingStyleStep isActive={isActive} onNext={onNext} onSkip={onSkip} />
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
    <OnboardingCard isActive={isActive} onNext={() => onNext({})} nextLabel="Let's get started! 🏠">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
        <h2 className="nm-heading-lg" style={{ fontSize: 28, marginBottom: 12 }}>
          Welcome, {profile?.name?.split(' ')[0]}!
        </h2>
        <p className="nm-body" style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
          Let's get your space ready to welcome travel nurses. We'll help you create a listing that stands
          out and attracts great guests.
        </p>
        <p className="nm-body" style={{ fontSize: 14, color: '#9ca3af', fontStyle: 'italic' }}>
          This takes about 3 minutes. You can always come back and add more details later.
        </p>
      </div>
    </OnboardingCard>
  );
}

// Step 2: Why Host
function WhyHostStep({ isActive, onNext }: any) {
  return (
    <OnboardingCard isActive={isActive} onNext={() => onNext({})} nextLabel="Continue">
      <div>
        <h3 className="nm-heading-lg" style={{ fontSize: 22, marginBottom: 8 }}>
          Why travel nurses love NightShift
        </h3>
        <p className="nm-body" style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
          Travel nurses need more than just a place to stay. Here's what makes a great host:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            {
              icon: '🕐',
              title: 'Flexible with schedules',
              description: 'Nurses work 12-hour shifts, nights, and weekends',
            },
            {
              icon: '🤝',
              title: 'Understanding & supportive',
              description: 'They need a peaceful place to decompress',
            },
            {
              icon: '📅',
              title: 'Longer stays',
              description: 'Contracts are typically 13 weeks or more',
            },
            {
              icon: '💰',
              title: 'Reliable income',
              description: 'Professional renters with steady paychecks',
            },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: 16,
                padding: 16,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.6)',
                boxShadow: '2px 2px 8px rgba(148,163,184,0.1), -2px -2px 8px rgba(255,255,255,0.5)',
              }}
            >
              <div style={{ fontSize: 32 }}>{item.icon}</div>
              <div>
                <div className="nm-body" style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  {item.title}
                </div>
                <div className="nm-body" style={{ fontSize: 13, color: '#6b7280' }}>
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </OnboardingCard>
  );
}

// Step 3: Space Type
function SpaceTypeStep({ isActive, onNext, onSkip }: any) {
  const [selectedSpace, setSelectedSpace] = useState<string[]>([]);

  const spaces = [
    {
      id: 'private-room',
      label: 'Private Room',
      icon: '🚪',
      description: 'Own bedroom, shared common areas',
    },
    {
      id: 'entire-place',
      label: 'Entire Place',
      icon: '🏠',
      description: 'Whole apartment or house',
    },
    {
      id: 'studio',
      label: 'Studio/Efficiency',
      icon: '🏢',
      description: 'Self-contained studio space',
    },
  ];

  return (
    <OnboardingCard
      isActive={isActive}
      onNext={() => onNext({ spaceType: selectedSpace[0] })}
      onSkip={onSkip}
      showSkip={true}
    >
      <div>
        <h3 className="nm-heading-lg" style={{ fontSize: 22, marginBottom: 8 }}>
          What are you offering?
        </h3>
        <p className="nm-body" style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
          Tell us about your space. Select the option that best describes what you're renting.
        </p>

        <VisualChoice
          options={spaces}
          selectedIds={selectedSpace}
          onSelect={setSelectedSpace}
          multiSelect={false}
          columns={1}
        />
      </div>
    </OnboardingCard>
  );
}

// Step 4: Amenities
function AmenitiesStep({ isActive, onNext, onSkip }: any) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const amenities = [
    { id: 'parking', label: 'Parking', icon: '🚗' },
    { id: 'wifi', label: 'Fast WiFi', icon: '📶' },
    { id: 'laundry', label: 'Laundry', icon: '🧺' },
    { id: 'kitchen', label: 'Full Kitchen', icon: '🍳' },
    { id: 'workspace', label: 'Desk/Workspace', icon: '💻' },
    { id: 'gym', label: 'Gym Access', icon: '💪' },
    { id: 'pets', label: 'Pet Friendly', icon: '🐕' },
    { id: 'quiet', label: 'Quiet Area', icon: '🤫' },
  ];

  return (
    <OnboardingCard
      isActive={isActive}
      onNext={() => onNext({ amenities: selectedAmenities })}
      onSkip={onSkip}
      showSkip={true}
    >
      <div>
        <h3 className="nm-heading-lg" style={{ fontSize: 22, marginBottom: 8 }}>
          What amenities do you offer?
        </h3>
        <p className="nm-body" style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
          Select all that apply. These help nurses find exactly what they need.
        </p>

        <VisualChoice
          options={amenities}
          selectedIds={selectedAmenities}
          onSelect={setSelectedAmenities}
          multiSelect={true}
          columns={2}
        />
      </div>
    </OnboardingCard>
  );
}

// Step 5: Hosting Style
function HostingStyleStep({ isActive, onNext, onSkip }: any) {
  const [selectedStyle, setSelectedStyle] = useState<string[]>([]);

  const styles = [
    {
      id: 'hands-off',
      label: 'Hands-Off',
      icon: '🔑',
      description: 'Give them space, available if needed',
    },
    {
      id: 'friendly',
      label: 'Friendly & Social',
      icon: '👋',
      description: 'Open to chatting and hanging out',
    },
    {
      id: 'supportive',
      label: 'Supportive Guide',
      icon: '🗺️',
      description: 'Help them settle into the area',
    },
  ];

  return (
    <OnboardingCard
      isActive={isActive}
      onNext={() => onNext({ hostingStyle: selectedStyle[0] })}
      onSkip={onSkip}
      showSkip={true}
    >
      <div>
        <h3 className="nm-heading-lg" style={{ fontSize: 22, marginBottom: 8 }}>
          What's your hosting style?
        </h3>
        <p className="nm-body" style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
          Help nurses know what to expect. There's no wrong answer!
        </p>

        <VisualChoice
          options={styles}
          selectedIds={selectedStyle}
          onSelect={setSelectedStyle}
          multiSelect={false}
          columns={1}
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
    <OnboardingCard
      isActive={isActive}
      onNext={() => onNext({})}
      nextLabel="Go to dashboard 🎉"
      isLastStep
    >
      {showConfetti && <ConfettiCelebration />}

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 64,
            marginBottom: 16,
            animation: 'celebrate 1s ease-in-out',
          }}
        >
          🎉
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
          You're ready to host!
        </h2>
        <p className="nm-body" style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.6, marginBottom: 32 }}>
          Your profile is set up! Next, you'll create your first listing with photos, pricing, and
          availability.
        </p>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.1) 100%)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(16,185,129,0.2)',
            marginBottom: 16,
          }}
        >
          <p className="nm-body" style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            <strong style={{ color: '#059669' }}>💡 Pro tip:</strong>
          </p>
          <p className="nm-body" style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
            Listings with professional photos get 3x more booking requests. Good lighting and clean spaces
            make all the difference!
          </p>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.6)',
            borderRadius: 14,
            padding: 16,
            boxShadow: '2px 2px 8px rgba(148,163,184,0.1)',
          }}
        >
          <p className="nm-body" style={{ fontSize: 13, color: '#6b7280' }}>
            Next: Create your first listing →
          </p>
        </div>
      </div>
    </OnboardingCard>
  );
}
