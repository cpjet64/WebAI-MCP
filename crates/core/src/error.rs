use std::error::Error as StdError;
use std::fmt::{Display, Formatter, Result as FmtResult};

/// Lightweight error type for core utilities.
#[derive(Debug, Clone)]
pub struct CoreError {
    msg: String,
}

impl CoreError {
    /// Create a new CoreError with a message.
    pub fn new(msg: impl Into<String>) -> Self {
        Self { msg: msg.into() }
    }
}

impl Display for CoreError {
    fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
        write!(f, "{}", self.msg)
    }
}

impl StdError for CoreError {}

/// Convenience result alias for core.
pub type CoreResult<T> = Result<T, CoreError>;
