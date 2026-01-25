// Coin-style profile avatars inspired by ancient Roman coins
// Three choices: Augustus (emperor), Cleopatra (queen), Sphinx (mythical)

export const AVATAR_TYPES = {
  augustus: 'augustus',
  cleopatra: 'cleopatra',
  sphinx: 'sphinx'
};

export function CoinAvatar({ type = 'augustus', size = 40, className = '' }) {
  const avatarComponents = {
    augustus: AugustusCoin,
    cleopatra: CleopatraCoin,
    sphinx: SphinxCoin
  };

  const AvatarComponent = avatarComponents[type] || avatarComponents.augustus;

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <AvatarComponent size={size} />
    </div>
  );
}

// Augustus - Roman Emperor style profile
function AugustusCoin({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Coin base with aged gold gradient */}
      <defs>
        <radialGradient id="coinGoldAugustus" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e6c774" />
          <stop offset="50%" stopColor="#c9a84c" />
          <stop offset="100%" stopColor="#8b7235" />
        </radialGradient>
        <radialGradient id="coinShadowAugustus" cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
        </radialGradient>
      </defs>

      {/* Outer rim */}
      <circle cx="50" cy="50" r="48" fill="#6b5a2a" />
      {/* Main coin surface */}
      <circle cx="50" cy="50" r="45" fill="url(#coinGoldAugustus)" />
      {/* Inner decorative rim */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="#8b7235" strokeWidth="1.5" />

      {/* Emperor profile - facing right */}
      <g transform="translate(50, 52)">
        {/* Neck */}
        <path
          d="M-2 18 Q-4 12, -3 6 L-3 6 Q-2 10, 2 12 Q6 14, 8 20 L-2 20 Z"
          fill="#8b7235"
        />
        {/* Head outline */}
        <ellipse cx="-2" cy="-4" rx="14" ry="18" fill="#a08642" />
        {/* Face profile */}
        <path
          d="M8 -8 Q12 -6, 13 -2 Q14 2, 12 6 Q10 10, 6 12 Q2 14, -2 14 Q-8 13, -12 8 Q-15 2, -14 -6 Q-13 -14, -6 -18 Q2 -22, 10 -18 Q14 -14, 8 -8 Z"
          fill="#a08642"
        />
        {/* Nose */}
        <path
          d="M10 -4 Q14 -2, 14 2 Q13 5, 10 6"
          fill="none"
          stroke="#6b5a2a"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Eye */}
        <ellipse cx="4" cy="-6" rx="2" ry="1.5" fill="#6b5a2a" />
        {/* Brow */}
        <path d="M1 -10 Q5 -12, 9 -10" fill="none" stroke="#6b5a2a" strokeWidth="1" />
        {/* Mouth line */}
        <path d="M6 8 Q8 9, 10 8" fill="none" stroke="#6b5a2a" strokeWidth="0.8" />

        {/* Laurel wreath */}
        <g fill="#6b5a2a">
          {/* Left side leaves */}
          <ellipse cx="-10" cy="-14" rx="2" ry="5" transform="rotate(-30 -10 -14)" />
          <ellipse cx="-13" cy="-8" rx="2" ry="5" transform="rotate(-50 -13 -8)" />
          <ellipse cx="-14" cy="0" rx="2" ry="5" transform="rotate(-70 -14 0)" />
          {/* Right side leaves */}
          <ellipse cx="4" cy="-20" rx="2" ry="5" transform="rotate(30 4 -20)" />
          <ellipse cx="10" cy="-16" rx="2" ry="5" transform="rotate(50 10 -16)" />
        </g>
      </g>

      {/* Dotted border pattern */}
      <circle cx="50" cy="50" r="38" fill="none" stroke="#8b7235" strokeWidth="0.5" strokeDasharray="2 3" />

      {/* Edge shadow for 3D effect */}
      <circle cx="50" cy="50" r="48" fill="url(#coinShadowAugustus)" />
    </svg>
  );
}

