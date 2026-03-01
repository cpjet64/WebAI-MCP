use webai_server::new_state;

#[test]
fn ws_client_counter_increments_and_decrements() {
    let state = new_state(0);
    assert_eq!(state.ws_client_count(), 0);
    state.inc_ws();
    assert_eq!(state.ws_client_count(), 1);
    state.dec_ws();
    assert_eq!(state.ws_client_count(), 0);
}
