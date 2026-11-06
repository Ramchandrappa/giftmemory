# GiftMemory – Thoughtful Gift Planner

A private planner for occasions, preferences, budgets and past gifts.
It warns about duplicate gift ideas and upcoming occasions.

**Live demo:** https://ramchandrappa.github.io/giftmemory/

**Full-stack version (accounts that sync across devices):** https://giftmemory-8bos.onrender.com

Coming soon: https://giftmemory.is-a.dev

Demo login: `demo@giftmemory.app` / `demo123`

## Features
- Dashboard with upcoming occasions and smart reminders
- People management with likes, dislikes and notes
- Occasion management (birthday, anniversary, festival, wedding, farewell)
- Gift ideas with idea → bought → given status and personalisation
- Budget management per occasion and per year
- Gift history with filters
- Duplicate gift detection and dislike warnings
- Light and dark themes, works on phone and desktop
- Animated login screen (gift box, hearts and confetti) and playful motion across the app, switched off automatically when a device asks for reduced motion
- Colourful Noto emoji artwork that looks the same on every device, with animated versions on the dashboard and when you hover or tap a gift

## Credits
Emoji artwork: [Google Noto Emoji](https://github.com/googlefonts/noto-emoji) (images Apache 2.0; animated emoji CC BY 4.0).

## How it works
This version is a single `index.html` file with no build step.
Data is saved in the visitor's own browser (localStorage), so each visitor gets a private copy.

The full-stack version (React, Node.js + Express, MongoDB) is in the [`fullstack/`](fullstack/) folder. It stores accounts and data on a server, so the planner is the same on every device. See [fullstack/README.md](fullstack/README.md) to run or deploy it.

## Author
Dakshitha Sree – S-Vyasa, CSE

## License
MIT – see [LICENSE](LICENSE).
