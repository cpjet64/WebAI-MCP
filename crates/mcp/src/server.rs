use webai_core::{CoreError, CoreResult};

#[cfg(feature = "with-rmcp")]
pub fn start_stdio() -> CoreResult<()> {
    // RMCP stdio backend is staged in the migration branch; return explicit
    // status so callers can detect that the build-time feature is present but
    // not yet wired at runtime.
    Err(CoreError::new("rmcp integration pending"))
}

#[cfg(not(feature = "with-rmcp"))]
pub fn start_stdio() -> CoreResult<()> {
    Err(CoreError::new(
        "rmcp not enabled (build with feature 'with-rmcp')",
    ))
}
