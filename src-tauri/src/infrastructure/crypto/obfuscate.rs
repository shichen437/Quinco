#[inline]
fn hex_val(c: u8) -> u8 {
    match c {
        b'0'..=b'9' => c - b'0',
        b'a'..=b'f' => c - b'a' + 10,
        b'A'..=b'F' => c - b'A' + 10,
        _ => 0,
    }
}

pub(super) fn decode_hex(hex: &str) -> Vec<u8> {
    let bytes = hex.as_bytes();
    let len = bytes.len() / 2;
    let mut out = Vec::with_capacity(len);
    for i in 0..len {
        out.push((hex_val(bytes[i * 2]) << 4) | hex_val(bytes[i * 2 + 1]));
    }
    out
}

fn deobfuscate(obfuscated_hex: &str, xor_key_hex: &str) -> Vec<u8> {
    let obfuscated = decode_hex(obfuscated_hex);
    let xor_key = decode_hex(xor_key_hex);
    obfuscated
        .iter()
        .zip(xor_key.iter().cycle())
        .map(|(&a, &b)| a ^ b)
        .collect()
}

pub fn get_encrypt_password() -> String {
    let obfuscated = env!("OBFUSCATED_QUINCO_ENCRYPT_PASSWORD");
    let mask = env!("XOR_KEY_QUINCO_ENCRYPT_PASSWORD");
    String::from_utf8(deobfuscate(obfuscated, mask))
        .expect("decrypted QUINCO_ENCRYPT_PASSWORD is not valid UTF-8")
}

pub fn get_encrypt_salt() -> String {
    let obfuscated = env!("OBFUSCATED_QUINCO_ENCRYPT_SALT");
    let mask = env!("XOR_KEY_QUINCO_ENCRYPT_SALT");
    String::from_utf8(deobfuscate(obfuscated, mask))
        .expect("decrypted QUINCO_ENCRYPT_SALT is not valid UTF-8")
}

pub fn encode_hex(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut s = String::with_capacity(bytes.len() * 2);
    for &b in bytes {
        s.push(HEX[(b >> 4) as usize] as char);
        s.push(HEX[(b & 0xf) as usize] as char);
    }
    s
}
