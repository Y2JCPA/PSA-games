# Shekel Life — Game Spec

## Overview
A financial literacy game for kids ages 6-17, teaching real money skills through age-appropriate gameplay. Built with React Native + Expo (TypeScript), deployed as web app on Vercel.

**Live URL:** https://shekel-life.vercel.app
**Repo:** https://github.com/Y2JCPA/PSA-games.git
**Branch:** `claude/setup-shekel-life-game-ExkrZ`
**Local path:** `/tmp/PSA-games/shekel-life/`
**Branding:** PSA (Philip Stein & Associates) × Blue & White Finance

---

## Tech Stack
- **Framework:** React Native + Expo (web export via `npx expo export --platform web`)
- **State:** Zustand with persist middleware (saves to localStorage via AsyncStorage)
- **i18n:** react-i18next (English + Hebrew)
- **Hosting:** Vercel free tier, project `y2jcpas-projects/shekel-life`
- **Deploy:** `cd dist && rm -rf .vercel && vercel link --project shekel-life --yes && vercel deploy --prod --yes`

## Project Structure
```
shekel-life/
├── App.tsx                    # Main router (splash → home → levels)
├── src/
│   ├── theme.ts               # Colors, fonts, spacing, borderRadius
│   ├── store/
│   │   ├── types.ts           # GameState, LevelState, Badge types
│   │   └── gameStore.ts       # Zustand store with persist
│   ├── i18n/
│   │   ├── en.json            # English translations
│   │   └── he.json            # Hebrew translations
│   ├── mechanics/
│   │   ├── chores.ts          # Level 1 chore system
│   │   ├── shopItems.ts       # Level 1 makolet items
│   │   ├── shabbatCalendar.ts # Day names, Shabbat/YomTov logic
│   │   ├── badgeSystem.ts     # Badge earning logic
│   │   └── consequencesEngine.ts
│   ├── components/
│   │   ├── LevelNavBar.tsx    # 🏠 Home + 🔄 Restart buttons (all levels)
│   │   ├── ChoreBoard.tsx     # Level 1 chore selection UI
│   │   ├── ShoppingCart.tsx    # Level 1 cart
│   │   ├── SavingGoalTracker.tsx
│   │   ├── BudgetDashboard.tsx # Reusable budget bar chart
│   │   ├── ConsequenceModal.tsx
│   │   ├── MaaserModal.tsx    # Tzedakah opt-in prompt
│   │   ├── BadgeCard.tsx
│   │   └── LanguageToggle.tsx
│   └── screens/
│       ├── SplashScreen.tsx   # Animated splash (5s, coins + gold title)
│       ├── HomeScreen.tsx     # Dark navy, level cards with age badges
│       ├── BadgesScreen.tsx
│       ├── Level1/            # Ages 6-8: Chores → Makolet
│       ├── Level2/            # Ages 9-11: Weekly choices + meters
│       ├── Level3/            # Ages 12-14: Jobs + financial literacy
│       └── Level4/            # Ages 15-17: Placeholder
```

---

## Global Features
- **All levels unlocked** from start (no sequential gating)
- **Persistent save** via localStorage (survives refresh/close)
- **EN/HE language toggle** on home screen
- **🏠 Home + 🔄 Restart** buttons on all level gameplay screens (with confirmation dialog)
- **Maaser/Tzedakah** opt-in at start of each level
- **Dark navy splash** with animated coin entrance (5 seconds)
- **Dark navy home page** with gold accents, colored gradient level cards, age badges

---

## Level 1: The Makolet (Ages 6-8)
**Characters:** Yoni (boy) / Yael (girl)
**Icon:** 🛒
**Starting balance:** ₪5

### Flow
1. Intro → Character Select → **How It Works** explainer (4 steps) → Daily gameplay loop

### Daily Loop
1. **Chore Board** — 5 random chores from pool of 10, pick up to 3/day
   - Easy (₪1): Read book, make bed, tidy toys
   - Medium (₪2-3): Set table, fold laundry, take trash, help cook
   - Hard (₪4): Sweep floor, wash floor, wash dishes
   - Max daily earning: ₪11
2. **Makolet Shop** — buy snacks/toys or save for goal
3. **Next Day** → back to chore board

### Key Mechanics
- Saving goal tracker (set a target item to save toward)
- Shabbat = no-spend day
- Low balance options: give to tzedakah (badge) or skip to next week
- Consequence engine for choices

---

