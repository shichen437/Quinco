use aes::Aes256;
use cbc::cipher::{BlockDecryptMut, BlockEncryptMut, KeyIvInit};
use pbkdf2::pbkdf2_hmac;
use rand::RngCore;
use sha2::Sha256;

use crate::shared::error::DomainError;

use super::obfuscate;

const PBKDF2_ITERATIONS: u32 = 100_000;
const KEY_SIZE: usize = 32;
const IV_SIZE: usize = 16;
const SALT_SIZE: usize = 16;

type Aes256CbcEnc = cbc::Encryptor<Aes256>;
type Aes256CbcDec = cbc::Decryptor<Aes256>;

pub(crate) fn encrypt(plaintext: &str) -> Result<String, DomainError> {
    let password = obfuscate::get_encrypt_password();
    let base_salt = obfuscate::get_encrypt_salt();

    let mut salt = [0u8; SALT_SIZE];
    rand::thread_rng().fill_bytes(&mut salt);

    let mut iv = [0u8; IV_SIZE];
    rand::thread_rng().fill_bytes(&mut iv);

    let base_salt_bytes = base_salt.as_bytes();
    let combined_salt: Vec<u8> = salt.iter().chain(base_salt_bytes.iter()).copied().collect();
    let mut key = [0u8; KEY_SIZE];
    pbkdf2_hmac::<Sha256>(
        password.as_bytes(),
        &combined_salt,
        PBKDF2_ITERATIONS,
        &mut key,
    );

    let cipher = Aes256CbcEnc::new_from_slices(&key, &iv).map_err(DomainError::infra)?;
    let ciphertext =
        cipher.encrypt_padded_vec_mut::<cbc::cipher::block_padding::Pkcs7>(plaintext.as_bytes());

    let mut result = Vec::with_capacity(SALT_SIZE + IV_SIZE + ciphertext.len());
    result.extend_from_slice(&salt);
    result.extend_from_slice(&iv);
    result.extend_from_slice(&ciphertext);

    Ok(obfuscate::encode_hex(&result))
}

pub(crate) fn decrypt(ciphertext_hex: &str) -> Result<String, DomainError> {
    let password = obfuscate::get_encrypt_password();
    let base_salt = obfuscate::get_encrypt_salt();

    let data = obfuscate::decode_hex(ciphertext_hex);
    if data.len() < SALT_SIZE + IV_SIZE {
        return Err(DomainError::validation(
            "ciphertext too short: missing salt or IV",
        ));
    }

    let salt = &data[..SALT_SIZE];
    let iv = &data[SALT_SIZE..SALT_SIZE + IV_SIZE];
    let ciphertext = &data[SALT_SIZE + IV_SIZE..];

    let base_salt_bytes = base_salt.as_bytes();
    let combined_salt: Vec<u8> = salt.iter().chain(base_salt_bytes.iter()).copied().collect();
    let mut key = [0u8; KEY_SIZE];
    pbkdf2_hmac::<Sha256>(
        password.as_bytes(),
        &combined_salt,
        PBKDF2_ITERATIONS,
        &mut key,
    );

    let cipher = Aes256CbcDec::new_from_slices(&key, iv).map_err(DomainError::infra)?;
    let plaintext = cipher
        .decrypt_padded_vec_mut::<cbc::cipher::block_padding::Pkcs7>(ciphertext)
        .map_err(|_| {
            DomainError::validation("decryption failed: invalid ciphertext or password")
        })?;

    String::from_utf8(plaintext)
        .map_err(|_| DomainError::validation("decrypted data is not valid UTF-8"))
}
