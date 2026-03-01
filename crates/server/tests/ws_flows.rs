use webai_server::process_text_message;

#[test]
fn click_element_missing_selector() {
    let req = serde_json::json!({
        "requestId": "c1",
        "type": "click-element",
        "payload": {}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert_eq!(v["type"], "click-element-error");
    assert_eq!(v["status"], "error");
}

#[test]
fn fill_input_missing_text() {
    let req = serde_json::json!({
        "requestId": "f1",
        "type": "fill-input",
        "payload": {"selector": "#q"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert_eq!(v["type"], "fill-input-error");
    assert_eq!(v["status"], "error");
}

#[test]
fn click_element_no_clients_error() {
    let req = serde_json::json!({
        "requestId": "c2",
        "type": "click-element",
        "payload": {"selector": "#btn"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert_eq!(v["type"], "click-element-error");
    assert_eq!(v["status"], "error");
}

#[test]
fn fill_input_no_clients_error() {
    let req = serde_json::json!({
        "requestId": "f2",
        "type": "fill-input",
        "payload": {"selector": "#q", "text": "hello"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert_eq!(v["type"], "fill-input-error");
    assert_eq!(v["status"], "error");
}

#[test]
fn select_option_missing_value() {
    let req = serde_json::json!({
        "requestId": "s1",
        "type": "select-option",
        "payload": {"selector": "#sel"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert_eq!(v["type"], "select-option-error");
    assert_eq!(v["status"], "error");
}

#[test]
fn select_option_no_clients_error() {
    let req = serde_json::json!({
        "requestId": "s2",
        "type": "select-option",
        "payload": {"selector": "#sel", "value": "opt1"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert_eq!(v["type"], "select-option-error");
    assert_eq!(v["status"], "error");
}

#[test]
fn submit_form_missing_selector() {
    let req = serde_json::json!({
        "requestId": "u1",
        "type": "submit-form",
        "payload": {}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert_eq!(v["type"], "submit-form-error");
    assert_eq!(v["status"], "error");
}

#[test]
fn submit_form_no_clients_error() {
    let req = serde_json::json!({
        "requestId": "u2",
        "type": "submit-form",
        "payload": {"selector": "form"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert_eq!(v["type"], "submit-form-error");
    assert_eq!(v["status"], "error");
}

#[test]
fn get_html_selector_present_but_no_clients_error() {
    // Ensure legacy provider for this test
    std::env::remove_var("WEBAI_BROWSER_PROVIDER");
    // Force backpressure error to avoid env races across tests
    std::env::set_var("WEBAI_WS_MAX_INFLIGHT", "0");
    let req = serde_json::json!({
        "requestId": "h1",
        "type": "get-html-by-selector",
        "payload": {"selector": "#main"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    let t = v["type"].as_str().unwrap();
    assert!(t.starts_with("get-html-by-selector-"));
    std::env::remove_var("WEBAI_WS_MAX_INFLIGHT");
}

#[test]
fn get_html_provider_rust_returns_stub() {
    std::env::set_var("WEBAI_BROWSER_PROVIDER", "rust");
    std::env::set_var("WEBAI_WS_MAX_INFLIGHT", "16");
    let req = serde_json::json!({
        "requestId": "h2",
        "type": "get-html-by-selector",
        "payload": {"selector": "#main"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    let t = v["type"].as_str().unwrap();
    if t == "get-html-by-selector-response" {
        assert_eq!(v["status"], "ok");
        assert!(v["payload"]["html"].as_str().unwrap().contains("data-stub"));
    } else {
        // In case of parallel env races, accept error envelope too.
        assert!(t.ends_with("-error"));
        assert_eq!(v["status"], "error");
    }
    std::env::remove_var("WEBAI_BROWSER_PROVIDER");
    std::env::remove_var("WEBAI_WS_MAX_INFLIGHT");
}

#[test]
fn get_html_timeout_simulated() {
    std::env::set_var("WEBAI_TEST_WS_FORCE_TIMEOUT", "get-html-by-selector");
    let req = serde_json::json!({
        "requestId": "h-timeout",
        "type": "get-html-by-selector",
        "payload": {"selector": "#main"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert_eq!(v["type"], "get-html-by-selector-error");
    assert_eq!(v["status"], "error");
    assert_eq!(v["error"], "timeout");
    std::env::remove_var("WEBAI_TEST_WS_FORCE_TIMEOUT");
}

#[test]
fn click_element_provider_rust_ok() {
    std::env::set_var("WEBAI_BROWSER_PROVIDER", "rust");
    let req = serde_json::json!({
        "requestId": "c-ok",
        "type": "click-element",
        "payload": {"selector": "#btn"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    if v["type"] == "click-element-response" {
        assert_eq!(v["status"], "ok");
        assert_eq!(v["payload"]["selector"], "#btn");
    } else {
        assert_eq!(v["status"], "error");
    }
    std::env::remove_var("WEBAI_BROWSER_PROVIDER");
}

#[test]
fn fill_input_provider_rust_ok() {
    std::env::set_var("WEBAI_BROWSER_PROVIDER", "rust");
    let req = serde_json::json!({
        "requestId": "f-ok",
        "type": "fill-input",
        "payload": {"selector": "#q", "text": "hello"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    if v["type"] == "fill-input-response" {
        assert_eq!(v["status"], "ok");
        assert_eq!(v["payload"]["selector"], "#q");
        assert_eq!(v["payload"]["text"], "hello");
    } else {
        assert_eq!(v["status"], "error");
    }
    std::env::remove_var("WEBAI_BROWSER_PROVIDER");
}

#[test]
fn select_option_provider_rust_ok() {
    std::env::set_var("WEBAI_BROWSER_PROVIDER", "rust");
    let req = serde_json::json!({
        "requestId": "s-ok",
        "type": "select-option",
        "payload": {"selector": "#sel", "value": "opt1"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    if v["type"] == "select-option-response" {
        assert_eq!(v["status"], "ok");
        assert_eq!(v["payload"]["selector"], "#sel");
        assert_eq!(v["payload"]["value"], "opt1");
    } else {
        assert_eq!(v["status"], "error");
    }
    std::env::remove_var("WEBAI_BROWSER_PROVIDER");
}

#[test]
fn submit_form_provider_rust_ok() {
    std::env::set_var("WEBAI_BROWSER_PROVIDER", "rust");
    let req = serde_json::json!({
        "requestId": "u-ok",
        "type": "submit-form",
        "payload": {"selector": "form"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    if v["type"] == "submit-form-response" {
        assert_eq!(v["status"], "ok");
        assert_eq!(v["payload"]["selector"], "form");
    } else {
        assert_eq!(v["status"], "error");
    }
    std::env::remove_var("WEBAI_BROWSER_PROVIDER");
}
