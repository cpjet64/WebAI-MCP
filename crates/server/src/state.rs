use std::time::Instant;
use webai_core::{ConsoleEntry, NetworkRequest, RingBuffer, SelectedElement};

/// Shared application state.
pub struct AppState {
    pub start: Instant,
    pub port: u16,
    pub name: &'static str,
    pub version: &'static str,
    pub string_limit: usize,
    pub query_limit: usize,
    pub ws_clients: std::sync::atomic::AtomicUsize,
    pub console_logs: tokio::sync::Mutex<RingBuffer<ConsoleEntry>>,
    pub console_errors: tokio::sync::Mutex<RingBuffer<ConsoleEntry>>,
    pub network_errors: tokio::sync::Mutex<RingBuffer<NetworkRequest>>,
    pub network_success: tokio::sync::Mutex<RingBuffer<NetworkRequest>>,
    pub selected_element: tokio::sync::Mutex<Option<SelectedElement>>,
    pub current_url: tokio::sync::Mutex<String>,
}

fn default_state(port: u16) -> AppState {
    // Defaults aligned with JS server
    let log_limit = 50usize;
    let string_limit = 500usize;
    let query_limit = 30_000usize;
    AppState {
        start: Instant::now(),
        port,
        name: "@cpjet64/webai-server",
        version: env!("CARGO_PKG_VERSION"),
        string_limit,
        query_limit,
        ws_clients: std::sync::atomic::AtomicUsize::new(0),
        console_logs: tokio::sync::Mutex::new(RingBuffer::new(log_limit).expect("ring buffer")),
        console_errors: tokio::sync::Mutex::new(RingBuffer::new(log_limit).expect("ring buffer")),
        network_errors: tokio::sync::Mutex::new(RingBuffer::new(log_limit).expect("ring buffer")),
        network_success: tokio::sync::Mutex::new(RingBuffer::new(log_limit).expect("ring buffer")),
        selected_element: tokio::sync::Mutex::new(None),
        current_url: tokio::sync::Mutex::new(String::new()),
    }
}

/// Create a new default state for a given port.
pub fn new_state(port: u16) -> AppState {
    default_state(port)
}

/// Create a state with custom string/query limits.
pub fn new_state_with(port: u16, string_limit: usize, query_limit: usize) -> AppState {
    let mut s = default_state(port);
    s.string_limit = string_limit;
    s.query_limit = query_limit;
    s
}

impl AppState {
    /// Increment WS client counter.
    pub fn inc_ws(&self) {
        let _ = self
            .ws_clients
            .fetch_add(1, std::sync::atomic::Ordering::SeqCst);
    }
    /// Decrement WS client counter.
    pub fn dec_ws(&self) {
        let _ = self
            .ws_clients
            .fetch_sub(1, std::sync::atomic::Ordering::SeqCst);
    }
    /// Get current WS client count.
    pub fn ws_client_count(&self) -> usize {
        self.ws_clients.load(std::sync::atomic::Ordering::SeqCst)
    }
    /// Push a console log entry into the ring buffer.
    pub fn push_console_log(&mut self, entry: ConsoleEntry) {
        if let Ok(mut g) = self.console_logs.try_lock() {
            g.push(entry);
        }
    }

    /// Push a console error entry into the ring buffer.
    pub fn push_console_error(&mut self, entry: ConsoleEntry) {
        if let Ok(mut g) = self.console_errors.try_lock() {
            g.push(entry);
        }
    }

    /// Push a network error entry into the ring buffer.
    pub fn push_network_error(&mut self, entry: NetworkRequest) {
        if let Ok(mut g) = self.network_errors.try_lock() {
            g.push(entry);
        }
    }

    /// Push a network success entry into the ring buffer.
    pub fn push_network_success(&mut self, entry: NetworkRequest) {
        if let Ok(mut g) = self.network_success.try_lock() {
            g.push(entry);
        }
    }
}
