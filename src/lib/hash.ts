/**
 * Generates a cryptographically secure random salt.
 * @returns {Uint8Array} A 16-byte random salt.
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Derives a key from a password and salt using PBKDF2.
 * @param {string} password - The password to hash.
 * @param {Uint8Array} salt - The salt to use.
 * @param {number} iterations - The number of iterations.
 * @returns {Promise<ArrayBuffer>} The derived key as an ArrayBuffer.
 */
async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<ArrayBuffer> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 256 bits
  )
}

/**
 * Hashes a password with PBKDF2 and returns a formatted string including salt and iterations.
 * @param {string} input - The password to hash.
 * @param {number} [iterations=600000] - The number of iterations to use.
 * @returns {Promise<string>} A promise that resolves to the formatted hash string.
 */
export async function pbkdf2Hash(
  input: string,
  iterations: number = 600_000
): Promise<string> {
  const salt = generateSalt()
  const hashBuffer = await pbkdf2(input, salt, iterations)
  const saltString = toBase64(salt)
  const hashString = toBase64(new Uint8Array(hashBuffer))
  return `pbkdf2-sha256$${iterations}$${saltString}$${hashString}`
}

/**
 * Verifies a password against a formatted PBKDF2 hash.
 * @param {string} hash - The formatted hash string.
 * @param {string} input - The password to verify.
 * @returns {Promise<boolean>} A promise that resolves to true if the password is correct, false otherwise.
 */
export async function hashVerify(
  hash: string,
  input: string
): Promise<boolean> {
  const parts = hash.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') {
    return false
  }
  const iterations = parseInt(parts[1], 10)
  const salt = fromBase64(parts[2])
  const storedHash = fromBase64(parts[3])

  const inputHashBuffer = await pbkdf2(input, salt, iterations)
  const inputHash = new Uint8Array(inputHashBuffer)

  if (inputHash.length !== storedHash.length) return false
  // ik it's not constant-time, we're clientside so it doesn't matter
  for (let i = 0; i < inputHash.length; i++) {
    if (inputHash[i] !== storedHash[i]) return false
  }
  return true
}
