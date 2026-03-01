use crate::{provider_mode, ProviderMode};
use serde_json::Value;

pub enum FlowResult {
    Ok(Value),
    Err(String),
}

pub trait FlowProvider {
    fn get_html(&self, selector: &str) -> FlowResult;
    fn click(&self, selector: &str) -> FlowResult;
    fn fill(&self, selector: &str, text: &str) -> FlowResult;
    fn select(&self, selector: &str, value: &str) -> FlowResult;
    fn submit(&self, selector: &str) -> FlowResult;
}

struct LegacyProvider;
impl FlowProvider for LegacyProvider {
    fn get_html(&self, _selector: &str) -> FlowResult {
        FlowResult::Err("No clients connected".into())
    }
    fn click(&self, _selector: &str) -> FlowResult {
        FlowResult::Err("No clients connected".into())
    }
    fn fill(&self, _selector: &str, _text: &str) -> FlowResult {
        FlowResult::Err("No clients connected".into())
    }
    fn select(&self, _selector: &str, _value: &str) -> FlowResult {
        FlowResult::Err("No clients connected".into())
    }
    fn submit(&self, _selector: &str) -> FlowResult {
        FlowResult::Err("No clients connected".into())
    }
}

struct RustProvider;
impl FlowProvider for RustProvider {
    fn get_html(&self, selector: &str) -> FlowResult {
        let html = format!(
            "<div class=\"provider-html\" data-provider=\"rust\" data-selector=\"{}\">\
            <span>No server-side HTML capture is available in the Rust compatibility path yet.</span>\
            </div>",
            selector
        );
        FlowResult::Ok(serde_json::json!({"html": html}))
    }
    fn click(&self, selector: &str) -> FlowResult {
        FlowResult::Ok(serde_json::json!({"selector": selector}))
    }
    fn fill(&self, selector: &str, text: &str) -> FlowResult {
        FlowResult::Ok(serde_json::json!({"selector": selector, "text": text}))
    }
    fn select(&self, selector: &str, value: &str) -> FlowResult {
        FlowResult::Ok(serde_json::json!({"selector": selector, "value": value}))
    }
    fn submit(&self, selector: &str) -> FlowResult {
        FlowResult::Ok(serde_json::json!({"selector": selector}))
    }
}

pub fn provider_for_current_mode() -> Box<dyn FlowProvider + Send + Sync> {
    match provider_mode() {
        ProviderMode::Rust => Box::new(RustProvider),
        ProviderMode::Legacy => Box::new(LegacyProvider),
    }
}
