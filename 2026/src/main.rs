use axum::http::StatusCode;
use rand::Rng;
use tower_http::services::ServeDir;
use clap::{command, Arg, ArgAction};

static FRAMING: include_dir::Dir<'_> = include_dir::include_dir!("framing/dist");

fn content_type(path: &str) -> &'static str {
    let p = std::path::Path::new(path);
    if let Some(osext) = p.extension() && let Some(ext) = osext.to_str() {
        match ext {
            "html" => "text/html",
            "css" => "text/css",
            "js" => "text/javascript",
            "wasm" => "application/wasm",
            _ => "application/octet-stream",
        }
    } else {
        "application/octet-stream"
    }
}

async fn handle_get_framing(
    axum::extract::Path(path): axum::extract::Path<String>
) -> Result<impl axum::response::IntoResponse, StatusCode> {
    if let Some(f) = FRAMING.get_file(&path) {
        Ok((
            [(axum::http::header::CONTENT_TYPE, content_type(&path))],
            f.contents()
        ))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

#[tokio::main]
pub async fn main() {
    let matches = command!()
        .propagate_version(true)
        .arg(Arg::new("no-browser").help("Don't start the user's web browser").long("no-browser").action(ArgAction::SetTrue))
        .get_matches();
    let games: Vec<String> = std::fs::read_dir("games")
        .expect("games directory does not exist!")
        .filter_map(|g| g.ok().map(|h| format!("games/{}/index.html", h.file_name().display())))
        .collect();
    let app = axum::Router::new()
        .route("/", axum::routing::get(move || async {
            axum::response::Html(include_str!("../index.html"))
        }))
        .route("/games.js", axum::routing::get(move || {
            let mut rng = rand::thread_rng();
            let mut keyed: Vec<_> = games.iter().map(|x| (x, rng.r#gen::<i32>())).collect();
            keyed.sort_by_key(|(_, i)| *i);
            let shuffled: Vec<_> = keyed.iter().map(|(x, _)| *x).collect();
            let gs = format!("window.MICROGAMES = {:?};\n", shuffled);
            async {
                ([(axum::http::header::CONTENT_TYPE, "text/javascript".to_string())], gs)
            }
        }))
        .route("/framing/dist/{*path}", axum::routing::get(handle_get_framing))
        .nest_service("/games", ServeDir::new("games"))
        ;
    let listener = tokio::net::TcpListener::bind("127.0.0.1:8081").await.expect("failed to open server socket");
    println!("starting server on port 8081!");
    let server = axum::serve(listener, app);
    if !matches.get_flag("no-browser") {
        let _ = webbrowser::open("http://localhost:8081");
    }
    server.await.expect("failed to run server");
}
