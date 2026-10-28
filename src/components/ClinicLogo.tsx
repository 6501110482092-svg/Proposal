import React from 'react';

interface ClinicLogoProps {
  logoUrl?: string;
  clinicId?: string;
  className?: string;
}

export const ClinicLogo: React.FC<ClinicLogoProps> = ({ logoUrl, clinicId, className = 'w-24 h-24' }) => {
  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <img
        src={logoUrl}
        alt="Clinic Logo"
        className={`object-contain ${className}`}
      />
    );
  }

  // Default stylized BK Lab logo as seen in the official PDF attachment
  if (clinicId === 'clinic-bklab' || !clinicId) {
    return (
      <div className={`relative flex flex-col items-center justify-center ${className} select-none`}>
        {/* Yellow glowing oval badge */}
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 160 110" className="w-full h-full">
            <defs>
              <linearGradient id="yellowOval" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
              <linearGradient id="bkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#4338ca" />
              </linearGradient>
            </defs>
            
            {/* Soft oval background */}
            <ellipse cx="80" cy="55" rx="72" ry="44" fill="url(#yellowOval)" opacity="0.85" filter="drop-shadow(0px 2px 4px rgba(234, 179, 8, 0.4))" />
            <ellipse cx="80" cy="55" rx="66" ry="38" fill="#fef9c3" opacity="0.6" />

            {/* Stylized BK letters */}
            <text
              x="36"
              y="68"
              fontFamily="sans-serif"
              fontSize="44"
              fontWeight="900"
              fontStyle="italic"
              fill="url(#bkGradient)"
              letterSpacing="-2"
            >
              B
            </text>
            <text
              x="72"
              y="68"
              fontFamily="sans-serif"
              fontSize="44"
              fontWeight="900"
              fontStyle="italic"
              fill="url(#bkGradient)"
              letterSpacing="-2"
            >
              K
            </text>

            {/* Red swoosh curve below BK */}
            <path
              d="M 28 78 Q 78 88 132 64"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="132" cy="64" r="3" fill="#ef4444" />

            {/* Subtext ribbon */}
            <text
              x="80"
              y="97"
              textAnchor="middle"
              fontFamily="sans-serif"
              fontSize="10"
              fontWeight="bold"
              fill="#0284c7"
              letterSpacing="0.5"
            >
              Lab Health Center
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // Generic Medical Cross Logo for other clinics
  return (
    <div className={`flex flex-col items-center justify-center bg-sky-50 border border-sky-200 rounded-lg p-2 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
        +
      </div>
      <span className="text-[10px] font-semibold text-sky-800 mt-1">Medical Clinic</span>
    </div>
  );
};
