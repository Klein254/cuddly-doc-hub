use tauri_plugin_dialog::DialogExt;

/// Shows the system "Save as" dialog and writes the PDF to the chosen file.
/// Returns the saved path, or None if the user cancelled.
#[tauri::command]
async fn save_pdf(app: tauri::AppHandle, name: String, data: Vec<u8>) -> Result<Option<String>, String> {
    let Some(picked) = app
        .dialog()
        .file()
        .set_file_name(&name)
        .add_filter("PDF document", &["pdf"])
        .blocking_save_file()
    else {
        return Ok(None);
    };
    let path = picked.into_path().map_err(|e| e.to_string())?;
    std::fs::write(&path, data).map_err(|e| e.to_string())?;
    Ok(Some(path.display().to_string()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_pdf])
        .run(tauri::generate_context!())
        .expect("error while running Vector Doc Hub");
}
