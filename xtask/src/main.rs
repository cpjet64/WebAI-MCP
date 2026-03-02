//! xtask: helper for repo-local tasks.

#[derive(Debug, PartialEq, Eq)]
enum Command {
    Help,
    Status,
    Unknown(String),
}

#[derive(Debug, PartialEq, Eq)]
struct CommandOutcome {
    exit_code: i32,
    stdout: String,
    stderr: String,
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let outcome = execute(&args);

    if !outcome.stdout.is_empty() {
        print!("{}", outcome.stdout);
    }
    if !outcome.stderr.is_empty() {
        eprint!("{}", outcome.stderr);
    }
    std::process::exit(outcome.exit_code);
}

fn execute(args: &[String]) -> CommandOutcome {
    match parse_command(args) {
        Command::Help => CommandOutcome {
            exit_code: 0,
            stdout: help_text().to_string(),
            stderr: String::new(),
        },
        Command::Status => CommandOutcome {
            exit_code: 0,
            stdout: "xtask: status command not implemented for runtime operations yet.\nAvailable command: help\n"
                .into(),
            stderr: String::new(),
        },
        Command::Unknown(command) => CommandOutcome {
            exit_code: 1,
            stdout: format!("{}\n", help_text()),
            stderr: format!("xtask: unknown command '{}'.\n", command),
        },
    }
}

fn parse_command(args: &[String]) -> Command {
    match args.first().map(|s| s.as_str()) {
        None | Some("help") | Some("-h") | Some("--help") => Command::Help,
        Some("status") => Command::Status,
        Some(other) => Command::Unknown(other.to_string()),
    }
}

fn help_text() -> &'static str {
    "xtask commands:\n  help      Show command usage\n  status    Show xtask command availability\n"
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(raw: &[&str]) -> Vec<String> {
        raw.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn no_args_prints_help() {
        let outcome = execute(&[]);
        assert_eq!(outcome.exit_code, 0);
        assert!(outcome.stdout.contains("xtask commands"));
        assert!(outcome.stderr.is_empty());
    }

    #[test]
    fn help_args_print_help() {
        let outcome = execute(&args(&["help"]));
        assert_eq!(outcome.exit_code, 0);
        assert!(outcome.stdout.contains("status"));
    }

    #[test]
    fn status_is_reported_available_but_not_implemented() {
        let outcome = execute(&args(&["status"]));
        assert_eq!(outcome.exit_code, 0);
        assert!(outcome.stdout.contains("not implemented"));
    }

    #[test]
    fn unknown_command_fails_with_message() {
        let outcome = execute(&args(&["unknown"]));
        assert_eq!(outcome.exit_code, 1);
        assert!(outcome.stderr.contains("unknown command 'unknown'"));
        assert!(outcome.stdout.contains("xtask commands"));
    }
}
