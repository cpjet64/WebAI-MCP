//! Core utilities for WebAI-MCP.
//! Keep small and dependency-light.

mod dto;
mod error;
mod error_model;
mod path_util;
mod ring_buffer;

pub use dto::*;
pub use error::{CoreError, CoreResult};
pub use error_model::{
    analyze_error, categorize, EnhancedError, ErrorContext, ErrorSolution, ErrorType, Priority,
};
pub use path_util::convert_path_for_current_platform;
pub use ring_buffer::{RingBuffer, Truncatable};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn error_displays_message() {
        let err = CoreError::new("oops");
        let s = err.to_string();
        assert!(s.contains("oops"));
    }
}