## Level 2: The School Year Budget (Ages 9-11)
**Characters:** Dov (boy) / Shira (girl)
**Icon:** 📚
**Starting balance:** ₪50 (first week's pocket money)
**Duration:** 8 weeks

### Flow
1. Intro → Character Select → Maaser opt-in → **How It Works** → Weekly gameplay loop

### Weekly Loop
1. Receive ₪50 pocket money
2. **3 real choices** appear (1 need + 1 want + 1 social/surprise):
   - Each shows emoji, description, price, happiness/friend effect indicators
   - Player taps ✓ Yes or ✗ Skip for each
3. **Week Summary** — meters update, balance shown, feedback messages

### Choice Pools (30+ scenarios)
- **Needs** (₪18-75): Notebooks, bus fare, lunch, art supplies, water bottle, new backpack, gym shoes
- **Wants** (₪15-120): Candy, stickers, ice cream, comic book, pencil case, toy figure, **video game ₪90**, **limited-edition sneakers ₪120**
- **Social** (₪0-80): Pizza with friends, birthday gift, free show seat, tiyul deposit, class treats, bowling, **escape room ₪80**
- **Surprises** (₪-40 to ₪100): Chanukah gelt (+₪40), found money, broken pen, **Purim costume ₪70**, lost lunch, rain gear, **broken phone ₪100**, dentist

### Meters
- 😊 **Happiness** (0-100%) — drops when skipping fun/needs, rises with purchases
- 👫 **Friends** (0-100%) — drops when skipping social events, rises with social spending
- 💰 **Balance** — visible cash amount

### Win/Lose
- **Win:** Survive 8 weeks with positive balance AND happiness > 0
- **Lose:** Balance goes negative OR happiness hits 0
- **End screen:** 3-star report card (Money Smart, Happiness, Friendships)

### Design Philosophy
- ₪50/week is intentionally tight — can't say yes to everything
- Saying yes to everything in one week is **impossible** (items total > ₪50)
- Skipping social events has real consequences (friends notice)
- Surprises can be devastating (₪100 broken phone on ₪50 income)

---

## Level 3: The Part-Time Worker (Ages 12-14)
**Characters:** Ari (boy) / Michal (girl)
**Icon:** 📱
**Starting balance:** ₪100
**Duration:** 6 months

### Flow
1. Intro → Character Select → Maaser opt-in → **How It Works** (5 steps) → Job Select → Savings Goal → Monthly gameplay loop

### Jobs
| Job | Pay/Shift | Emoji |
|-----|-----------|-------|
| Babysitting | ₪45 | 🍼 |
| Tutoring | ₪55 | 📖 |
| Delivery | ₪35 | 🛵 |

### Savings Goals
| Item | Cost | Emoji |
|------|------|-------|
| New Phone | ₪900 | 📱 |
| Class Trip | ₪600 | ✈️ |
| Laptop | ₪1,400 | 💻 |
| New Bike | ₪750 | 🚲 |

### Monthly Loop
1. **Shift Offers** — 4 offers per month (2 on Yom Tov months), each with:
   - Pay amount
   - Energy cost (⚡ -X%)
   - Social trade-off (miss bowling? miss friends?)
   - Player taps ✓ Take or ✗ Pass
2. **Monthly Events** — 2-3 real-life scenarios with multiple choices
3. **Phone Bill** — ₪50 mandatory. Pay, borrow from parents, or lose phone
4. **Month Summary** — meters, financials, save/debt options, goal progress

### Financial Literacy Mechanics

#### 🏦 Savings Account (2% monthly compound interest)
- Players can deposit ₪25/50/100 into savings at month end
- Interest accrues monthly, visible in summary
- Teaches: compound growth, delayed gratification

#### 🔴 Debt System (10% monthly interest)
- Can't afford mandatory expense → borrow from parents
- Debt grows 10% each month unpaid
- Can pay down debt at month end
- Teaches: debt spiral, interest working against you

#### 💳 Buy Now Pay Later Trap
- Air Jordans: ₪400 outright OR ₪50/month × 10 months = ₪500 total
- Game shows both prices clearly
- Teaches: true cost of installment credit

#### 📈 Inflation (Month 3)
- All prices increase 15% with no warning
- Income stays the same
- Banner announcement: "Prices went up 15%. Your pay didn't."
- Teaches: purchasing power, inflation reality

#### 🤝 Lending Risk
- Friend asks to borrow ₪100
- 70% chance of repayment next month, 30% they "forget"
- If they don't pay: social meter dips (awkward to ask)
- Teaches: lending vs giving, relationship dynamics with money

#### 📱 Phone = Lifeline
- Miss ₪50 phone bill → phone gets cut off
- No phone next month → only 2 shift offers instead of 4
- Social meter tanks (can't coordinate with friends)
- Teaches: essential expenses, cascading consequences

#### ✨ Maaser Reward
- Give maaser consistently for 2+ months
- Month 3: community member connects you to better client (+₪80 bonus)
- Teaches: generosity has tangible returns (surprise, not transactional)

### Meters (3 total)
- ⚡ **Energy** (0-100%) — work drains it, recovers +10/month base
- 👫 **Social** (0-100%) — shifts with social cost drain it, social events build it
- 💰 **Cash Balance** — plus separate savings account display
- 🔴 **Debt** badge (if any)
- 📵 **Phone Cut** badge (if unpaid)
- 🏦 **Savings** badge (shows account balance)

### Event Scenarios (12+ unique)
- Phone cracked (₪200 fix or live with cracks)
- Air Jordans (₪400 / installments / skip)
- Friend loan (₪100, 70% payback)
- Bar mitzvah gift (₪30-80 range)
- Concert tickets (₪150)
- School overnight trip (₪120)
- Falafel inflation (prices up)
- Emergency dentist (mandatory, debt if broke)
- Broken bike (fix ₪90 or walk)
- Mall sale temptation (₪120)
- Inflation announcement (month 3)
- Maaser reward (month 3, if eligible)
- Yom Tov (months 2 & 5, fewer shifts)

### Win Condition (ALL required)
1. Positive cash balance
2. Savings goal reached (₪600-1400 in savings account)
3. No outstanding debt (parent loans or installments)
4. Energy meter > 50%
5. Social meter > 50%

### End Screen
5-category report card with star ratings:
- 💰 Money | ⚡ Energy | 👫 Social | 🏦 Savings Goal | 🔴 Debt Free

---

## Level 4: Independence (Ages 15-17)
**Icon:** 🏦
**Status:** Placeholder — not yet built

**Planned concepts:**
- Bank account management
- Investment basics
- Pre-army/sherut leumi financial planning
- Larger income, larger responsibilities
- Tax concepts (basic)
- Insurance decisions

---

## Design Language
- **Splash/Home:** Dark navy (#0D1B2A), gold accents (#F4D03F)
- **Gameplay:** Light (#F8F9FA offWhite), white cards, colored accents
- **Cards:** 16px border radius, subtle shadows
- **Buttons:** Primary (navy), Green (success), Danger (red), Secondary (ghost)
- **Meters:** Horizontal bars with emoji faces, percentage labels
- **Font sizes:** xs(12) sm(14) md(16) lg(20) xl(24) xxl(32) title(40)
- **Age badges** on home level cards
- **Play/In Progress/Completed** circle buttons (▶/▶/✓)

## Build & Deploy
```bash
cd /tmp/PSA-games/shekel-life
npx expo export --platform web
cd dist && rm -rf .vercel
vercel link --project shekel-life --yes
vercel deploy --prod --yes
cd .. && git add -A && git commit -m "message" && git push
```

## Key Files to Edit
| What | File |
|------|------|
| Store/state | `src/store/gameStore.ts` |
| Types | `src/store/types.ts` |
| Theme/colors | `src/theme.ts` |
| English strings | `src/i18n/en.json` |
| Hebrew strings | `src/i18n/he.json` |
| Level 1 | `src/screens/Level1/Level1Screen.tsx` |
| Level 2 | `src/screens/Level2/Level2Screen.tsx` |
| Level 3 | `src/screens/Level3/Level3Screen.tsx` |
| Level 4 | `src/screens/Level4/Level4Screen.tsx` |
| Splash | `src/screens/SplashScreen.tsx` |
| Home | `src/screens/HomeScreen.tsx` |
| Nav buttons | `src/components/LevelNavBar.tsx` |
| Chores | `src/mechanics/chores.ts` |
| Shop items | `src/mechanics/shopItems.ts` |

## What's Next
- [ ] Build Level 4 (ages 15-17)
- [ ] Add sound effects / haptics
- [ ] Achievement unlock animations
- [ ] Leaderboard / score sharing
- [ ] PSA / B&W branded loading assets (logos instead of emoji)
- [ ] Mobile app store deployment (iOS/Android via Expo)
- [ ] Analytics / play tracking
- [ ] Parent dashboard (see kid's progress)
