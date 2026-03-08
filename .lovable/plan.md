# Plan: v1.3.0 — Navbar Customization, Offline Access, Bug Fixes & Enhancements

## 1. Bug Fixes (Build Errors + Icon)

### Fix `src/lib/updater.ts`

- Remove unused `install` import
- Store the `update` object from `check()` as a class property so `this.update` works in `installUpdate()`

### Fix `src/pages/SettingsPage.tsx(i want you to ensure tat it works with the tauri config too please)`

- Remove `window.__TAURI__` usage (use try/catch around Tauri imports instead)
- Fix `updateAvailable` type to not use `tauriUpdate` — store the Tauri update object separately
- Remove `install` dynamic import; use the stored update object's `.download()` and `.install()` methods directly
- Fix the updater flow to work in both web and Tauri contexts gracefully

### Fix `src/pages/VaultPage.tsx`

- `removeFromCollection(id, type)` → `removeFromCollection(id)` (function only takes 1 arg)
- `updateCollectionItem(id, type, updates)` → `updateCollectionItem(id, updates)` (function takes 2 args)

### Fix About Page Icon

- The icon references `/app-icon.png` but the file is at `src/assets/app-icon.png`
- Change to import the asset: `import appIcon from "@/assets/app-icon.png"` and use `appIcon` as the src

## 2. Offline Access (Home Page + Vault)

### Approach

- On HomePage, detect when TMDB API calls fail (network error) and fall back to showing the user's local collection data from localStorage
- Show an "Offline Mode" banner when network is unavailable
- VaultPage already works offline (localStorage), but add a visual indicator(yes it works but when the user click the movie i want to show all the details offline even the trailer if possible )
- Use `navigator.onLine` + `window.addEventListener('online'/'offline')` for detection

### Implementation

- Create a `useOnlineStatus()` hook
- In HomePage: when offline, render collection items in the hero and content rows instead of TMDB trending data
- Add a subtle "You're offline — showing your collection" banner

## 3. Navbar Customization Settings Page

### New Settings Section: "Navigation"

Add a new section to SettingsPage with these controls:

- **Position**: Bottom (default), Top, Left, Right — stored in localStorage (`nav_position`)
- **Auto-hide**: Toggle — navbar hides on scroll, reappears on scroll up (`nav_autohide`)
- **Glow color**: Separate from accent color — pick a custom glow color for the nav (`nav_glow_color`) with presets + custom hex (or an option to make it with the accent color)
- **Reorder items**: Drag-and-drop to rearrange nav items — store custom order in localStorage (`nav_order`)
- **Show/Hide items**: Toggle visibility of individual nav items (`nav_visible_items`)(but show when hover over like windows taskbar)

### BottomNav Updates

- Read settings from localStorage
- Support rendering in 4 positions (bottom/top = horizontal bar, left/right = vertical sidebar)
- Implement auto-hide with scroll detection(very nice touch)
- Apply custom glow color via CSS variable override
- Use stored item order and visibility

### Drag-and-Drop

- Use native HTML5 drag-and-drop (no extra library needed) for the settings reorder UI
- Display a sortable list of nav items with drag handles

## 4. Version Bump

- Update `APP_VERSION` to `"1.3.0"` in SettingsPage
- Update `version` in `src-tauri/tauri.conf.json` to `"1.3.0"`
- Update `updates.json` with v1.3.0 release notes following the existing format

## File Changes Summary


| File                             | Action                                                                  |
| -------------------------------- | ----------------------------------------------------------------------- |
| `src/lib/updater.ts`             | Fix: remove `install` import, add `update` property                     |
| `src/pages/SettingsPage.tsx`     | Fix: Tauri updater, icon import, add Navigation section                 |
| `src/pages/VaultPage.tsx`        | Fix: function call signatures                                           |
| `src/hooks/use-online-status.ts` | New: online/offline detection hook                                      |
| `src/hooks/use-nav-settings.ts`  | New: navbar customization settings hook                                 |
| `src/pages/HomePage.tsx`         | Edit: offline fallback rendering                                        |
| `src/components/BottomNav.tsx`   | Major: support 4 positions, auto-hide, custom glow, reorder, visibility |
| `src/index.css`                  | Edit: add nav position variant styles                                   |
| `src-tauri/tauri.conf.json`      | Version bump to 1.3.0                                                   |
| `updates.json`                   | v1.3.0 release notes                                                    |