// Cleopatra - Egyptian Queen style profile
function CleopatraCoin({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Coin base with aged gold gradient */}
      <defs>
        <radialGradient id="coinGoldCleo" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e6c774" />
          <stop offset="50%" stopColor="#c9a84c" />
          <stop offset="100%" stopColor="#8b7235" />
        </radialGradient>
        <radialGradient id="coinShadowCleo" cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
        </radialGradient>
      </defs>

      {/* Outer rim */}
      <circle cx="50" cy="50" r="48" fill="#6b5a2a" />
      {/* Main coin surface */}
      <circle cx="50" cy="50" r="45" fill="url(#coinGoldCleo)" />
      {/* Inner decorative rim */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="#8b7235" strokeWidth="1.5" />

      {/* Cleopatra profile - facing right */}
      <g transform="translate(48, 52)">
        {/* Neck - more elegant/slender */}
        <path
          d="M-4 16 Q-5 10, -4 4 L-4 4 Q-2 8, 2 10 Q5 12, 6 18 L-4 18 Z"
          fill="#8b7235"
        />
        {/* Head outline - more refined shape */}
        <ellipse cx="-2" cy="-6" rx="12" ry="16" fill="#a08642" />
        {/* Face profile - softer features */}
        <path
          d="M6 -8 Q10 -6, 11 -2 Q12 2, 10 6 Q8 10, 4 12 Q0 14, -4 13 Q-10 12, -12 6 Q-14 0, -12 -8 Q-10 -16, -4 -18 Q2 -20, 8 -16 Q12 -12, 6 -8 Z"
          fill="#a08642"
        />
        {/* Nose - more delicate */}
        <path
          d="M8 -4 Q11 -2, 11 1 Q10 4, 8 5"
          fill="none"
          stroke="#6b5a2a"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Eye - with kohl/eyeliner style */}
        <ellipse cx="2" cy="-6" rx="2.5" ry="1.5" fill="#6b5a2a" />
        <path d="M4.5 -6 L8 -7" stroke="#6b5a2a" strokeWidth="0.8" /> {/* Eye wing */}
        {/* Brow - arched */}
        <path d="M-1 -10 Q3 -12, 7 -10" fill="none" stroke="#6b5a2a" strokeWidth="0.8" />
        {/* Lips */}
        <path d="M4 8 Q7 9, 8 8" fill="none" stroke="#6b5a2a" strokeWidth="0.8" />

        {/* Egyptian headdress/wig */}
        <path
          d="M-12 -10 Q-14 -16, -8 -20 Q-2 -24, 6 -22 Q12 -20, 10 -14 L8 -12"
          fill="#6b5a2a"
        />
        {/* Headdress bands */}
        <path d="M-12 -8 L-14 6" stroke="#6b5a2a" strokeWidth="2" />
        <path d="M-10 -14 L-12 2" stroke="#8b7235" strokeWidth="1" />

        {/* Uraeus (cobra) on forehead */}
        <path
          d="M2 -20 Q4 -24, 6 -22 Q8 -20, 6 -18 Q4 -18, 4 -16"
          fill="none"
          stroke="#6b5a2a"
          strokeWidth="1.5"
        />

        {/* Earring */}
        <circle cx="-10" cy="6" r="2" fill="#6b5a2a" />
      </g>

      {/* Dotted border pattern */}
      <circle cx="50" cy="50" r="38" fill="none" stroke="#8b7235" strokeWidth="0.5" strokeDasharray="2 3" />

      {/* Edge shadow for 3D effect */}
      <circle cx="50" cy="50" r="48" fill="url(#coinShadowCleo)" />
    </svg>
  );
}

