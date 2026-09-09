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
      className={`fixed bottom-0 left-0 right-0 z-50 w-full select-none border-t border-blue-800/50 bg-[#061e3d]/95 px-3 py-2 text-white shadow-2xl backdrop-blur-md transition-all duration-300 sm:bottom-4 ${desktopPositionClasses} sm:w-auto sm:rounded-2xl sm:border sm:border-blue-400/40 sm:bg-[#061e3d] sm:p-1.5 sm:shadow-2xl sm:shadow-[#061e3d]/60 md:bottom-5 print:hidden`}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 sm:max-w-none sm:justify-start">
        {showHelpline && (
          <>
            <a
              href={`tel:${helplineNumber.replace(/\s+/g, '')}`}
              className="group flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-white hover:text-[#061e3d] active:scale-95 sm:px-3 sm:py-2"
              title={`Call Digital Helpline: ${helplineName} (${helplineNumber})`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400 group-hover:bg-[#061e3d]"></span>
              </span>
              <Phone className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
              <span className="hidden xs:inline sm:inline">Support:</span>
              <span>{helplineNumber}</span>
            </a>

            <div className="h-6 w-px bg-white/20" />
          </>
        )}

        {/* Digital Support by Atribs Badge */}
        <a
          href={partnerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all hover:bg-white/10 sm:gap-2.5"
          title="Digital Support by Atribs - Cloud & Enterprise Solutions"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-cyan-300 shadow-xs transition-colors group-hover:bg-white group-hover:text-[#061e3d] sm:h-8 sm:w-8">
            <Globe className="h-4 w-4 transition-transform group-hover:rotate-45" />
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-300">
                Digital Support by
              </span>
              <Sparkles className="h-2.5 w-2.5 text-amber-300" />
            </div>

            <span className="flex items-center gap-1 text-xs font-black tracking-tight text-white transition-colors group-hover:text-cyan-200">
              Atribs
              <span className="hidden md:inline font-normal text-blue-200 text-[10px]">
                (ATRIBS GLOBAL)
              </span>
              <ExternalLink className="h-3 w-3 text-blue-200 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
            </span>
          </div>
        </a>
      </div>
    </aside>
  );
};
