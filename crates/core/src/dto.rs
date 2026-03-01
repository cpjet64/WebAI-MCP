use crate::Truncatable;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

/// Identity response for `/.identity`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct Identity {
    pub port: u16,
    pub name: String,
    pub version: String,
    pub signature: String,
    pub uptime: f64,
    #[serde(rename = "nodeVersion")]
    pub node_version: String,
    pub platform: String,
    pub arch: String,
}

/// A simple HTTP header pair.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct Header {
    pub name: String,
    pub value: String,
}

/// Console log entry.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct ConsoleEntry {
    #[serde(rename = "type")] // "console-log" or "console-error"
    pub kind: String,
    pub level: String, // e.g., "log", "warn", "error"
    pub message: String,
    pub timestamp: i64, // epoch millis
}

/// Network request entry.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct NetworkRequest {
    pub url: String,
    pub method: String,
    pub status: i32,
    pub request_headers: Option<Vec<Header>>,
    pub response_headers: Option<Vec<Header>>,
    pub request_body: Option<String>,
    pub response_body: Option<String>,
    pub timestamp: Option<i64>,
}

/// A DOM attribute pair.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct Attribute {
    pub name: String,
    pub value: String,
}

/// Selected element payload.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct SelectedElement {
    #[serde(rename = "tagName")]
    pub tag_name: String,
    pub id: String,
    #[serde(rename = "className")]
    pub class_name: String,
    #[serde(rename = "textContent")]
    pub text_content: Option<String>,
    pub attributes: Vec<Attribute>,
}

/// Audit category identifiers.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "kebab-case")]
pub enum AuditCategory {
    Accessibility,
    Performance,
    Seo,
    BestPractices,
    Pwa,
}

/// Lighthouse report metadata.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct AuditMetadata {
    pub url: String,
    pub timestamp: String,
    pub device: String,
    #[serde(rename = "lighthouseVersion")]
    pub lighthouse_version: String,
}

/// Generic Lighthouse report container.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct LighthouseReport<T> {
    pub metadata: AuditMetadata,
    pub overall_score: Option<f64>,
    pub failed_audits_count: Option<usize>,
    pub passed_audits_count: Option<usize>,
    pub manual_audits_count: Option<usize>,
    pub informative_audits_count: Option<usize>,
    pub not_applicable_audits_count: Option<usize>,
    pub failed_audits: Option<Vec<String>>,
    pub report: Option<T>,
}

impl Truncatable for ConsoleEntry {
    fn estimated_size(&self) -> usize {
        // Rough estimate to align with JSON size behavior.
        self.kind.len() + self.level.len() + self.message.len() + 32
    }
    fn truncate_strings(&self, max: usize) -> Self {
        let mut msg = self.message.clone();
        if msg.len() > max {
            msg.truncate(max);
        }
        Self {
            kind: self.kind.clone(),
            level: self.level.clone(),
            message: msg,
            timestamp: self.timestamp,
        }
    }
}

impl Truncatable for NetworkRequest {
    fn estimated_size(&self) -> usize {
        let mut n = self.url.len() + self.method.len() + 32;
        if let Some(b) = &self.request_body {
            n += b.len();
        }
        if let Some(b) = &self.response_body {
            n += b.len();
        }
        n
    }
    fn truncate_strings(&self, max: usize) -> Self {
        let trunc_opt = |s: &Option<String>| {
            s.as_ref().map(|v| {
                let mut c = v.clone();
                if c.len() > max {
                    c.truncate(max);
                }
                c
            })
        };
        Self {
            url: self.url.clone(),
            method: self.method.clone(),
            status: self.status,
            request_headers: self.request_headers.clone(),
            response_headers: self.response_headers.clone(),
            request_body: trunc_opt(&self.request_body),
            response_body: trunc_opt(&self.response_body),
            timestamp: self.timestamp,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identity_fields_roundtrip() {
        let id = Identity {
            port: 3025,
            name: "webai-server".into(),
            version: "1.0.0".into(),
            signature: "sig".into(),
            uptime: 12.5,
            node_version: "v20".into(),
            platform: "linux".into(),
            arch: "x64".into(),
        };
        assert_eq!(id.port, 3025);
        assert!(id.name.contains("webai"));
    }
}
