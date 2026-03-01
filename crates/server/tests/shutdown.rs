use std::net::SocketAddr;
use std::time::Duration;

use webai_server::{router_with_port, serve_with_shutdown};

#[tokio::test]
async fn server_stops_on_shutdown_signal() {
    let router = router_with_port(0);
    let addr: SocketAddr = "127.0.0.1:0".parse().unwrap();
    let (tx, rx) = tokio::sync::oneshot::channel::<()>();

    let server = tokio::spawn(async move {
        let shutdown = async move {
            let _ = rx.await;
        };
        let _ = serve_with_shutdown(router, addr, shutdown).await;
    });

    // Let the server bind
    tokio::time::sleep(Duration::from_millis(50)).await;

    // Trigger shutdown and expect task to end quickly
    let _ = tx.send(());
    tokio::time::timeout(Duration::from_secs(2), server)
        .await
        .expect("server did not stop in time")
        .expect("join ok");
}
