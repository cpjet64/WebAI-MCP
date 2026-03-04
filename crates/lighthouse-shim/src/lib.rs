//! Lighthouse shim crate skeleton.
//! Enables Node-based audits behind a feature flag during migration.

use webai_core::CoreResult;

/// Lightweight availability check for the shim, used by compatibility tests.
pub fn audit_available() -> CoreResult<bool> {
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn audit_available_ok() {
        assert!(audit_available().unwrap());
    }
}
