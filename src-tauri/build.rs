use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

fn main() {
    inject_secrets();
    tauri_build::build()
}

fn inject_secrets() {
    let contents = match std::fs::read_to_string("quinco_secrets.key") {
        Ok(c) => c,
        Err(e) => panic!("build.rs: failed to read quinco_secrets.key: {}", e),
    };

    let secrets = parse_secrets(&contents);
    let seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();

    for (name, value) in &secrets {
        let mask = generate_xor_key(seed, name);
        let obfuscated: Vec<u8> = value
            .bytes()
            .zip(mask.iter().cycle())
            .map(|(b, &k)| b ^ k)
            .collect();
        println!(
            "cargo:rustc-env=OBFUSCATED_{}={}",
            name,
            to_hex(&obfuscated)
        );
        println!("cargo:rustc-env=XOR_KEY_{}={}", name, to_hex(&mask));
    }
}

fn parse_secrets(contents: &str) -> HashMap<String, String> {
    contents
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                return None;
            }
            line.split_once('=')
                .map(|(k, v)| (k.trim().to_string(), v.trim().to_string()))
        })
        .collect()
}

fn generate_xor_key(seed: u128, salt: &str) -> Vec<u8> {
    let mut state = seed
        ^ salt
            .bytes()
            .fold(0u128, |acc, b| acc.wrapping_add(b as u128));
    (0..32)
        .map(|_| {
            state = state
                .wrapping_mul(6364136223846793005)
                .wrapping_add(1442695040888963407);
            (state >> 56) as u8
        })
        .collect()
}

fn to_hex(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut s = String::with_capacity(bytes.len() * 2);
    for &b in bytes {
        s.push(HEX[(b >> 4) as usize] as char);
        s.push(HEX[(b & 0xf) as usize] as char);
    }
    s
}
