# Minor Fix: Custom Titlebar, Notification Relocation, and System Tray

## Changes

### 1. Custom Window Titlebar (Minimize / Maximize / Close)

**Tauri config** (`src-tauri/tauri.conf.json`):

- Set `"decorations": false` to remove the native titlebar
- Set `"transparent": true` for seamless blending

**Capabilities** (`src-tauri/capabilities/default.json`):

- Add `"core:window:allow-minimize"`, `"core:window:allow-toggle-maximize"`, `"core:window:allow-close"`, `"core:window:allow-start-dragging"`

**New component** `src/components/Titlebar.tsx`:

- A `data-tauri-drag-region` div fixed at the top (h-8), translucent glass style
- App icon + "Movie Tracker" label on the left
- Minimize (−), Maximize (□), Close (×) buttons on the right
- in the middle section I want to add the current setion or the current active seticon or the movie or the series or somethings else
- Uses `@tauri-apps/api/window` (`getCurrentWindow().minimize()`, `.toggleMaximize()`, `.close()`)
- Falls back gracefully in web (buttons hidden or no-op)

**AppLayout** (`src/components/AppLayout.tsx`):

- Add `<Titlebar />` at the top of the layout
- Add `pt-8` padding to main content to account for the titlebar height

**CSS** (`src/index.css`):

- Add `.titlebar` styles: translucent background, backdrop-blur, drag region

### 2. Move Notification Bell to Bottom-Right (Near Navbar)

**AppLayout** (`src/components/AppLayout.tsx`):

- Remove the fixed top-right notification bell wrapper
- Instead, render `<NotificationBell />` as a floating button in the bottom-right corner, positioned above the navbar

**NotificationBell** (`src/components/NotificationBell.tsx`):

- Restyle: translucent glass background (`bg-card/40 backdrop-blur-xl`), rounded-full
- Accept a `visible` prop to sync show/hide with the navbar's auto-hide state
- Dropdown opens upward (bottom-to-top) since it's now at the bottom
- Transition opacity/translate matching the navbar animation

**AppLayout integration**:

- Pass the navbar's auto-hide visible state down (or use a shared hook/context)
- Simpler approach: move the NotificationBell inside `BottomNav.tsx` as a sibling element positioned to the right of the nav pill, sharing the same visibility logic

### 3. System Tray (Tauri)

**Rust** (`src-tauri/src/lib.rs`):

- Add `tauri-plugin-system-tray` or use Tauri v2's built-in tray API
- Create a tray with the app icon and a context menu: "Show", "Hide", "Quit"
- On tray click: show/focus the window

**Cargo.toml** (`src-tauri/Cargo.toml`):

- No extra crate needed for Tauri v2 (tray is built-in via `tauri::tray::TrayIconBuilder`)

**Capabilities**: Add tray permissions if needed

---

## Files to Change


| File                                  | Change                                               |
| ------------------------------------- | ---------------------------------------------------- |
| `src-tauri/tauri.conf.json`           | `decorations: false`, `transparent: true`            |
| `src-tauri/capabilities/default.json` | Add window control + drag permissions                |
| `src-tauri/src/lib.rs`                | Add system tray with Show/Hide/Quit menu             |
| `src-tauri/Cargo.toml`                | Add `tauri-plugin-shell` if not present              |
| `src/components/Titlebar.tsx`         | New: custom titlebar with min/max/close              |
| `src/components/NotificationBell.tsx` | Restyle: translucent, bottom-right, open upward      |
| `src/components/AppLayout.tsx`        | Add Titlebar, move notification bell to bottom-right |
| `src/components/BottomNav.tsx`        | Export visibility state for notification bell sync   |
| `src/index.css`                       | Add titlebar CSS styles                              |


---

## Next Feature Suggestions

After this minor fix, here are strong next candidates:

1. **Cloud Sync & Authentication** -- Let users sign in and sync their collection across devices using Lovable Cloud
2. **Watch Progress Tracking** -- Mark individual episodes as watched, show "Continue Watching" section
3. **Advanced Search & Filters** -- Language, runtime range, streaming availability filters on Movies/Series pages
4. **Smart Recommendations on HomePage** -- Wire up the existing `recommendations.ts` engine to show a "Recommended For You" row
5. **Custom Collections UI** -- Full drag-to-reorder list management on the Watchlist page

another thing can you add this color combo I really like it I want it as an accent color  
on my other app (music player ) i have this accent color I want you to add it   
🌑 Harmusica Midnight — Full Color System

### Tailwind / shadcn CSS Variables

