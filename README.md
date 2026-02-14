# 🎬 Movie Tracker

<div align="center">

![Movie Tracker](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge&logo=react)
![Tauri](https://img.shields.io/badge/Tauri-1.0.0-00C2FF?style=for-the-badge&logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

A modern, lightweight desktop movie tracking application built with React and Tauri. Track your favorite movies and TV series with style and speed.

[![Screenshot](https://img.shields.io/badge/Screenshot-View%20Demo-brightgreen?style=for-the-badge)](https://github.com/yetemgetaB/Movie-Tracker-Frontend#screenshots)

</div>

## ✨ Features

- 🎬 **Universal Search** - Search across both movies and TV series simultaneously
- ⭐ **Personal Ratings** - Rate and track your personal viewing experience
- 📱 **Modern UI** - Beautiful, responsive interface with smooth animations
- 🚀 **Blazing Fast** - Rust backend provides superior performance
- 💾 **Lightweight** - Small executable size (~15MB vs 100MB+ Electron apps)
- 🖥️ **Native Experience** - True desktop application feel
- 🔒 **Secure** - Local storage only, no cloud dependencies
- 📊 **Statistics** - Track viewing habits and preferences
- 🎨 **Customizable** - Multiple themes and accent colors

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge)

### Backend
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-00C2FF?style=for-the-badge&logo=tauri&logoColor=white)
![Serde](https://img.shields.io/badge/Serde-000000?style=for-the-badge&logo=rust&logoColor=white)

## 🚀 Quick Start

### 📥 Download & Install

#### 🪟 Windows (Recommended)
[![Windows](https://img.shields.io/badge/Windows-0078D4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/yetemgetaB/Movie-Tracker-Frontend/releases/latest/download/Movie-Tracker-Setup-1.0.0.exe)

#### 🪟 macOS
[![macOS](https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/yetemgetaB/Movie-Tracker-Frontend/releases/latest/download/Movie-Tracker-1.0.0.dmg)

#### 🪟 Linux
[![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=white)](https://github.com/yetemgetaB/Movie-Tracker-Frontend/releases/latest/download/Movie-Tracker-1.0.0.AppImage)

### 🛠️ Build from Source

#### Prerequisites
- ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) v18 or higher
- ![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white) latest stable

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yetemgetaB/Movie-Tracker-Frontend.git
   cd Movie-Tracker-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development**
   ```bash
   npm run tauri:dev
   ```

4. **Build for production**
   ```bash
   npm run tauri:build
   ```

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run tauri:dev` | 🚀 Run app in development mode |
| `npm run tauri:build` | 🏗️ Build production app |
| `npm run dev` | ⚛️ Run frontend only |
| `npm run build` | 📦 Build frontend only |

## 🎯 Why Tauri?

| Feature | Tauri | Electron |
|---------|---------|----------|
| **Performance** | 🚀 Blazing fast | 🐌 Slower |
| **Size** | 💾 ~15MB | 📦 ~100MB+ |
| **Security** | 🔒 Memory-safe | 🔓 Less secure |
| **Resources** | 💧 Low memory usage | 💧 High usage |
| **Native** | 🖥️ True native | 🪟 Web-based |

## 📁 Project Structure

```
Movie-Tracker-Frontend/
├── 📂 src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs           # Entry point
│   │   └── lib.rs            # Main application logic
│   ├── Cargo.toml             # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── 📂 src/                   # React frontend
│   ├── components/            # UI components
│   ├── pages/                 # Application pages
│   ├── lib/                   # Utilities and APIs
│   └── hooks/                 # Custom React hooks
├── 📂 public/                # Static assets
├── 📂 docs/                   # Documentation
└── 📄 README.md              # This file
```

## 🔧 Development

The application uses Tauri for desktop runtime. The React frontend communicates with the Rust backend through Tauri's IPC system, providing a seamless bridge between web technologies and native desktop capabilities.

### API Integration
- **TMDB API** - For movie and series metadata
- **OMDB API** - For additional movie details
- **Local Storage** - All data stored locally for privacy

## 🎨 Customization

- **Themes** - Light and dark mode support
- **Accent Colors** - Multiple color presets
- **Layout Options** - Responsive design for all screen sizes

## 📸 Screenshots

<div align="center">
  <img src="assets\Screenshot 2.png" width="45%">
  <img src="assets\Screenshot 1.png" width="45%">
</div>

## � Security

- 🔒 **Local Storage Only** - No data sent to external servers
- 🔑 **Secure API Keys** - Encrypted storage of API credentials
- 🛡️ **Type Safety** - Full TypeScript coverage
- 🔍 **Input Validation** - Sanitized user inputs

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

## �📄 License

![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - For the amazing desktop framework
- [React](https://reactjs.org/) - For the UI library
- [TMDB](https://www.themoviedb.org/) - For movie/series data
- [shadcn/ui](https://ui.shadcn.com/) - For the beautiful UI components

---

<div align="center">

**Made with ❤️ by [Yetemgeta Bekele](https://github.com/yetemgetaB)**

[![GitHub followers](https://img.shields.io/github/followers/yetemgetaB?style=for-the-badge&logo=github)](https://github.com/yetemgetaB)
[![GitHub stars](https://img.shields.io/github/stars/yetemgetaB/Movie-Tracker-Frontend?style=for-the-badge&logo=github)](https://github.com/yetemgetaB/Movie-Tracker-Frontend)

</div>
