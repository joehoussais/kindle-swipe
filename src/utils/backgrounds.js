/**
 * Background images with text color configurations
 * Each image is classified by mood and optimal text colors
 */

export const BACKGROUNDS = [
  {
    id: 'wolf',
    src: '/backgrounds/wolf.png',
    theme: 'dark',
    textColor: { r: 245, g: 240, b: 230 },      // Cream white
    textColorLight: { r: 200, g: 195, b: 185 }, // Muted cream
    mood: 'contemplative'
  },
  {
    id: 'aqueduct',
    src: '/backgrounds/aqueduct.png',
    theme: 'light',
    textColor: { r: 60, g: 45, b: 35 },         // Dark sepia
    textColorLight: { r: 90, g: 75, b: 60 },    // Medium sepia
    mood: 'serene'
  },
  {
    id: 'brutalist',
    src: '/backgrounds/brutalist.png',
    theme: 'neutral',
    textColor: { r: 40, g: 40, b: 45 },         // Dark charcoal
    textColorLight: { r: 70, g: 70, b: 75 },    // Medium charcoal
    mood: 'powerful'
  },
  {
    id: 'colosseum',
    src: '/backgrounds/colosseum.png',
    theme: 'dark',
    textColor: { r: 250, g: 245, b: 235 },      // Warm white
    textColorLight: { r: 210, g: 200, b: 180 }, // Muted gold
    mood: 'epic'
  },
  {
    id: 'forum',
    src: '/backgrounds/forum.png',
    theme: 'light',
    textColor: { r: 55, g: 45, b: 40 },         // Dark brown
    textColorLight: { r: 85, g: 70, b: 60 },    // Medium brown
    mood: 'classical'
  },
  {
    id: 'city',
    src: '/backgrounds/city.png',
    theme: 'dark',
    textColor: { r: 250, g: 248, b: 245 },      // Cool white
    textColorLight: { r: 200, g: 195, b: 210 }, // Lavender grey
    mood: 'futuristic'
  },
  {
    id: 'safari',
    src: '/backgrounds/safari.png',
    theme: 'warm',
    textColor: { r: 50, g: 35, b: 25 },         // Dark brown
    textColorLight: { r: 80, g: 60, b: 45 },    // Warm brown
    mood: 'vast'
  },
  {
    id: 'tuscan',
    src: '/backgrounds/tuscan.png',
    theme: 'warm',
    textColor: { r: 45, g: 35, b: 30 },         // Dark earth
    textColorLight: { r: 75, g: 60, b: 50 },    // Medium earth
    mood: 'peaceful'
  },
  {
    id: 'gladiator',
    src: '/backgrounds/gladiator.png',
    theme: 'dark',
    textColor: { r: 240, g: 235, b: 230 },      // Soft white
    textColorLight: { r: 190, g: 180, b: 175 }, // Dusty rose
    mood: 'heroic'
  },
  {
    id: 'rome',
    src: '/backgrounds/rome.png',
    theme: 'light',
    textColor: { r: 55, g: 40, b: 45 },         // Dark mauve
    textColorLight: { r: 90, g: 70, b: 75 },    // Medium mauve
    mood: 'nostalgic'
  },
  {
    id: 'temple',
    src: '/backgrounds/temple.png',
    theme: 'dark',
    textColor: { r: 235, g: 240, b: 230 },      // Soft green-white
    textColorLight: { r: 180, g: 190, b: 175 }, // Sage
    mood: 'mystical'
  }
];

// Cache for consistent background per highlight
const highlightBackgroundCache = new Map();

/**
 * Get a random background for a highlight
 * Uses the highlight ID to ensure consistency
 */
export function getBackgroundForHighlight(highlightId) {
  if (highlightBackgroundCache.has(highlightId)) {
    return highlightBackgroundCache.get(highlightId);
  }

  // Use highlight ID to pick a deterministic but varied background
  let hash = 0;
  for (let i = 0; i < highlightId.length; i++) {
    const char = highlightId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const index = Math.abs(hash) % BACKGROUNDS.length;
  const background = BACKGROUNDS[index];

  highlightBackgroundCache.set(highlightId, background);
  return background;
}

/**
 * Preload all background images
 */
export function preloadBackgrounds() {
  BACKGROUNDS.forEach(bg => {
    const img = new Image();
    img.src = bg.src;
  });
}

/**
 * Get RGB string for CSS
 */
export function rgbString(color, alpha = 1) {
  if (alpha < 1) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  }
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