```
/* Paste into :root or a .theme-midnight class */

--background: 0 0% 5%;
--foreground: 0 0% 92%;
--card: 0 0% 8%;
--card-foreground: 0 0% 92%;
--popover: 0 0% 8%;
--popover-foreground: 0 0% 92%;
--primary: 0 0% 75%;
--primary-foreground: 0 0% 5%;
--secondary: 0 0% 12%;
--secondary-foreground: 0 0% 82%;
--muted: 0 0% 11%;
--muted-foreground: 0 0% 50%;
--accent: 0 0% 75%;
--accent-foreground: 0 0% 5%;
--destructive: 0 72% 51%;
--destructive-foreground: 0 0% 98%;
--border: 0 0% 16%;
--input: 0 0% 16%;
--ring: 0 0% 60%;
--radius: 0.75rem;
```

### Sidebar Tokens

```
--sidebar-background: 0 0% 4%;
--sidebar-foreground: 0 0% 85%;
--sidebar-primary: 0 0% 75%;
--sidebar-primary-foreground: 0 0% 5%;
--sidebar-accent: 0 0% 11%;
--sidebar-accent-foreground: 0 0% 82%;
--sidebar-border: 0 0% 10%;
--sidebar-ring: 0 0% 60%;
```

### Accent & Glow Tokens

```
--accent-primary: hsl(0, 0%, 72%);
--accent-light:   hsl(0, 0%, 88%);
--accent-dark:    hsl(0, 0%, 50%);
--accent-glow:    hsl(0, 0%, 70%, 0.2);
```

### Glass / Frosted Panel Tokens

```
--glass-bg:            hsl(0 0% 100% / 0.04);
--glass-bg-hover:      hsl(0 0% 100% / 0.08);
--glass-bg-active:     hsl(0 0% 100% / 0.14);
--glass-border:        hsl(0 0% 100% / 0.08);
--glass-border-strong: hsl(0 0% 100% / 0.15);
```

### Mica Background Tokens

```
--mica-bg-1: hsl(0, 0%, 5%);
--mica-bg-2: hsl(0, 0%, 7%);
--mica-bg-3: hsl(240, 5%, 6%);
```

### Now Playing & Sidebar Glass

```
--nowplaying-bg:  hsl(0 0% 4% / 0.97);
--sidebar-glass:  hsl(0 0% 5% / 0.88);
--track-hover:    hsl(0 0% 100% / 0.06);
--track-active:   hsl(0 0% 100% / 0.12);
--scrollbar-thumb: hsl(0 0% 30%);
--scrollbar-track: transparent;
```

### Mica Animated Background (CSS class)

```
.mica-bg {
  background:
    radial-gradient(ellipse 80% 50% at 20% 20%, hsl(0 0% 15% / 0.3) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 80%, hsl(240 5% 10% / 0.3) 0%, transparent 55%),
    radial-gradient(ellipse 50% 60% at 60% 10%, hsl(0 0% 12% / 0.2) 0%, transparent 50%),
    linear-gradient(135deg, hsl(0,0%,5%) 0%, hsl(0,0%,7%) 50%, hsl(240,5%,6%) 100%);
  background-attachment: fixed;
}
```

### Glassmorphism Panel (CSS class)

```
.glass {
  background: hsl(0 0% 100% / 0.04);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid hsl(0 0% 100% / 0.08);
}

.glass-strong {
  background: hsl(0 0% 100% / 0.14);
  backdrop-filter: blur(30px) saturate(160%);
  -webkit-backdrop-filter: blur(30px) saturate(160%);
  border: 1px solid hsl(0 0% 100% / 0.15);
}
```

### Now Playing Bar

```
.nowplaying-glass {
  background: hsl(0 0% 4% / 0.97);
  backdrop-filter: blur(30px) saturate(160%);
  -webkit-backdrop-filter: blur(30px) saturate(160%);
  border-top: 1px solid hsl(0 0% 100% / 0.08);
}
```

### Sidebar Panel

```
.sidebar-glass {
  background: hsl(0 0% 5% / 0.88);
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
}
```

---

**Raw hex equivalents** for design tools (Figma, etc.):


| **Token**      | **Value**              |
| -------------- | ---------------------- |
| Background     | #0D0D0D                |
| Card           | #141414                |
| Sidebar bg     | #0A0A0A                |
| Primary/Accent | #B8B8B8                |
| Muted text     | #808080                |
| Border         | #292929                |
| Glass panel    | rgba(255,255,255,0.04) |
| Glass border   | rgba(255,255,255,0.08) |
