#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct MediaFileInfo {
    pub path: String,
    pub filename: String,
    pub size_bytes: u64,
    pub modified_timestamp: u64,
}

fn visit_media_dirs(dir: &std::path::Path, files: &mut Vec<MediaFileInfo>, max_depth: usize, current_depth: usize) {
    if current_depth > max_depth {
        return;
    }
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with('.') || name == "$RECYCLE.BIN" || name == "System Volume Information" {
                        continue;
                    }
                }
                visit_media_dirs(&path, files, max_depth, current_depth + 1);
            } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_lowercase();
                if matches!(ext_lower.as_str(), "mkv" | "mp4" | "avi" | "mov" | "wmv" | "flv" | "m4v" | "webm") {
                    let meta = entry.metadata().ok();
                    let size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
                    let modified = meta
                        .as_ref()
                        .and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_secs())
                        .unwrap_or(0);

                    files.push(MediaFileInfo {
                        path: path.to_string_lossy().to_string(),
                        filename: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                        size_bytes: size,
                        modified_timestamp: modified,
                    });
                }
            }
        }
    }
}

#[tauri::command]
fn scan_media_directory(dir_path: String) -> Result<Vec<MediaFileInfo>, String> {
    let path = std::path::Path::new(&dir_path);
    if !path.exists() || !path.is_dir() {
        return Err(format!("Directory does not exist: {}", dir_path));
    }
    let mut files = Vec::new();
    visit_media_dirs(path, &mut files, 8, 0);
    Ok(files)
}

#[tauri::command]
fn detect_potplayer() -> Option<String> {
    let candidates = [
        "C:\\Program Files\\DAUM\\PotPlayer\\PotPlayerMini64.exe",
        "C:\\Program Files\\DAUM\\PotPlayer\\PotPlayer64.exe",
        "C:\\Program Files (x86)\\DAUM\\PotPlayer\\PotPlayerMini.exe",
        "C:\\Program Files (x86)\\DAUM\\PotPlayer\\PotPlayer.exe",
    ];
    for c in candidates {
        if std::path::Path::new(c).exists() {
            return Some(c.to_string());
        }
    }
    None
}

#[tauri::command]
fn launch_media_file(file_path: String, player_path: Option<String>) -> Result<String, String> {
    let candidate_players = [
        "C:\\Program Files\\DAUM\\PotPlayer\\PotPlayerMini64.exe",
        "C:\\Program Files\\DAUM\\PotPlayer\\PotPlayer64.exe",
        "C:\\Program Files (x86)\\DAUM\\PotPlayer\\PotPlayerMini.exe",
        "C:\\Program Files (x86)\\DAUM\\PotPlayer\\PotPlayer.exe",
        "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
        "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe",
    ];

    let mut target_exe: Option<String> = None;

    if let Some(custom) = player_path {
        if !custom.trim().is_empty() && std::path::Path::new(&custom).exists() {
            target_exe = Some(custom);
        }
    }

    if target_exe.is_none() {
        for candidate in candidate_players {
            if std::path::Path::new(candidate).exists() {
                target_exe = Some(candidate.to_string());
                break;
            }
        }
    }

    if let Some(exe) = target_exe {
        std::process::Command::new(&exe)
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to launch {}: {}", exe, e))?;
        Ok(exe)
    } else {
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("rundll32")
                .args(["url.dll,FileProtocolHandler", &file_path])
                .spawn()
                .map_err(|e| format!("Failed to open file: {}", e))?;
            Ok("System Default Player".to_string())
        }
        #[cfg(not(target_os = "windows"))]
        {
            std::process::Command::new("open")
                .arg(&file_path)
                .spawn()
                .map_err(|e| format!("Failed to open file: {}", e))?;
            Ok("Default Player".to_string())
        }
    }
}

#[tauri::command]
fn pick_folder() -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    {
        let script = r#"
        Add-Type -AssemblyName System.Windows.Forms
        $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
        $dialog.Description = "Select Media Folder"
        $dialog.ShowNewFolderButton = $false
        if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
            Write-Output $dialog.SelectedPath
        }
        "#;
        let output = std::process::Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", script])
            .output()
            .map_err(|e| e.to_string())?;

        let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if result.is_empty() {
            Ok(None)
        } else {
            Ok(Some(result))
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(None)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            scan_media_directory,
            detect_potplayer,
            launch_media_file,
            pick_folder
        ])
        .setup(|_app| {
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
