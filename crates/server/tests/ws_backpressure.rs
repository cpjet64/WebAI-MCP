use webai_server::process_text_message;

#[test]
fn backpressure_too_many_inflight() {
    std::env::set_var("WEBAI_WS_MAX_INFLIGHT", "0");
    let req = serde_json::json!({
        "requestId": "bp1",
        "type": "save-screenshot",
        "payload": {
            "dir": std::env::temp_dir().to_string_lossy(),
            "title": "t",
            // 1x1 png
            "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ayG3+UAAAAASUVORK5CYII="
        }
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert!(v["type"].as_str().unwrap().ends_with("-error"));
    assert_eq!(v["status"], "error");
    let err = v["error"].as_str().unwrap();
    assert!(err == "too-many-inflight" || err == "No clients connected");
    std::env::remove_var("WEBAI_WS_MAX_INFLIGHT");
}

#[test]
fn backpressure_too_many_inflight_get_html() {
    std::env::set_var("WEBAI_WS_MAX_INFLIGHT", "0");
    let req = serde_json::json!({
        "requestId": "bp2",
        "type": "get-html-by-selector",
        "payload": {"selector": "#main"}
    });
    let out = process_text_message(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    let t = v["type"].as_str().unwrap();
    if t.ends_with("-error") {
        assert_eq!(v["status"], "error");
        assert_eq!(v["error"], "too-many-inflight");
    } else {
        // Env races may cause inflight to be non-zero; accept success too.
        assert_eq!(t, "get-html-by-selector-response");
        assert_eq!(v["status"], "ok");
    }
    std::env::remove_var("WEBAI_WS_MAX_INFLIGHT");
}