// Sphinx - Mythical creature
function SphinxCoin({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Coin base with aged gold gradient */}
      <defs>
        <radialGradient id="coinGoldSphinx" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e6c774" />
          <stop offset="50%" stopColor="#c9a84c" />
          <stop offset="100%" stopColor="#8b7235" />
        </radialGradient>
        <radialGradient id="coinShadowSphinx" cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
        </radialGradient>
      </defs>

      {/* Outer rim */}
      <circle cx="50" cy="50" r="48" fill="#6b5a2a" />
      {/* Main coin surface */}
      <circle cx="50" cy="50" r="45" fill="url(#coinGoldSphinx)" />
      {/* Inner decorative rim */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="#8b7235" strokeWidth="1.5" />

      {/* Sphinx - side profile */}
      <g transform="translate(50, 54)">
        {/* Lion body base */}
        <path
          d="M-28 10 Q-30 4, -25 0 Q-20 -4, -15 -2 L-15 -2 Q-10 0, -5 2 Q0 4, 10 4 Q20 4, 25 8 L25 16 L-28 16 Z"
          fill="#8b7235"
        />
        {/* Back and haunches */}
        <path
          d="M15 4 Q20 2, 24 6 Q26 10, 25 14"
          fill="#a08642"
        />
        {/* Front legs */}
        <path
          d="M-20 6 L-22 16 M-15 6 L-17 16"
          stroke="#6b5a2a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Paws */}
        <ellipse cx="-22" cy="16" rx="3" ry="2" fill="#a08642" />
        <ellipse cx="-17" cy="16" rx="3" ry="2" fill="#a08642" />

        {/* Human head */}
        <ellipse cx="-18" cy="-10" rx="10" ry="12" fill="#a08642" />
        {/* Nemes headdress */}
        <path
          d="M-28 -8 Q-30 -18, -22 -22 Q-14 -26, -8 -22 Q-4 -18, -6 -10"
          fill="#6b5a2a"
        />
        {/* Headdress stripes */}
        <path d="M-26 -14 L-24 -6" stroke="#8b7235" strokeWidth="1" />
        <path d="M-22 -18 L-20 -8" stroke="#8b7235" strokeWidth="1" />
        <path d="M-14 -20 L-14 -10" stroke="#8b7235" strokeWidth="1" />
        {/* Headdress lappets (side pieces) */}
        <path
          d="M-28 -6 Q-30 0, -28 8 L-26 8 Q-28 0, -26 -4"
          fill="#6b5a2a"
        />

        {/* Face features */}
        {/* Eye */}
        <ellipse cx="-14" cy="-10" rx="2" ry="1.5" fill="#6b5a2a" />
        {/* Nose */}
        <path
          d="M-10 -10 Q-6 -8, -7 -4"
          fill="none"
          stroke="#6b5a2a"
          strokeWidth="1"
        />
        {/* Serene smile */}
        <path
          d="M-12 -2 Q-9 0, -7 -2"
          fill="none"
          stroke="#6b5a2a"
          strokeWidth="0.8"
        />

        {/* Beard (ceremonial) */}
        <path
          d="M-12 2 Q-10 8, -12 12"
          fill="none"
          stroke="#6b5a2a"
          strokeWidth="2"
        />

        {/* Tail curled up */}
        <path
          d="M25 10 Q30 6, 28 0 Q26 -4, 22 -2"
          fill="none"
          stroke="#6b5a2a"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Dotted border pattern */}
      <circle cx="50" cy="50" r="38" fill="none" stroke="#8b7235" strokeWidth="0.5" strokeDasharray="2 3" />

      {/* Edge shadow for 3D effect */}
      <circle cx="50" cy="50" r="48" fill="url(#coinShadowSphinx)" />
    </svg>
  );
}

// Selection component for choosing avatar during registration
export function AvatarSelector({ selected, onSelect, size = 64 }) {
  const avatars = [
    { type: 'augustus', label: 'Augustus' },
    { type: 'cleopatra', label: 'Cleopatra' },
    { type: 'sphinx', label: 'Sphinx' }
  ];

  return (
    <div className="flex justify-center gap-4">
      {avatars.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
            selected === type
              ? 'bg-[#d4c4b0]/20 ring-2 ring-[#d4c4b0] scale-105'
              : 'bg-[#1a1a1a]/50 hover:bg-[#1a1a1a] hover:scale-102'
          }`}
        >
          <CoinAvatar type={type} size={size} />
          <span className={`text-xs font-medium ${
            selected === type ? 'text-[#d4c4b0]' : 'text-[#a8a29e]'
          }`}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
