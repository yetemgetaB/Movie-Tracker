# v1.3.1 — Minor Fixes & Enhancements

## Issues Identified

1. **Toggle component broken** — The custom `Toggle` component (line 61-69) has a positioning bug: the thumb uses `absolute` positioning with `top-1` but the translate values don't account for the container properly, causing the dot to escape the track.
2. **Light mode only works on Settings page** — `applyStoredTheme()` runs on route change in `AppLayout`, but the `mica-bg` class in `index.css` uses hardcoded dark colors in the radial gradient, overriding CSS variables. Also missing light-mode values for `--glass`, `--glow`, etc.
3. **Nav customization doesn't apply** — The `BottomNav` already reads from `useNavSettings`, so it should work. Need to verify the hook is being consumed correctly and that CSS glow variable is actually applied.
4. **Display settings are cosmetic** — Image quality, show adult content, and card density are stored in localStorage but never read by the components that fetch/render images or cards.
5. **Shortcuts don't work** — Current `handleKeyDown` only handles `Ctrl+K`, `Alt+H/M/S`, `Escape`, and `F/F11`. The displayed "G then H" style shortcuts aren't implemented. No customization UI.
6. **Links don't work in Tauri** — `<a href>` with `target="_blank"` doesn't open in Tauri by default. Need to use Tauri's `shell.open()` API.
7. **About page needs more developer info** — Add social links (GitHub, Instagram, Telegram, LinkedIn, Buy Me a Coffee), app icon prominence, and richer developer profile section.(you can add more icons and also add more infos you can like amke it comperhensive or you can make a new section in the settings that's all about me the developer)

## Plan

### 1. Fix Toggle Component

Replace the custom `Toggle` with the shadcn `Switch` component from `src/components/ui/switch.tsx` (which uses Radix and works correctly). Update all usages in SettingsPage.

### 2. Fix Light Mode Globally

- Update `.mica-bg` in `index.css` to use CSS variables instead of hardcoded dark HSL values
- Add light-mode overrides for `--glass`, `--glow-soft`, `--glow-medium`, `--surface-hover`, `--nav-glow` custom tokens
- Ensure `applyStoredTheme()` also sets these custom tokens

### 3. Make Nav Customization Actually Work

- Verify `BottomNav` reads `useNavSettings` correctly (it does from previous code)
- Ensure `getGlowStyle` properly overrides the CSS `--glow-soft` variable used by `.nav-glow`
- Fix the nav-glow CSS to use the dynamic glow color variable when set

### 4. Make Display Settings Functional

- **Image quality**: Create a helper `getImageSize()` that maps quality setting to TMDB image sizes (low→w200, medium→w342, high→w500, auto→based on `navigator.connection`). Use it in `img()` function in `tmdb.ts`.
- **Show adult content**: Pass `include_adult` param in TMDB search/discover calls.
- **Card density**: Export a hook or utility that components can use to get grid column counts / card sizing.

### 5. Fix & Enhance Keyboard Shortcuts

- Implement "G then X" two-key sequence shortcuts using a keypress buffer with timeout
- Add more shortcuts: `G then W` (watchlist), `G then V` (vault), `G then A` (analytics), `G then T` (settings)
- Add customization UI in the shortcuts section: let users rebind shortcuts, detect conflicts
- Store custom shortcuts in localStorage

### 6. Fix External Links in Tauri

- Create a utility `openExternal(url)` that tries Tauri's `shell.open()` first, falls back to `window.open()`
- Replace all `<a href target="_blank">` with click handlers using this utility (or wrap in a component)

### 7. Enhance About Page

- Add a polished developer card with:
  - App icon (larger, with glow effect)
  - App name "Movie Tracker" with tagline
  - Developer: "Yetemgeta Bekele" with avatar placeholder
  - Social links row with icons: GitHub, Instagram, Telegram, LinkedIn, Buy Me a Coffee, Twitter/X, Email
  - Each link uses a placeholder URL (user will fill in later) with the `openExternal` utility
- Add app description, tech stack badges, and version info

### 8. Version Bump to 1.3.1

- Update `APP_VERSION` to `"1.3.1"`
- Update `tauri.conf.json` version
- Update `updates.json` with v1.3.1 release notes

## Files to Change


| File                           | Change                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `src/pages/SettingsPage.tsx`   | Replace Toggle with Switch, enhance About section, fix shortcuts, add social links, version bump |
| `src/components/AppLayout.tsx` | Update `applyStoredTheme()` with light-mode custom token overrides                               |
| `src/index.css`                | Fix `.mica-bg` to use CSS variables, add light-mode token support                                |
| `src/lib/tmdb.ts`              | Make `img()` respect image quality setting, add `include_adult` to searches                      |
| `src/lib/openExternal.ts`      | New: utility to open URLs in Tauri or browser                                                    |
| `src/components/BottomNav.tsx` | Ensure glow color override works with CSS variables                                              |
| `src-tauri/tauri.conf.json`    | Version bump to 1.3.1                                                                            |
| `updates.json`                 | Add v1.3.1 entry                                                                                 |
