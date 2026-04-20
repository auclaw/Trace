//! Linux X11 idle detection implementation
//! Uses XScreenSaver extension via the x11 crate's xss feature

use anyhow::{Result, anyhow};
use std::ptr;
use x11::xlib;
use x11::xss;

pub fn get_idle_time() -> Result<u64> {
    unsafe {
        let display = xlib::XOpenDisplay(ptr::null());
        if display.is_null() {
            return Err(anyhow!("Failed to open X11 display"));
        }

        let mut event_base = 0;
        let mut error_base = 0;

        if xss::XScreenSaverQueryExtension(display, &mut event_base, &mut error_base) == 0 {
            xlib::XCloseDisplay(display);
            return Err(anyhow!("XScreenSaver extension not available"));
        }

        let root = xlib::XDefaultRootWindow(display);

        let info = xss::XScreenSaverAllocInfo();
        if info.is_null() {
            xlib::XCloseDisplay(display);
            return Err(anyhow!("Failed to allocate XScreenSaverInfo"));
        }

        let status = xss::XScreenSaverQueryInfo(display, root, info);
        let idle_ms = if status != 0 {
            (*info).idle
        } else {
            xlib::XFree(info as *mut _);
            xlib::XCloseDisplay(display);
            return Err(anyhow!("XScreenSaverQueryInfo failed"));
        };

        xlib::XFree(info as *mut _);
        xlib::XCloseDisplay(display);

        Ok(idle_ms / 1000)
    }
}
