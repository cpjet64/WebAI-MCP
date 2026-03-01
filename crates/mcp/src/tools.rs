//! Tool descriptors for MCP (stub list).
//! The rmcp-backed runtime will map these to handlers later.

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Tool {
    pub name: String,
    pub description: String,
}

/// Return the list of MCP tools with stable names.
/// This list mirrors the legacy JS server surface.
pub fn list_tools() -> Vec<Tool> {
    let mut v = Vec::new();
    let mut push = |name: &str, desc: &str| {
        v.push(Tool {
            name: name.into(),
            description: desc.into(),
        });
    };
    push("getConsoleLogs", "Return console logs");
    push("getConsoleErrors", "Return console errors");
    push("getNetworkErrors", "Return network errors");
    push("getNetworkSuccess", "Return successful network requests");
    push("getAllXhr", "Return merged XHR list");
    push("getSelectedElement", "Get selected element");
    push("setSelectedElement", "Set selected element");
    push("captureScreenshot", "Save base64 screenshot to disk");
    push("getCookies", "List cookies");
    push("getLocalStorage", "Get localStorage");
    push("getSessionStorage", "Get sessionStorage");
    push("auditAccessibility", "Run accessibility audit");
    push("auditPerformance", "Run performance audit");
    push("auditSeo", "Run SEO audit");
    push("auditBestPractices", "Run best practices audit");
    v
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn contains_core_tools() {
        let names: Vec<_> = list_tools().into_iter().map(|t| t.name).collect();
        for n in [
            "getConsoleLogs",
            "getConsoleErrors",
            "getNetworkErrors",
            "getNetworkSuccess",
            "getAllXhr",
            "captureScreenshot",
            "auditAccessibility",
        ] {
            assert!(names.contains(&n.to_string()), "missing {n}");
        }
    }
}
