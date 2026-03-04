# Shekel Life

**Financial Literacy Game for Anglo Kids in Israel**

Co-branded: Philip Stein & Associates (PSA) | Blue & White Finance

## Overview

Shekel Life is a mobile-first financial literacy game for Anglo English-speaking kids in Israel, ages 6–17. Kids play solo through age-appropriate storylines set in Israeli life, making real money decisions with real consequences.

**One-Line Pitch:** A simulation game where Israeli kids earn, save, spend, and give in shekalim — and learn what happens when they get it wrong.

## Game Levels

| Level | Ages | Character | Theme |
|-------|------|-----------|-------|
| 1 – The Little Saver | 6–8 | Yoni / Yael | Makolet shopping, delayed gratification |
| 2 – The School Year Budget | 9–11 | Dov / Shira | Weekly budget, needs vs. wants |
| 3 – The Part-Time Worker | 12–14 | Ari / Michal | Monthly income/expense, saving goals |
| 4 – The Road to Independence | 15–17 | Noam / Noa | Full budget, investing basics |

## Tech Stack

- **Framework:** React Native with Expo (iOS, Android, Web)
- **State Management:** Zustand
- **Storage:** AsyncStorage (local game saves, no account required)
- **Animations:** React Native Reanimated
- **i18n:** i18next (English/Hebrew with full RTL support)
- **Language:** TypeScript

## Project Structure

```
shekel-life/
├── src/
│   ├── screens/          # One folder per level
│   │   ├── Level1/       # The Little Saver (ages 6-8)
│   │   ├── Level2/       # The School Year Budget (ages 9-11)
│   │   ├── Level3/       # The Part-Time Worker (ages 12-14)
│   │   └── Level4/       # The Road to Independence (ages 15-17)
│   ├── components/       # Shared UI components
│   ├── mechanics/        # Game logic engines
│   ├── i18n/             # Translation files (en.json, he.json)
│   ├── assets/           # Images, icons, logos
│   └── store/            # Zustand state management
├── docs/                 # Spec documents & design notes
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
cd shekel-life
npm install
```

### Running the App

```bash
# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run in web browser
npx expo start --web
```

## Core Design Principles

- **Real consequences:** Bad financial decisions set you back — not just a wrong-answer buzzer
- **Age-appropriate storylines:** Four distinct levels with unique characters and contexts
- **Israeli context throughout:** Prices in shekalim, Israeli institutions, yom tov cycles
- **Gender choice:** Every level offers boy/girl character — same story, different presentation
- **Language toggle:** English/Hebrew switchable at any point with full RTL support
- **Progression system:** Badges reward saving, goal-reaching, and smart decisions
- **Maaser as optional education:** Presented as a real budget option, never forced

## Branding

- **Colors:** Israeli blues, white, gold accents
- **Tone:** Warm, encouraging, never condescending
- **Co-brands:** PSA logo and Blue & White Finance logo on splash and footer

## License

MIT
