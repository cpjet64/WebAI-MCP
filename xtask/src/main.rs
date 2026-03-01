//! xtask: helper for repo-local tasks.

fn main() {
    let mut args = std::env::args().skip(1);
    match args.next().as_deref() {
        None => print_help(),
        Some("help") | Some("-h") | Some("--help") => print_help(),
        Some("status") => {
            println!("xtask: status command not implemented for runtime operations yet.");
            println!("Available command: help");
        }
        Some(other) => {
            eprintln!("xtask: unknown command '{}'.", other);
            print_help();
            std::process::exit(1);
        }
    }
}

fn print_help() {
    println!("xtask commands:");
    println!("  help      Show command usage");
    println!("  status    Show xtask command availability");
}
