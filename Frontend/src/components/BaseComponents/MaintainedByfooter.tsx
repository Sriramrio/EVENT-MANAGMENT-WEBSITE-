import React from 'react';
import { ExternalLink, Globe, Phone, Sparkles } from 'lucide-react';

export interface MaintainedByFooterProps {
  showHelpline?: boolean;
  helplineName?: string;
  helplineNumber?: string;
  partnerUrl?: string;
}

export const MaintainedByFooter: React.FC<MaintainedByFooterProps> = ({
  showHelpline = true,
  helplineName = 'Sriram Hariharan',
  helplineNumber = '+91 98407 27309',
  partnerUrl = 'https://www.atribsglobal.com/',
}) => (
  <div className="fixed bottom-4 left-[20px] z-50 w-auto space-y-2 print:hidden">
    {/* 1. DIGITAL PARTNER (TOP) */}
    <a
      href={partnerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/95 p-2.5 shadow-md backdrop-blur-sm transition-all hover:bg-blue-100/90"
      title="Official Digital Partner: ATRIBS GLOBAL"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-msme-blue transition-colors group-hover:bg-blue-200">
          <Globe className="h-4 w-4 transition-transform group-hover:rotate-45" />
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              DIGITAL SUPPORT BY ATRIBS
            </span>
            <Sparkles className="h-2.5 w-2.5 text-amber-500" />
          </div>
          <span className="text-xs font-bold text-msme-blue">
            ATRIBS GLOBAL
          </span>
        </div>
      </div>

      <ExternalLink className="ml-3 h-3.5 w-3.5 text-msme-blue/70 transition-transform group-hover:translate-x-0.5 group-hover:text-msme-blue" />
    </a>

    {/* 2. DIGITAL SUPPORT HELPLINE (BOTTOM) */}
    {showHelpline && (
      <a
        href={`tel:${helplineNumber.replace(/\s+/g, '')}`}
        className="group flex items-center justify-between rounded-xl border border-blue-900/30 bg-[#061e3d] p-2.5 text-white shadow-lg backdrop-blur-md transition-all hover:bg-[#0a2c58] active:scale-[0.99]"
        title={`Digital Support: ${helplineName} (${helplineNumber})`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-cyan-300 transition-colors group-hover:bg-white group-hover:text-[#061e3d]">
            <Phone className="h-4 w-4 transition-transform group-hover:rotate-12" />
          </div>
          <div className="flex flex-col text-left">
            <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-blue-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              </span>
              Digital Support
            </span>
            <span className="text-xs font-black text-white group-hover:text-cyan-200">
              {helplineNumber}
            </span>
          </div>
        </div>
        <span className="ml-3 rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-cyan-200 transition-colors group-hover:bg-white group-hover:text-[#061e3d]">
          Call
        </span>
      </a>
    )}
  </div>
);