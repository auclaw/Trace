//! DNS-based website blocking for distraction-free focus mode
//! Uses system hosts file modification to block distracting websites

use std::collections::HashSet;
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::Path;
use std::sync::{Arc, Mutex};

/// DNS blocking manager that handles hosts file modifications
#[derive(Clone)]
pub struct DnsBlockManager {
    blocked_domains: Arc<Mutex<HashSet<String>>>,
    schedule_mode: Arc<Mutex<String>>,
    is_running: Arc<Mutex<bool>>,
}

impl DnsBlockManager {
    pub fn new() -> Self {
        Self {
            blocked_domains: Arc::new(Mutex::new(HashSet::new())),
            schedule_mode: Arc::new(Mutex::new("focus".to_string())),
            is_running: Arc::new(Mutex::new(false)),
        }
    }

    /// Update the list of blocked domains and apply changes
    pub fn update_blocked_domains(&mut self, domains: Vec<String>, schedule_mode: String) -> io::Result<()> {
        // Store the new list
        {
            let mut blocked = self.blocked_domains.lock().unwrap();
            *blocked = domains.into_iter().collect();
            let mut mode = self.schedule_mode.lock().unwrap();
            *mode = schedule_mode;
        }

        // If always mode, apply immediately
        let mode = self.schedule_mode.lock().unwrap().clone();
        if mode == "always" {
            self.apply_blocking()?;
            *self.is_running.lock().unwrap() = true;
        } else if mode == "focus" {
            // Will be applied when focus starts via command
            self.remove_blocking()?;
            *self.is_running.lock().unwrap() = false;
        }

        Ok(())
    }

    /// Enable blocking (called when focus starts in focus-only mode)
    pub fn enable_blocking(&mut self) -> io::Result<()> {
        let mode = self.schedule_mode.lock().unwrap().clone();
        match mode.as_str() {
            "focus" => {
                self.apply_blocking()?;
                *self.is_running.lock().unwrap() = true;
                Ok(())
            }
            "always" => {
                // Already applied
                Ok(())
            }
            "custom" => {
                // Custom schedule handled by frontend timing
                self.apply_blocking()?;
                *self.is_running.lock().unwrap() = true;
                Ok(())
            }
            _ => Ok(()),
        }
    }

    /// Disable blocking (called when focus ends in focus-only mode)
    pub fn disable_blocking(&mut self) -> io::Result<()> {
        let mode = self.schedule_mode.lock().unwrap().clone();
        if mode != "always" {
            self.remove_blocking()?;
            *self.is_running.lock().unwrap() = false;
        }
        Ok(())
    }

    /// Check if blocking is currently active
    pub fn is_active(&self) -> bool {
        *self.is_running.lock().unwrap()
    }

    /// Apply blocking by adding domains to hosts file
    fn apply_blocking(&self) -> io::Result<()> {
        let blocked = self.blocked_domains.lock().unwrap();
        if blocked.is_empty() {
            return self.remove_blocking();
        }

        let hosts_path = get_hosts_path()?;
        let (content, has_existing_marker) = read_hosts_content(&hosts_path)?;

        // Build new content with our blocked domains
        let mut new_content = String::new();

        // Copy original content without our existing block
        if has_existing_marker {
            // We already have a marker, skip everything between the markers
            let mut skipping = false;
            for line in content.lines() {
                if line.contains("# BEGIN TRACE BLOCK") {
                    skipping = true;
                    continue;
                }
                if line.contains("# END TRACE BLOCK") {
                    skipping = false;
                    continue;
                }
                if !skipping {
                    new_content.push_str(line);
                    new_content.push('\n');
                }
            }
        } else {
            // Just copy everything
            for line in content.lines() {
                new_content.push_str(line);
                new_content.push('\n');
            }
        }

        // Add our blocked domains
        new_content.push_str("\n# BEGIN TRACE BLOCK - Distraction Free Focus Mode\n");
        new_content.push_str("# This section is automatically managed by Trace\n");
        new_content.push_str("# https://github.com/auclaw/Trace\n");
        new_content.push('\n');

        for domain in blocked.iter() {
            let domain_clean = domain.trim().to_lowercase();
            if !domain_clean.is_empty() {
                new_content.push_str(&format!("127.0.0.1   {}\n", domain_clean));
                new_content.push_str(&format!("127.0.0.1   www.{}\n", domain_clean));
            }
        }

        new_content.push_str("\n# END TRACE BLOCK\n");

        // Write back
        write_hosts_content(&hosts_path, &new_content)?;

        Ok(())
    }

    /// Remove blocking by removing our section from hosts file
    fn remove_blocking(&self) -> io::Result<()> {
        let hosts_path = get_hosts_path()?;
        let (content, has_existing_marker) = read_hosts_content(&hosts_path)?;

        if !has_existing_marker {
            return Ok(()); // Nothing to remove
        }

        // Rebuild content without our section
        let mut new_content = String::new();
        let mut skipping = false;

        for line in content.lines() {
            if line.contains("# BEGIN TRACE BLOCK") {
                skipping = true;
                continue;
            }
            if line.contains("# END TRACE BLOCK") {
                skipping = false;
                continue;
            }
            if !skipping {
                new_content.push_str(line);
                new_content.push('\n');
            }
        }

        // Trim trailing newlines
        while new_content.ends_with('\n') {
            new_content.pop();
        }
        if !new_content.is_empty() {
            new_content.push('\n');
        }

        write_hosts_content(&hosts_path, &new_content)?;

        Ok(())
    }
}

/// Get the path to the system hosts file
fn get_hosts_path() -> io::Result<&'static Path> {
    #[cfg(target_os = "windows")]
    {
        Ok(Path::new(r"C:\Windows\System32\drivers\etc\hosts"))
    }
    #[cfg(target_os = "macos")]
    {
        Ok(Path::new("/etc/hosts"))
    }
    #[cfg(target_os = "linux")]
    {
        Ok(Path::new("/etc/hosts"))
    }
}

/// Read hosts file content and check if we already have our marker
fn read_hosts_content(path: &Path) -> io::Result<(String, bool)> {
    let content = fs::read_to_string(path)?;
    let has_marker = content.contains("# BEGIN TRACE BLOCK");
    Ok((content, has_marker))
}

/// Write content back to hosts file (requires admin/root privileges)
fn write_hosts_content(path: &Path, content: &str) -> io::Result<()> {
    // Open with write access, truncate existing content
    let mut file = OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(path)?;

    file.write_all(content.as_bytes())?;
    file.flush()?;

    Ok(())
}

/// Check if we have the necessary permissions to modify hosts file
pub fn check_permissions() -> bool {
    let hosts_path = match get_hosts_path() {
        Ok(p) => p,
        Err(_) => return false,
    };

    // Check if we can write to it
    fs::OpenOptions::new()
        .write(true)
        .open(hosts_path)
        .is_ok()
}
