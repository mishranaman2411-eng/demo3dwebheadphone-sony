import React from 'react';
import { BatteryCharging, Music2, Cpu, Bluetooth, Feather, Layers, ShieldCheck } from 'lucide-react';

export const SpecsSection: React.FC = () => {
  const specs = [
    {
      icon: <BatteryCharging className="w-5 h-5 text-[#A9C8FF]" />,
      title: 'Battery & Fast Charge',
      detail: 'Up to 50 hours continuous playback (40 hours talk). A 3-minute quick charge yields up to 1.5 hours of battery.',
    },
    {
      icon: <Cpu className="w-5 h-5 text-[#A9C8FF]" />,
      title: 'DSEE Sound Engine',
      detail: 'Digital Sound Enhancement Engine restores high-frequency harmonics compressed in digital streaming files.',
    },
    {
      icon: <Music2 className="w-5 h-5 text-[#A9C8FF]" />,
      title: '30mm Dynamic Drivers',
      detail: '20 Hz – 20,000 Hz (44.1 kHz sampling). Custom neodymium magnets tuned for vocal clarity and punchy bass response.',
    },
    {
      icon: <Bluetooth className="w-5 h-5 text-[#A9C8FF]" />,
      title: 'Bluetooth® 5.2 Multipoint',
      detail: 'Pair with two Bluetooth devices at once. Seamlessly shifts from your laptop conference call to an incoming smartphone call.',
    },
    {
      icon: <Feather className="w-5 h-5 text-[#A9C8FF]" />,
      title: '147g Featherweight Build',
      detail: 'Engineered for all-day wearability with soft cushioned headband and plush synthetic leather on-ear pads.',
    },
    {
      icon: <Layers className="w-5 h-5 text-[#A9C8FF]" />,
      title: '360 Reality Audio',
      detail: 'Certified 360 Reality Audio reproduces sound as if you were live in the recording studio with the artist.',
    },
  ];

  return (
    <section className="relative py-24 bg-[#0B0B0C] border-t border-white/[0.06] text-[#EDEDED]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#A9C8FF]">
            Engineering Details
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight uppercase text-white mt-2">
            Technical Specifications
          </h2>
          <p className="text-sm md:text-base text-white/60 mt-3">
            Every component in the WH-CH520 has been calibrated to deliver uncompromised wireless performance in an ultra-portable profile.
          </p>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specs.map((item, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors group space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-base font-semibold tracking-wide text-white">
                {item.title}
              </h3>
              <p className="text-xs md:text-sm leading-relaxed text-white/60">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* In the Box Section */}
        <div className="mt-12 sm:mt-16 p-5 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-white">
              What's in the Box
            </h4>
            <p className="text-xs text-white/50 mt-1">
              Sony WH-CH520 Wireless Headphones • USB Type-C® Charging Cable (approx. 20 cm) • Reference Operating Guide
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#A9C8FF]">
            <ShieldCheck className="w-4 h-4 text-[#A9C8FF]" />
            <span>1-Year Official Sony Limited Warranty</span>
          </div>
        </div>
      </div>
    </section>
  );
};
