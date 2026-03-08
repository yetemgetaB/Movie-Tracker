// Plugin/Extension System

export type PluginType = "theme" | "widget" | "datasource";

export interface Plugin {
  id: string;
  name: string;
  description: string;
  type: PluginType;
  version: string;
  author: string;
  enabled: boolean;
  config: Record<string, any>;
  // For themes: CSS content
  css?: string;
  // For widgets: component key
  widgetKey?: string;
}

const STORAGE_KEY = "movie_tracker_plugins";

function getPlugins(): Plugin[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePlugins(plugins: Plugin[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plugins));
}

export function getAllPlugins(): Plugin[] {
  return getPlugins();
}

export function getEnabledPlugins(type?: PluginType): Plugin[] {
  const plugins = getPlugins();
  return plugins.filter((p) => p.enabled && (!type || p.type === type));
}

export function installPlugin(plugin: Omit<Plugin, "id" | "enabled">): Plugin {
  const plugins = getPlugins();
  const newPlugin: Plugin = {
    ...plugin,
    id: `plugin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    enabled: true,
  };
  plugins.push(newPlugin);
  savePlugins(plugins);
  if (newPlugin.type === "theme" && newPlugin.css) {
    applyThemePlugin(newPlugin);
  }
  return newPlugin;
}

export function uninstallPlugin(id: string) {
  const plugins = getPlugins();
  const plugin = plugins.find((p) => p.id === id);
  if (plugin?.type === "theme") {
    removeThemePlugin(plugin);
  }
  savePlugins(plugins.filter((p) => p.id !== id));
}

export function togglePlugin(id: string): boolean {
  const plugins = getPlugins();
  const plugin = plugins.find((p) => p.id === id);
  if (!plugin) return false;
  plugin.enabled = !plugin.enabled;
  savePlugins(plugins);

  if (plugin.type === "theme" && plugin.css) {
    if (plugin.enabled) applyThemePlugin(plugin);
    else removeThemePlugin(plugin);
  }

  return plugin.enabled;
}

export function updatePluginConfig(id: string, config: Record<string, any>) {
  const plugins = getPlugins();
  const plugin = plugins.find((p) => p.id === id);
  if (!plugin) return;
  plugin.config = { ...plugin.config, ...config };
  savePlugins(plugins);
}

// Theme plugin injection
function applyThemePlugin(plugin: Plugin) {
  if (!plugin.css) return;
  removeThemePlugin(plugin); // Remove old if exists
  const style = document.createElement("style");
  style.id = `plugin-theme-${plugin.id}`;
  style.textContent = plugin.css;
  document.head.appendChild(style);
}

function removeThemePlugin(plugin: Plugin) {
  const el = document.getElementById(`plugin-theme-${plugin.id}`);
  if (el) el.remove();
}

// Apply all enabled theme plugins on startup
export function initPlugins() {
  const themePlugins = getEnabledPlugins("theme");
  themePlugins.forEach(applyThemePlugin);
}

// Built-in example plugins
export const BUILTIN_PLUGINS: Omit<Plugin, "id" | "enabled">[] = [
  {
    name: "Neon Theme",
    description: "Vibrant neon colors with glowing accents",
    type: "theme",
    version: "1.0.0",
    author: "Movie Tracker",
    config: {},
    css: `:root {
  --primary: 280 100% 60%;
  --glow-soft: 280 100% 60% / 0.2;
  --glow-medium: 280 100% 60% / 0.35;
}
.nav-glow { box-shadow: 0 0 30px hsl(280 100% 60% / 0.3), 0 0 50px hsl(280 100% 60% / 0.2) !important; }`,
  },
  {
    name: "Warm Sunset",
    description: "Warm orange and amber tones",
    type: "theme",
    version: "1.0.0",
    author: "Movie Tracker",
    config: {},
    css: `:root {
  --primary: 25 95% 53%;
  --glow-soft: 25 95% 53% / 0.2;
  --glow-medium: 25 95% 53% / 0.35;
}`,
  },
  {
    name: "Forest Green",
    description: "Calming green forest palette",
    type: "theme",
    version: "1.0.0",
    author: "Movie Tracker",
    config: {},
    css: `:root {
  --primary: 145 63% 42%;
  --glow-soft: 145 63% 42% / 0.2;
  --glow-medium: 145 63% 42% / 0.35;
}`,
  },
  {
    name: "Monochrome",
    description: "Clean black and white aesthetic",
    type: "theme",
    version: "1.0.0",
    author: "Movie Tracker",
    config: {},
    css: `:root {
  --primary: 0 0% 90%;
  --primary-foreground: 0 0% 10%;
}`,
  },
];
