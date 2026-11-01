import React, { useState } from 'react';
import { ColorSelector } from './ColorSelector';
import { PRODUCT_COLORS } from '../constants/sequence';
import { ProductColor } from '../types';
import { ShoppingBag, Truck, RotateCcw, ShieldCheck, Check, ExternalLink } from 'lucide-react';

export const PurchaseSection: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState<ProductColor>(PRODUCT_COLORS[0]);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const price = 59.99;
  const totalPrice = (price * quantity).toFixed(2);

  const handleAddToCart = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 3000);
  };

  return (
    <section
      id="purchase-section"
      className="relative min-h-screen py-24 bg-[#0B0B0C] border-t border-white/[0.08] text-[#EDEDED] flex items-center"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0B0B0C] to-[#0B0B0C] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Product Visual Showcase */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative w-full aspect-[4/3] rounded-3xl bg-[#141416] border border-white/[0.06] overflow-hidden flex flex-col items-center justify-center p-8 group">
              {/* Product preview image / render */}
              <img
                src="/previews/10_start.jpg"
                alt={`Sony WH-CH520 in ${selectedColor.name}`}
                className="w-full h-full object-contain filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-transform duration-700 group-hover:scale-105"
              />

              {/* Color Finish Tag */}
              <div className="absolute top-6 left-6 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-white/80">
                WH-CH520 • {selectedColor.name}
              </div>

              {/* Floating Feature Pills */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/70">
                  50h Battery
                </span>
                <span className="px-3 py-1 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/70">
                  DSEE Sound
                </span>
                <span className="px-3 py-1 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/70">
                  Bluetooth® 5.2 Multipoint
                </span>
                <span className="px-3 py-1 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/70">
                  147g Lightweight
                </span>
              </div>
            </div>

            {/* In the Box Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 pt-2">
              <div className="p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center space-y-1">
                <p className="text-[10px] sm:text-[11px] font-mono uppercase text-white/40">Included</p>
                <p className="text-xs font-medium text-white/90">Sony WH-CH520</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center space-y-1">
                <p className="text-[10px] sm:text-[11px] font-mono uppercase text-white/40">Included</p>
                <p className="text-xs font-medium text-white/90">USB-C Cable</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center space-y-1">
                <p className="text-[10px] sm:text-[11px] font-mono uppercase text-white/40">Included</p>
                <p className="text-xs font-medium text-white/90">Reference Guide</p>
              </div>
            </div>
          </div>

          {/* Right Column: Purchasing Configuration */}
          <div className="lg:col-span-5 space-y-8">
            {/* Title & Authentic Pricing */}
            <div className="space-y-2 border-b border-white/[0.06] pb-6">
              <span className="text-xs font-mono uppercase tracking-widest text-[#A9C8FF]">
                Official Sony Store
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase text-white">
                Sony WH-CH520
              </h1>
              <p className="text-xs font-mono text-white/50">
                Wireless On-Ear Headphones with DSEE & Multipoint
              </p>

              <div className="pt-4 flex items-baseline space-x-3">
                <span className="text-3xl font-bold font-mono tracking-tight text-white">
                  ${price}
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-white/40">
                  USD MSRP
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  In Stock
                </span>
              </div>
            </div>

            {/* Color Finish Picker */}
            <ColorSelector
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
            />

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/50 block">
                Quantity
              </label>
              <div className="inline-flex items-center rounded-xl bg-white/[0.04] border border-white/[0.08] p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-12 text-center text-sm font-mono font-semibold text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(5, q + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-4 rounded-xl bg-white text-[#0B0B0C] hover:bg-[#A9C8FF] hover:text-[#0B0B0C] transition-all font-semibold text-sm tracking-wider uppercase flex items-center justify-center space-x-2 shadow-lg shadow-white/5 active:scale-[0.99]"
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Added to Bag (${totalPrice})</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag • ${totalPrice}</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://www.sony.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-center text-white/80 hover:text-white transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>Sony Retail</span>
                  <ExternalLink className="w-3 h-3 text-white/40" />
                </a>
                <a
                  href="https://www.amazon.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-center text-white/80 hover:text-white transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>Find a Dealer</span>
                  <ExternalLink className="w-3 h-3 text-white/40" />
                </a>
              </div>
            </div>

            {/* Service & Guarantee Badges */}
            <div className="pt-4 space-y-3 border-t border-white/[0.06] text-xs text-white/60">
              <div className="flex items-center space-x-3">
                <Truck className="w-4 h-4 text-[#A9C8FF] flex-shrink-0" />
                <span>Complimentary expedited shipping on all orders</span>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="w-4 h-4 text-[#A9C8FF] flex-shrink-0" />
                <span>30-Day risk-free trial and hassle-free returns</span>
              </div>
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-4 h-4 text-[#A9C8FF] flex-shrink-0" />
                <span>1-Year Sony official manufacturer limited warranty</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
