import React from 'react';
import { ExternalLink, Globe, Phone, Sparkles } from 'lucide-react';

export interface FloatingSupportFooterProps {
  position?: 'bottom-right' | 'bottom-left';
  showHelpline?: boolean;
  helplineName?: string;
  helplineNumber?: string;
  partnerUrl?: string;
}

export const FloatingSupportFooter: React.FC<FloatingSupportFooterProps> = ({
  position = 'bottom-right',
  showHelpline = true,
  helplineName = 'Sriram Hariharan',
  helplineNumber = '+91 98407 27309',
  partnerUrl = 'https://www.atribsglobal.com/',
}) => {
  const desktopPositionClasses =
    position === 'bottom-left'
      ? 'sm:left-4 sm:right-auto md:left-6'
      : 'sm:right-4 sm:left-auto md:right-6';

  return (
    <aside
      aria-label="Digital Support by Atribs"
      className={`fixed bottom-2.5 left-2 right-2 sm:left-auto sm:right-4 md:right-6 sm:bottom-4 md:bottom-5 z-50 mx-auto max-w-fit sm:max-w-none select-none rounded-2xl border border-blue-400/40 bg-[#061e3d]/95 p-1 sm:p-1.5 text-white shadow-2xl shadow-[#061e3d]/60 backdrop-blur-md transition-all duration-300 ${desktopPositionClasses} print:hidden`}
    >
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {showHelpline && (
          <>
            <a
              href={`tel:${helplineNumber.replace(/\s+/g, '')}`}
              className="group flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-white hover:text-[#061e3d] active:scale-95 sm:px-3 sm:py-2"
              title={`Call Digital Helpline: ${helplineName} (${helplineNumber})`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400 group-hover:bg-[#061e3d]"></span>
              </span>
              <Phone className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:rotate-12" />
              <span className="hidden md:inline text-blue-200 font-normal">Support:</span>
              <span className="whitespace-nowrap font-mono text-[11px] sm:text-xs font-bold tracking-tight">{helplineNumber}</span>
            </a>

            <div className="h-5 sm:h-6 w-px bg-white/20 shrink-0" />
          </>
        )}

        {/* Digital Support by Atribs Badge */}
        <a
          href={partnerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1.5 rounded-xl px-2 py-1 transition-all hover:bg-white/10 sm:gap-2 sm:px-2.5 sm:py-1.5"
          title="Digital Support by Atribs - Cloud & Enterprise Solutions"
        >
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-blue-500/20 text-cyan-300 shadow-xs transition-colors group-hover:bg-white group-hover:text-[#061e3d]">
            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:rotate-45" />
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-cyan-300 leading-none">
                Support by
              </span>
              <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-amber-300 shrink-0" />
            </div>

            <span className="flex items-center gap-1 text-[11px] sm:text-xs font-black tracking-tight text-white transition-colors group-hover:text-cyan-200 leading-tight mt-0.5">
              Atribs
              <span className="hidden lg:inline font-normal text-blue-200 text-[10px]">
                (ATRIBS GLOBAL)
              </span>
              <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-200 transition-transform group-hover:translate-x-0.5 group-hover:text-white shrink-0" />
            </span>
          </div>
        </a>
      </div>
    </aside>
  );
};

