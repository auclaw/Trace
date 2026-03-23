//! Linux X11 idle detection implementation

use anyhow::{Result, anyhow};
use std::ptr;
use x11::xlib;
use x11::extensions::screensaver;

pub fn get_idle_time() -> Result<u64> {
    unsafe {
        let display = xlib::XOpenDisplay(ptr::null());
        if display.is_null() {
            return Err(anyhow!("Failed to open X11 display"));
        }

        let mut have_ext = 0;
        let mut event_base = 0;
        let mut error_base = 0;

        if screensaver::XScreenSaverQueryExtension(display, &mut have_ext, &mut event_base, &mut error_base) == 0 {
            xlib::XCloseDisplay(display);
            return Err(anyhow!("XScreenSaver extension not available"));
        }

        let screen = xlib::XDefaultScreen(display);
        let root = xlib::XDefaultRootWindow(display);

        let mut idle = 0;
        screensaver::XScreenSaverGetIdle(display, root, &mut idle);
        xlib::XCloseDisplay(display);

        Ok(idle / 1000)
    }
}
