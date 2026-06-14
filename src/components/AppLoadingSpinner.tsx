import React from 'react';
import { motion } from 'motion/react';

export function AppLoadingSpinner() {
  return (
    <div id="loading" className="fixed inset-0 bg-neutral-950 flex flex-col items-center justify-center z-50 select-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center space-y-6 max-w-sm px-4"
      >
        {/* Circular Spoke-Gradient Spinner matching the image */}
        <div id="spinner-container" className="relative w-24 h-24 flex items-center justify-center">
          <svg
            id="spinner-svg"
            className="w-full h-full animate-spin"
            viewBox="0 0 100 100"
            style={{ animationDuration: '1.2s', animationTimingFunction: 'linear' }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const rotate = i * 30;
              // Match the colors perfectly to the image: going from pure/white cyan around one side to rich bright turquoise and slightly deeper teal.
              const spokeColors = [
                '#e0fcfc', // 0 deg (12 o'clock)
                '#b5fcf9', // 30 deg
                '#9bfbf6', // 60 deg
                '#75fcf3', // 90 deg (3 o'clock)
                '#53f9ee', // 120 deg
                '#31f3e4', // 150 deg
                '#1ee7d7', // 180 deg (6 o'clock)
                '#12cfbe', // 210 deg
                '#11baa9', // 240 deg
                '#0ca595', // 270 deg (9 o'clock)
                '#0c8e80', // 300 deg
                '#0d766a', // 330 deg
              ];
              
              return (
                <rect
                  id={`spoke-${i}`}
                  key={i}
                  x="46"
                  y="10"
                  width="8"
                  height="24"
                  rx="4"
                  transform={`rotate(${rotate} 50 50)`}
                  fill={spokeColors[i]}
                />
              );
            })}
          </svg>
        </div>
        
        <div id="loader-labels" className="text-center space-y-1.5">
          <h1 id="loader-title" className="text-xl font-semibold text-white tracking-tight font-sans">ImmoManage</h1>
          <p id="loader-subtitle" className="text-neutral-500 text-xs font-mono tracking-widest uppercase animate-pulse">Chargement en cours...</p>
        </div>
      </motion.div>
    </div>
  );
}
