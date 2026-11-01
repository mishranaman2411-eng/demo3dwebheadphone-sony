import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { CinematicScroller } from './components/CinematicScroller';
import { SpecsSection } from './components/SpecsSection';
import { PurchaseSection } from './components/PurchaseSection';
import { Footer } from './components/Footer';
import { ambientAudio } from './utils/audio';

export default function App() {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const handleToggleAudio = () => {
    const nextState = ambientAudio.toggle();
    setIsAudioPlaying(nextState);
  };

  const handleNavigateToBuy = () => {
    const el = document.getElementById('purchase-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-[#0B0B0C] text-[#EDEDED] font-sans selection:bg-[#A9C8FF]/20 selection:text-white">
      {/* Universal Fixed Navigation with Dynamic Theme Adaptation */}
      <Navbar
        activeChapterIndex={activeChapterIndex}
        chapterProgress={chapterProgress}
        onNavigateToBuy={handleNavigateToBuy}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={handleToggleAudio}
      />

      {/* Main Cinematic Scrollytelling Film */}
      <main>
        <CinematicScroller
          activeChapterIndex={activeChapterIndex}
          onActiveChapterChange={setActiveChapterIndex}
          onProgressChange={setChapterProgress}
        />

        {/* Purchase & Order Configuration Section */}
        <PurchaseSection />

        {/* In-Depth Technical Engineering Specifications */}
        <SpecsSection />
      </main>

      {/* Luxury Brand Footer */}
      <Footer />
    </div>
  );
}
