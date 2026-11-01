import React from 'react';
import { PRODUCT_COLORS } from '../constants/sequence';
import { ProductColor } from '../types';
import { Check } from 'lucide-react';

interface ColorSelectorProps {
  selectedColor: ProductColor;
  onSelectColor: (color: ProductColor) => void;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({
  selectedColor,
  onSelectColor,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-white/50">
          Color Finish
        </span>
        <span className="text-xs font-mono font-medium text-[#A9C8FF]">
          {selectedColor.name}
        </span>
      </div>

      <div className="flex items-center space-x-3">
        {PRODUCT_COLORS.map((color) => {
          const isSelected = selectedColor.id === color.id;
          return (
            <button
              key={color.id}
              onClick={() => onSelectColor(color)}
              type="button"
              className={`relative group w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center ${
                isSelected
                  ? 'ring-2 ring-[#A9C8FF] ring-offset-2 ring-offset-[#0B0B0C] scale-105'
                  : 'hover:scale-105 hover:ring-1 hover:ring-white/40'
              }`}
              aria-label={`Select ${color.name}`}
            >
              <span
                className="w-8 h-8 rounded-full border border-black/20 flex items-center justify-center shadow-inner"
                style={{ backgroundColor: color.hex }}
              >
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 ${
                      color.id === 'white' || color.id === 'beige'
                        ? 'text-black'
                        : 'text-white'
                    }`}
                  />
                )}
              </span>

              {/* Tooltip on hover */}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-white/10 backdrop-blur-md text-[10px] font-mono tracking-wider text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {color.name}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-white/40 italic font-light pt-1">
        {selectedColor.description}
      </p>
    </div>
  );
};
