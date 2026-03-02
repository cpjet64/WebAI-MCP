//! Tool descriptors for the MCP surface.
//! The rmcp-backed runtime maps these descriptors to concrete handlers when enabled.

use serde_json::json;
use serde_json::Value;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Tool {
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ToolKind {
    GetConsoleLogs,
    GetConsoleErrors,
    GetNetworkErrors,
    GetNetworkSuccess,
    GetAllXhr,
    GetSelectedElement,
    SetSelectedElement,
    CaptureScreenshot,
    GetCookies,
    GetLocalStorage,
    GetSessionStorage,
    AuditAccessibility,
    AuditPerformance,
    AuditSeo,
    AuditBestPractices,
}

impl ToolKind {
    pub const fn as_str(&self) -> &'static str {
        match self {
            Self::GetConsoleLogs => "getConsoleLogs",
            Self::GetConsoleErrors => "getConsoleErrors",
            Self::GetNetworkErrors => "getNetworkErrors",
            Self::GetNetworkSuccess => "getNetworkSuccess",
            Self::GetAllXhr => "getAllXhr",
            Self::GetSelectedElement => "getSelectedElement",
            Self::SetSelectedElement => "setSelectedElement",
            Self::CaptureScreenshot => "captureScreenshot",
            Self::GetCookies => "getCookies",
            Self::GetLocalStorage => "getLocalStorage",
            Self::GetSessionStorage => "getSessionStorage",
            Self::AuditAccessibility => "auditAccessibility",
            Self::AuditPerformance => "auditPerformance",
            Self::AuditSeo => "auditSeo",
            Self::AuditBestPractices => "auditBestPractices",
        }
    }

    pub fn description(&self) -> &'static str {
        match self {
            Self::GetConsoleLogs => "Return console logs",
            Self::GetConsoleErrors => "Return console errors",
            Self::GetNetworkErrors => "Return network errors",
            Self::GetNetworkSuccess => "Return successful network requests",
            Self::GetAllXhr => "Return merged XHR list",
            Self::GetSelectedElement => "Get selected element",
            Self::SetSelectedElement => "Set selected element",
            Self::CaptureScreenshot => "Capture screenshot and return storage marker",
            Self::GetCookies => "List cookies",
            Self::GetLocalStorage => "Get localStorage",
            Self::GetSessionStorage => "Get sessionStorage",
            Self::AuditAccessibility => "Run accessibility audit",
            Self::AuditPerformance => "Run performance audit",
            Self::AuditSeo => "Run SEO audit",
            Self::AuditBestPractices => "Run best practices audit",
        }
    }

    pub fn input_schema(&self) -> Value {
        match self {
            Self::SetSelectedElement => {
                json!({
                    "type": "object",
                    "properties": {
                        "data": {
                            "type": "object",
                            "properties": {
                                "tagName": {"type":"string"},
                                "id": {"type":"string"},
                                "className": {"type":"string"},
                                "textContent": {"type":"string"},
                                "attributes": {
                                    "type":"array",
                                    "items": {"type":"object","properties":{"name":{"type":"string"},"value":{"type":"string"}},"required":["name","value"],"additionalProperties":false}
                                }
                            },
                            "required": ["tagName","id","className","textContent","attributes"],
                            "additionalProperties": false
                        }
                    },
                    "required": ["data"],
                    "additionalProperties": false
                })
            }
            Self::CaptureScreenshot => {
                json!({
                    "type":"object",
                    "properties": {
                        "title": {"type":"string"},
                        "image": {"type":"string","description":"Base64 image payload"}
                    },
                    "required": [],
                    "additionalProperties": false
                })
            }
            _ => json!({
                "type": "object",
                "properties": {},
                "additionalProperties": false
            }),
        }
    }

    pub fn all() -> Vec<Self> {
        vec![
            Self::GetConsoleLogs,
            Self::GetConsoleErrors,
            Self::GetNetworkErrors,
            Self::GetNetworkSuccess,
            Self::GetAllXhr,
            Self::GetSelectedElement,
            Self::SetSelectedElement,
            Self::CaptureScreenshot,
            Self::GetCookies,
            Self::GetLocalStorage,
            Self::GetSessionStorage,
            Self::AuditAccessibility,
            Self::AuditPerformance,
            Self::AuditSeo,
            Self::AuditBestPractices,
        ]
    }

    pub fn from_name(name: &str) -> Option<Self> {
        match name {
            "getConsoleLogs" => Some(Self::GetConsoleLogs),
            "getConsoleErrors" => Some(Self::GetConsoleErrors),
            "getNetworkErrors" => Some(Self::GetNetworkErrors),
            "getNetworkSuccess" => Some(Self::GetNetworkSuccess),
            "getAllXhr" => Some(Self::GetAllXhr),
            "getSelectedElement" => Some(Self::GetSelectedElement),
            "setSelectedElement" => Some(Self::SetSelectedElement),
            "captureScreenshot" => Some(Self::CaptureScreenshot),
            "getCookies" => Some(Self::GetCookies),
            "getLocalStorage" => Some(Self::GetLocalStorage),
            "getSessionStorage" => Some(Self::GetSessionStorage),
            "auditAccessibility" => Some(Self::AuditAccessibility),
            "auditPerformance" => Some(Self::AuditPerformance),
            "auditSeo" => Some(Self::AuditSeo),
            "auditBestPractices" => Some(Self::AuditBestPractices),
            _ => None,
        }
    }
}

/// Return the list of MCP tools with stable names.
/// This list mirrors the legacy JS server surface.
pub fn list_tools() -> Vec<Tool> {
    let mut v = Vec::new();
    let mut push = |kind: ToolKind| {
        v.push(Tool {
            name: kind.as_str().to_string(),
            description: kind.description().to_string(),
            input_schema: kind.input_schema(),
        });
    };
    for kind in ToolKind::all() {
        push(kind);
    }
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

    #[test]
    fn tool_lookup_exists() {
        assert_eq!(
            ToolKind::from_name("getConsoleLogs"),
            Some(ToolKind::GetConsoleLogs)
        );
        assert!(ToolKind::from_name("missing-tool").is_none());
    }

    #[test]
    fn selected_element_schema_requires_data() {
        let schema = ToolKind::SetSelectedElement.input_schema();
        assert_eq!(schema["type"], "object");
        assert_eq!(schema["required"][0], "data");
    }
}
