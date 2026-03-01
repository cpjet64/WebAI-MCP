use std::collections::VecDeque;

use crate::{CoreError, CoreResult};

/// Values that can be safely truncated without breaking JSON.
pub trait Truncatable: Clone {
    /// Estimate size in characters when serialized.
    fn estimated_size(&self) -> usize;
    /// Return a copy with all strings truncated to `max` chars.
    fn truncate_strings(&self, max: usize) -> Self;
}

/// Bounded ring buffer with JSON-safe truncation on export.
#[derive(Debug, Clone)]
pub struct RingBuffer<T: Truncatable> {
    cap: usize,
    buf: VecDeque<T>,
}

impl<T: Truncatable> RingBuffer<T> {
    /// Create a new ring buffer with a positive capacity.
    pub fn new(capacity: usize) -> CoreResult<Self> {
        if capacity == 0 {
            return Err(CoreError::new("capacity must be > 0"));
        }
        Ok(Self {
            cap: capacity,
            buf: VecDeque::with_capacity(capacity),
        })
    }

    /// Current number of items.
    pub fn len(&self) -> usize {
        self.buf.len()
    }

    /// True if empty.
    pub fn is_empty(&self) -> bool {
        self.buf.is_empty()
    }

    /// Push a new item, evicting the oldest if full.
    pub fn push(&mut self, item: T) {
        if self.buf.len() == self.cap {
            self.buf.pop_front();
        }
        self.buf.push_back(item);
    }

    /// Remove all items.
    pub fn clear(&mut self) {
        self.buf.clear();
    }

    /// Export items, truncating strings and obeying a size budget.
    /// Items beyond `query_limit` (in characters) are dropped.
    pub fn to_truncated_vec(&self, string_limit: usize, query_limit: usize) -> Vec<T> {
        let mut out = Vec::new();
        let mut size = 0usize;
        for item in &self.buf {
            let t = item.truncate_strings(string_limit);
            let est = t.estimated_size();
            if size + est > query_limit {
                break;
            }
            size += est;
            out.push(t);
        }
        out
    }

    /// Clone all items in insertion order.
    pub fn to_vec(&self) -> Vec<T> {
        self.buf.iter().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Debug, Clone)]
    struct Dummy {
        a: String,
        b: String,
    }

    impl Truncatable for Dummy {
        fn estimated_size(&self) -> usize {
            // naive: quotes + comma + braces ~ 6 chars overhead
            self.a.len() + self.b.len() + 6
        }
        fn truncate_strings(&self, max: usize) -> Self {
            let trunc = |s: &str| {
                if s.len() > max {
                    s[..max].to_string()
                } else {
                    s.to_string()
                }
            };
            Self {
                a: trunc(&self.a),
                b: trunc(&self.b),
            }
        }
    }

    #[test]
    fn evicts_oldest_when_full() {
        let mut rb = RingBuffer::<Dummy>::new(2).unwrap();
        rb.push(Dummy {
            a: "1".into(),
            b: "x".into(),
        });
        rb.push(Dummy {
            a: "2".into(),
            b: "x".into(),
        });
        rb.push(Dummy {
            a: "3".into(),
            b: "x".into(),
        });
        let v = rb.to_truncated_vec(10, 1000);
        assert_eq!(v.len(), 2);
        assert_eq!(v[0].a, "2");
        assert_eq!(v[1].a, "3");
    }

    #[test]
    fn truncates_and_respects_query_limit() {
        let mut rb = RingBuffer::<Dummy>::new(3).unwrap();
        rb.push(Dummy {
            a: "aaaaa".into(),
            b: "bbbbb".into(),
        });
        rb.push(Dummy {
            a: "ccccc".into(),
            b: "ddddd".into(),
        });
        // string_limit = 3, query_limit small so only first fits
        let v = rb.to_truncated_vec(3, 20);
        assert_eq!(v.len(), 1);
        assert_eq!(v[0].a, "aaa");
        assert_eq!(v[0].b, "bbb");
    }
}
