import React from 'react';

interface BackgroundSystemProps {
  isDarkMode: boolean;
  isChatMode: boolean;
  isLoggedIn: boolean;
}

export const BackgroundSystem: React.FC<BackgroundSystemProps> = ({
  isDarkMode,
  isChatMode,
  isLoggedIn,
}) => {
  // Animation keyframes styles
  const keyframeStyles = `
    @keyframes fadeBlueGradient {
      0% { opacity: 1; transform: scale(1); }
      20% { opacity: 0.8; transform: scale(0.98); }
      50% { opacity: 0.4; transform: scale(0.95); }
      80% { opacity: 0.1; transform: scale(0.92); }
      100% { opacity: 0; transform: scale(0.9); }
    }
    @keyframes fadePlumGradient {
      0% { opacity: 1; transform: scale(1); }
      20% { opacity: 0.8; transform: scale(0.98); }
      50% { opacity: 0.4; transform: scale(0.95); }
      80% { opacity: 0.1; transform: scale(0.92); }
      100% { opacity: 0; transform: scale(0.9); }
    }
    @keyframes fadeToWhite {
      0% { opacity: 0; transform: scale(1.02); }
      30% { opacity: 0.3; transform: scale(1.01); }
      60% { opacity: 0.7; transform: scale(1.005); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes fadeToPlum {
      0% { opacity: 0; transform: scale(1.02); }
      30% { opacity: 0.3; transform: scale(1.01); }
      60% { opacity: 0.7; transform: scale(1.005); }
      100% { opacity: 1; transform: scale(1); }
    }
  `;

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden">
      <style>{keyframeStyles}</style>
      
      {(!isLoggedIn || !isChatMode) ? (
        !isDarkMode ? (
          /* Light Mode Dashboard Gradients */
          <>
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: '#f8faff' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 160% 120% at 75% 45%, rgba(67, 166, 216, 0.22) 0%, rgba(129, 200, 228, 0.28) 20%, rgba(67, 166, 216, 0.35) 40%, rgba(129, 200, 228, 0.42) 60%, rgba(91, 184, 247, 0.18) 80%, transparent 90%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 140% 85% at 45% 15%, rgba(240, 248, 255, 0.8) 0%, rgba(232, 244, 255, 0.65) 15%, rgba(224, 240, 255, 0.5) 35%, rgba(208, 230, 255, 0.3) 55%, transparent 75%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 110% 140% at 20% 90%, rgba(248, 252, 255, 0.9) 0%, rgba(240, 248, 255, 0.75) 12%, rgba(232, 244, 255, 0.6) 25%, rgba(224, 240, 255, 0.45) 40%, rgba(200, 228, 255, 0.25) 60%, transparent 80%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 95% 120% at 10% 50%, rgba(255, 255, 255, 0.95) 0%, rgba(252, 254, 255, 0.8) 18%, rgba(248, 252, 255, 0.65) 32%, rgba(240, 248, 255, 0.4) 50%, transparent 70%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 100% 130% at 90% 20%, rgba(240, 248, 255, 0.9) 0%, rgba(67, 166, 216, 0.28) 20%, rgba(129, 200, 228, 0.35) 40%, rgba(67, 166, 216, 0.42) 55%, rgba(91, 184, 247, 0.25) 70%, transparent 85%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 80% 110% at 50% 35%, rgba(252, 254, 255, 0.95) 0%, rgba(240, 248, 255, 0.75) 20%, rgba(232, 244, 255, 0.6) 40%, rgba(220, 238, 255, 0.35) 60%, transparent 80%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 248, 255, 0.65) 20%, rgba(232, 244, 255, 0.5) 40%, rgba(67, 166, 216, 0.18) 65%, rgba(129, 200, 228, 0.12) 80%, rgba(91, 184, 247, 0.08) 100%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'conic-gradient(from 35deg at 65% 35%, rgba(240, 248, 255, 0.9) 0deg, rgba(255, 255, 255, 0.7) 80deg, rgba(252, 254, 255, 0.8) 160deg, rgba(232, 244, 255, 0.6) 240deg, rgba(240, 248, 255, 0.9) 320deg, rgba(240, 248, 255, 0.9) 360deg)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 130% 90% at 35% 100%, rgba(248, 252, 255, 0.85) 0%, rgba(240, 248, 255, 0.7) 12%, rgba(67, 166, 216, 0.08) 20%, rgba(129, 200, 228, 0.06) 35%, transparent 60%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 160% 140% at 55% 45%, transparent 0%, rgba(255, 255, 255, 0.4) 30%, rgba(240, 248, 255, 0.3) 60%, rgba(252, 254, 255, 0.5) 85%, rgba(248, 252, 255, 0.2) 100%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 90% 160% at 25% 25%, rgba(67, 166, 216, 0.08) 0%, rgba(129, 200, 228, 0.12) 25%, rgba(200, 228, 255, 0.06) 50%, transparent 75%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 120% 100% at 85% 85%, rgba(240, 248, 255, 0.6) 0%, rgba(232, 244, 255, 0.4) 20%, rgba(67, 166, 216, 0.08) 40%, transparent 70%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 70% 120% at 60% 60%, rgba(129, 200, 228, 0.15) 0%, rgba(91, 184, 247, 0.12) 30%, rgba(67, 166, 216, 0.08) 60%, transparent 80%)', animation: !isChatMode ? 'none' : 'fadeBlueGradient 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) forwards' }} />
          </>
        ) : (
          /* Dark Mode Dashboard Gradients */
          <>
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: '#0f0b12' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(15, 11, 18, 0.8) 70%, rgba(15, 11, 18, 1) 100%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 160% 140% at 70% 50%, rgba(20,12,24,0.95) 0%, rgba(32,18,40,0.85) 28%, rgba(86,54,106,0.22) 55%, rgba(124,86,153,0.12) 72%, transparent 88%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 120% 100% at 30% 25%, rgba(22,14,28,0.98) 0%, rgba(34,20,44,0.85) 24%, rgba(98,64,126,0.14) 48%, transparent 72%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 110% 120% at 18% 82%, rgba(18,12,20,0.96) 0%, rgba(28,18,34,0.82) 18%, rgba(145,102,76,0.12) 36%, transparent 64%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 80% 100% at 60% 40%, rgba(18,12,24,0.98) 0%, rgba(32,20,42,0.82) 22%, rgba(200,169,81,0.08) 46%, transparent 68%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'radial-gradient(ellipse 90% 110% at 82% 18%, rgba(24,16,30,0.96) 0%, rgba(86,54,106,0.16) 28%, rgba(124,86,153,0.12) 52%, rgba(200,169,81,0.07) 68%, transparent 84%)' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-700 ease-out" style={{ background: 'linear-gradient(125deg, rgba(15,11,18,0.92) 0%, rgba(26,18,34,0.84) 26%, rgba(34,22,44,0.78) 52%, rgba(124,86,153,0.10) 74%, rgba(200,169,81,0.08) 100%)', animation: !isChatMode ? 'none' : 'fadePlumGradient 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) forwards' }} />
          </>
        )
      ) : (
        !isDarkMode ? (
          /* Light Mode Chat State */
          <>
            <div className="absolute inset-0 h-full w-full transition-all duration-1200 ease-out" style={{ background: '#fcfeff', animation: isChatMode ? 'fadeToWhite 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) forwards' : 'none' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-1200 ease-out" style={{ background: 'linear-gradient(180deg, rgba(252, 254, 255, 0.9) 0%, rgba(255, 255, 255, 1) 100%)', animation: isChatMode ? 'fadeToWhite 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) forwards' : 'none' }} />
          </>
        ) : (
          /* Dark Mode Chat State */
          <>
            <div className="absolute inset-0 h-full w-full transition-all duration-1200 ease-out" style={{ background: '#0f0b12', animation: isChatMode ? 'fadeToPlum 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) forwards' : 'none' }} />
            <div className="absolute inset-0 h-full w-full transition-all duration-1200 ease-out" style={{ background: 'linear-gradient(180deg, rgba(15, 11, 18, 0.9) 0%, rgba(15, 11, 18, 1) 100%)', animation: isChatMode ? 'fadeToPlum 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) forwards' : 'none' }} />
          </>
        )
      )}
    </div>
  );
};