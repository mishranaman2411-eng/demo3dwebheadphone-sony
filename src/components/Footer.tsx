import React from 'react';
import { ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#070708] border-t border-white/[0.06] text-[#8E8E93] text-xs py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xl font-bold tracking-widest text-white/90">
              SONY
            </span>
            <p className="text-white/40 max-w-sm">
              Sony Electronics Inc. • Audio Technology Division
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white transition-colors text-xs font-mono"
          >
            <span>Back to Film Beginning</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Legal & Trademark notices */}
        <div className="pt-8 border-t border-white/[0.04] space-y-3 text-[11px] leading-relaxed text-white/40">
          <p>
            * Battery life is based on tests conducted using continuous music playback with AAC codec at 50% volume. Actual performance may vary depending on settings, environmental conditions, and usage.
          </p>
          <p>
            * Bluetooth® word mark and logos are registered trademarks owned by Bluetooth SIG, Inc. and any use of such marks by Sony Group Corporation is under license.
          </p>
          <p>
            * DSEE (Digital Sound Enhancement Engine) and 360 Reality Audio are trademarks of Sony Corporation. Requires Sony | Headphones Connect app for personalization.
          </p>
          <p className="pt-4 text-white/30">
            © 2026 Sony Electronics Inc. All rights reserved. Designed for excellence.
          </p>
        </div>
      </div>
    </footer>
  );
};
