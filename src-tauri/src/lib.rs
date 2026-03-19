use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Metric {
    label: String,
    value: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceOverview {
    project_name: String,
    focus: String,
    summary: String,
    metrics: Vec<Metric>,
    next_steps: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AssistantResponse {
    reply: String,
    follow_up: String,
    suggested_commands: Vec<String>,
}

fn classify_prompt(prompt: &str) -> (&'static str, Vec<&'static str>) {
    let lower = prompt.to_lowercase();

    if lower.contains("summarize") || lower.contains("status") || lower.contains("repository") {
        (
            "Repository summary",
            vec!["termai summarize .", "rg --files", "git status --short"],
        )
    } else if lower.contains("roadmap") || lower.contains("next") || lower.contains("tasks") {
        (
            "Implementation roadmap",
            vec!["termai roadmap", "git status", "cargo fmt --check"],
        )
    } else if lower.contains("tauri") || lower.contains("react") || lower.contains("architecture") {
        (
            "Architecture review",
            vec!["npm run tauri dev", "cargo fmt", "npm run build"],
        )
    } else {
        (
            "Planning assistant",
            vec![
                "termai ask \"next task\"",
                "git diff --stat",
                "npm run tauri dev",
            ],
        )
    }
}

#[tauri::command]
fn get_workspace_overview() -> WorkspaceOverview {
    WorkspaceOverview {
        project_name: "TermAI".into(),
        focus: "Desktop MVP".into(),
        summary: "A Tauri 2 desktop shell for repository walkthroughs, planning flows, and future local AI execution.".into(),
        metrics: vec![
            Metric {
                label: "Frontend".into(),
                value: "React + Vite".into(),
            },
            Metric {
                label: "Backend".into(),
                value: "Rust commands".into(),
            },
            Metric {
                label: "Mode".into(),
                value: "Local desktop".into(),
            },
        ],
        next_steps: vec![
            "Replace the assistant stub with a real provider client.".into(),
            "Persist sessions and summaries to disk.".into(),
            "Add repository scanning and file-aware prompts.".into(),
        ],
    }
}

#[tauri::command]
fn run_assistant(prompt: &str, session_title: &str, project_focus: &str) -> AssistantResponse {
    let trimmed = prompt.trim();

    if trimmed.is_empty() {
        return AssistantResponse {
            reply: "Ask a question to get started.".into(),
            follow_up: "Try requesting a repository summary or implementation plan.".into(),
            suggested_commands: vec!["termai summarize .".into(), "termai plan v0.1".into()],
        };
    }

    let (mode, commands) = classify_prompt(trimmed);
    let command_list = commands.into_iter().map(String::from).collect();

    AssistantResponse {
        reply: format!(
            "{mode} for \"{session_title}\"\n\nFocus: {project_focus}\nPrompt: {trimmed}\n\nRecommended direction:\n- capture the user-facing goal for this workflow\n- keep the desktop shell responsive and stateful\n- connect backend commands before layering in full agent behavior"
        ),
        follow_up: "Decide whether to implement persistence, repository analysis, or real LLM integration next.".into(),
        suggested_commands: command_list,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_workspace_overview,
            run_assistant
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
