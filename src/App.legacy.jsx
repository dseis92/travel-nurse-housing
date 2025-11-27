import React from 'react';
import './index.css';

const filterChips = ['Outline', '3D', 'Baby', 'Avatar'];

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        {/* Main neumorphic phone shell */}
        <div className="bg-white/90 rounded-[40px] shadow-soft p-5 pb-20">
          {/* Top bar */}
          <header className="flex items-center justify-between mb-4">
            <button className="w-9 h-9 rounded-full bg-white/90 shadow-soft flex items-center justify-center active:scale-95 transition-transform">
              <span className="text-sm">‹</span>
            </button>
            <h1 className="text-sm font-medium text-brand-textMuted">Illustration</h1>
            <button className="w-9 h-9 rounded-full bg-white/90 shadow-soft flex items-center justify-center active:scale-95 transition-transform">
              <span className="text-xl">⋯</span>
            </button>
          </header>

          {/* Title + chips */}
          <div className="mb-4 animate-fade-up">
            <h2 className="text-xl font-semibold mb-3">Illustration For You</h2>
            <div className="flex flex-wrap gap-2">
              {filterChips.map((chip, i) => (
                <button
                  key={chip}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    i === 1
                      ? 'bg-brand-purple text-white shadow-soft'
                      : 'bg-white/90 text-brand-textMuted shadow-soft hover:bg-brand-bgTop'
                  } active:scale-95`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Featured purple card */}
          <section className="relative mt-4 mb-6">
            <div
              className="rounded-[30px] text-white px-5 py-6 shadow-soft overflow-hidden animate-fade-up"
              style={{
                background: 'linear-gradient(135deg, #8F63FF, #A682FF)',
              }}
            >
              <p className="text-sm font-medium mb-2">Make Your Illustration</p>
              <p className="text-sm opacity-80 mb-4">
                Lorem ipsum is simply dummy text of the printing and typesetting industry.
              </p>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-teal text-brand-textDark text-xs font-semibold shadow-soft active:scale-95 transition-transform">
                Get Started
              </button>

              {/* Floating mini cards */}
              <div className="absolute -top-3 right-3 flex gap-2">
                <MiniFloatCard color="bg-brand-teal" delay="-1s" />
                <MiniFloatCard color="bg-brand-orange" delay="-0.5s" />
                <MiniFloatCard color="bg-brand-pink" delay="0s" />
              </div>
            </div>
          </section>

          {/* Popular list */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-brand-textMuted">
              Popular Illustration
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <IllustrationCard
                name="Popular Avatar"
                price="Nl.9,000"
                badgeColor="bg-brand-orange"
              />
              <IllustrationCard
                name="Popular Illustration"
                price="Nl.9,000"
                badgeColor="bg-brand-teal"
              />
            </div>
          </section>
        </div>

        {/* Bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}

function IllustrationCard({ name, price, badgeColor }) {
  return (
    <button className="bg-white/90 rounded-[26px] p-3 shadow-soft flex flex-col gap-3 active:scale-95 transition-transform">
      <div className="flex justify-between items-center">
        <div
          className={`w-10 h-10 rounded-2xl ${badgeColor} flex items-center justify-center text-white text-sm font-semibold shadow-soft`}
        >
          A
        </div>
        <div className="w-8 h-8 rounded-2xl bg-brand-purple flex items-center justify-center text-white shadow-soft">
          ⌄
        </div>
      </div>
      <div className="text-left">
        <p className="text-xs font-medium mb-1">{name}</p>
        <p className="text-[11px] text-brand-textMuted">{price}</p>
      </div>
    </button>
  );
}

function MiniFloatCard({ color, delay }) {
  return (
    <div
      className={`w-8 h-8 rounded-2xl ${color} shadow-soft flex items-center justify-center text-[10px]`}
      style={{ animation: `float 3s ease-in-out infinite`, animationDelay: delay }}
    >
      ✦
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="absolute inset-x-6 -bottom-2">
      <div className="bg-white/95 rounded-full shadow-softInner flex items-center justify-between px-6 py-2">
        <NavIcon active>🏠</NavIcon>
        <NavIcon>🔍</NavIcon>
        <div className="relative -mt-8">
          <button
            className="w-14 h-14 rounded-full shadow-soft flex items-center justify-center text-white text-xl active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(to top right, #32E4C2, #8F63FF)',
            }}
          >
            +
          </button>
        </div>
        <NavIcon>❤️</NavIcon>
        <NavIcon>👤</NavIcon>
      </div>
    </nav>
  );
}

function NavIcon({ children, active }) {
  return (
    <button
      className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all active:scale-95 ${
        active
          ? 'bg-brand-purple text-white shadow-soft'
          : 'text-brand-textMuted hover:bg-brand-bgTop'
      }`}
    >
      {children}
    </button>
  );
}

export default App;
