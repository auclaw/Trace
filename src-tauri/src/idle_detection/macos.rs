//! macOS idle detection implementation

use anyhow::Result;
use core_graphics::event_source::CGEventSourceStateID;
use core_graphics::event::CGEventType;

#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGEventSourceSecondsSinceLastEventType(
        state: CGEventSourceStateID,
        typeOfEvent: CGEventType,
    ) -> f64;
}

pub fn get_idle_time() -> Result<u64> {
    unsafe {
        // kCGAnyInputEventType is actually -1 in C API
        let any_event_type: CGEventType = std::mem::transmute(-1i32);
        let idle_time = CGEventSourceSecondsSinceLastEventType(
            CGEventSourceStateID::CombinedSessionState,
            any_event_type
        );
        Ok(idle_time.floor() as u64)
    }
}
