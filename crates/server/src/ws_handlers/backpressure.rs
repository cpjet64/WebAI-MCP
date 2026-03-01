use std::sync::atomic::{AtomicUsize, Ordering};

static INFLIGHT: AtomicUsize = AtomicUsize::new(0);

fn ws_limit() -> usize {
    std::env::var("WEBAI_WS_MAX_INFLIGHT")
        .ok()
        .and_then(|v| v.parse::<usize>().ok())
        .unwrap_or(16)
}

pub(super) struct InflightGuard;
impl Drop for InflightGuard {
    fn drop(&mut self) {
        INFLIGHT.fetch_sub(1, Ordering::SeqCst);
    }
}

pub(super) fn try_acquire_inflight() -> Option<InflightGuard> {
    let limit = ws_limit();
    if limit == 0 {
        return None;
    }
    let mut cur = INFLIGHT.load(Ordering::Relaxed);
    loop {
        if cur >= limit {
            return None;
        }
        match INFLIGHT.compare_exchange(cur, cur + 1, Ordering::SeqCst, Ordering::Relaxed) {
            Ok(_) => return Some(InflightGuard),
            Err(c) => {
                cur = c;
            }
        }
    }
}
