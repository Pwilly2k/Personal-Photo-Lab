export const FALLBACK_TOOLS = [
  {
    id: 'body',
    label: 'Body',
    icon: 'body-outline',
    presets: [
      { id: 'snatched', label: 'Sculpted waist', prompt: 'Subtly sculpt waist and balance proportions' },
      { id: 'tall', label: 'Longer legs', prompt: 'Lengthen legs naturally' },
      { id: 'athletic', label: 'Athletic tone', prompt: 'Add graceful athletic definition' },
    ],
  },
  {
    id: 'makeup',
    label: 'Makeup',
    icon: 'color-palette-outline',
    presets: [
      { id: 'natural', label: 'Soft natural', prompt: 'Natural polish, blush, clean brows' },
      { id: 'glam', label: 'Glam glow', prompt: 'Luminous skin and defined eyes' },
      { id: 'editorial', label: 'Editorial', prompt: 'High-fashion editorial accents' },
    ],
  },
  {
    id: 'clothing',
    label: 'Clothes',
    icon: 'shirt-outline',
    presets: [
      { id: 'luxury', label: 'Luxury suit', prompt: 'Elegant luxury tailored look' },
      { id: 'street', label: 'Streetwear', prompt: 'Elevated modern streetwear' },
      { id: 'evening', label: 'Evening look', prompt: 'Dramatic evening fashion look' },
    ],
  },
  {
    id: 'pose',
    label: 'Pose',
    icon: 'accessibility-outline',
    presets: [
      { id: 'shoulder', label: 'Over shoulder', prompt: 'Looking confidently over shoulder' },
      { id: 'runway', label: 'Runway stance', prompt: 'Poised runway fashion stance' },
      { id: 'seated', label: 'Seated pose', prompt: 'Relaxed editorial seated pose' },
    ],
  },
];

export const PROVIDERS = [
  { id: 'gemini', label: 'Gemini', sublabel: 'photo edit' },
  { id: 'openai', label: 'Image 1', sublabel: 'fashion draft' },
];