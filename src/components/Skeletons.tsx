import React from 'react';

export function BienCardSkeleton() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-md select-none">
      <div>
        <div className="aspect-[4/3] bg-neutral-800/60 relative overflow-hidden animate-pulse">
          <div className="absolute top-4 right-4 w-16 h-5 bg-neutral-700/50 rounded-full" />
        </div>
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-start gap-2 animate-pulse">
            <div className="h-5 bg-neutral-800 rounded-lg w-2/3" />
            <div className="h-4 bg-neutral-800 rounded-full w-14" />
          </div>
          <div className="h-4 bg-neutral-800/70 rounded-md w-1/3 animate-pulse flex items-center gap-1">
            <div className="w-3.5 h-3.5 bg-neutral-700 rounded-full" />
            <div className="h-3 w-16 bg-neutral-800 rounded" />
          </div>
          <div className="space-y-2 mt-4 animate-pulse">
            <div className="h-3.5 bg-neutral-800/50 rounded-md w-full" />
            <div className="h-3.5 bg-neutral-800/50 rounded-md w-4/5" />
          </div>
          <div className="flex gap-4 mt-4 animate-pulse">
            <div className="h-3 bg-neutral-800 rounded w-10" />
            <div className="h-3 bg-neutral-800 rounded w-10" />
          </div>
        </div>
      </div>
      <div className="px-5 pb-5 pt-4 flex justify-between items-center bg-neutral-900/40 border-t border-neutral-800/40">
        <div className="h-6 bg-neutral-800 rounded-md w-24 animate-pulse" />
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 bg-neutral-800 rounded-xl animate-pulse" />
          <div className="w-8 h-8 bg-neutral-800 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ContratRowSkeleton() {
  return (
    <tr className="border-b border-neutral-800 select-none">
      <td className="px-6 py-4">
        <div className="h-4 bg-neutral-850 rounded-md w-32 animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-neutral-850 rounded-md w-16 animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-neutral-850 rounded-md w-40 animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-neutral-850/60 rounded-md w-24 animate-pulse" />
          <div className="h-3.5 bg-neutral-850/60 rounded-md w-24 animate-pulse" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-neutral-850 rounded-md w-20 animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="h-5 bg-neutral-850/50 rounded-full w-14 animate-pulse" />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-1.5">
          <div className="w-8 h-8 bg-neutral-850/60 rounded-lg animate-pulse" />
          <div className="w-8 h-8 bg-neutral-850/60 rounded-lg animate-pulse" />
          <div className="w-8 h-8 bg-neutral-850/60 rounded-lg animate-pulse" />
          <div className="w-8 h-8 bg-neutral-850/60 rounded-lg animate-pulse" />
        </div>
      </td>
    </tr>
  );
}
