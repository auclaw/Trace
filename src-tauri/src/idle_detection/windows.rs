//! Windows idle detection implementation

use anyhow::{Result, anyhow};
use winapi::um::winuser::{GetLastInputInfo, LASTINPUTINFO};
use winapi::um::sysinfoapi::GetTickCount;

pub fn get_idle_time() -> Result<u64> {
    unsafe {
        let mut info: LASTINPUTINFO = std::mem::zeroed();
        info.cbSize = std::mem::size_of::<LASTINPUTINFO>() as u32;

        if GetLastInputInfo(&mut info) == 0 {
            return Err(anyhow!("Failed to get last input info from Windows"));
        }

        let tick_count = GetTickCount();
        let idle_ms = tick_count - info.dwTime;
        Ok((idle_ms / 1000) as u64
    }
}
