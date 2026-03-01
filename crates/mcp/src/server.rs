use webai_core::{CoreError, CoreResult};

#[cfg(feature = "with-rmcp")]
pub fn start_stdio() -> CoreResult<()> {
    // Placeholder until rmcp is added as a dependency.
    Err(CoreError::new("rmcp integration pending"))
}

#[cfg(not(feature = "with-rmcp"))]
pub fn start_stdio() -> CoreResult<()> {
    Err(CoreError::new(
        "rmcp not enabled (build with feature 'with-rmcp')",
    ))
}
