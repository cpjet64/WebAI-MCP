use webai_server::ws_schema::process_ws_text;

#[test]
fn ws_ping_roundtrip() {
    let req = serde_json::json!({
        "requestId": "1",
        "type": "ping",
        "payload": {"x": 1}
    });
    let out = process_ws_text(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert_eq!(v["requestId"], "1");
    assert_eq!(v["type"], "ping-response");
    assert_eq!(v["status"], "ok");
    assert_eq!(v["payload"]["x"], 1);
}

#[test]
fn ws_parse_error() {
    let out = process_ws_text("not json");
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert_eq!(v["type"], "parse-error");
    assert_eq!(v["status"], "error");
}

#[test]
fn ws_heartbeat_roundtrip_without_request_id() {
    let req = serde_json::json!({
        "type": "heartbeat"
    });
    let out = process_ws_text(&req.to_string());
    let v: serde_json::Value = serde_json::from_str(&out).unwrap();
    assert_eq!(v["type"], "heartbeat-response");
    assert_eq!(v["status"], "ok");
    assert_eq!(v["requestId"], "");
}
