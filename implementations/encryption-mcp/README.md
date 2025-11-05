# Encryption MCP Server

مخدم MCP شامل للتشفير وفك التشفير بجميع الأنواع والخوارزميات.

## المميزات

### التشفير المتقدم (Modern Cryptography)
- **AES (Advanced Encryption Standard)**: تشفير متماثل قوي
- **RSA**: تشفير غير متماثل مع مفاتيح عامة/خاصة
- **ChaCha20**: تشفير stream cipher حديث وسريع

### التشفير الكلاسيكي (Classical Ciphers)
- **Caesar Cipher**: تشفير الإزاحة
- **ROT13**: إصدار خاص من Caesar
- **Vigenere Cipher**: تشفير متعدد الأبجدية
- **Atbash Cipher**: عكس الأبجدية
- **XOR Cipher**: تشفير XOR

### الترميز (Encoding)
- **Base64**: ترميز/فك Base64
- **Hexadecimal**: ترميز/فك Hex

## التثبيت

```bash
npm install
npm run build
```

## الإعداد

```json
{
  "mcpServers": {
    "encryption": {
      "command": "node",
      "args": ["/path/to/encryption-mcp/build/index.js"]
    }
  }
}
```

## الأدوات المتاحة (17 أداة)

### 1. AES Encryption

#### `aes_encrypt`
تشفير النص باستخدام AES

```typescript
{
  plaintext: "Hello World",
  key: "mysecretkey",
  mode: "aes-256-cbc"  // اختياري
}
```

**الأنماط المدعومة:**
- `aes-256-cbc` (افتراضي)
- `aes-256-gcm`
- `aes-256-ctr`
- `aes-192-cbc`
- `aes-128-cbc`

**النتيجة:**
```json
{
  "encrypted": "a1b2c3...",
  "iv": "d4e5f6...",
  "key": "6d79736563726574..."
}
```

#### `aes_decrypt`
فك تشفير AES

```typescript
{
  ciphertext: "a1b2c3...",
  key: "6d79736563726574...",
  iv: "d4e5f6...",
  mode: "aes-256-cbc"
}
```

### 2. RSA Encryption

#### `rsa_generate_keypair`
توليد مفاتيح RSA

```typescript
{
  keySize: 2048  // 1024, 2048, 4096
}
```

**النتيجة:**
```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n..."
}
```

#### `rsa_encrypt`
التشفير بالمفتاح العام

```typescript
{
  plaintext: "Secret message",
  publicKey: "-----BEGIN PUBLIC KEY-----\n..."
}
```

#### `rsa_decrypt`
فك التشفير بالمفتاح الخاص

```typescript
{
  ciphertext: "base64_encrypted_text",
  privateKey: "-----BEGIN PRIVATE KEY-----\n..."
}
```

### 3. XOR Cipher

#### `xor_encrypt`
```typescript
{
  text: "Hello",
  key: "secret"
}
```

#### `xor_decrypt`
```typescript
{
  hexText: "3b0a0e1c...",
  key: "secret"
}
```

### 4. Caesar Cipher

#### `caesar_cipher`
```typescript
{
  text: "HELLO",
  shift: 3,
  operation: "encrypt"  // or "decrypt"
}
```

**مثال:**
- النص: `HELLO`
- الإزاحة: 3
- النتيجة: `KHOOR`

### 5. ROT13

#### `rot13`
```typescript
{
  text: "Hello World"
}
```

ROT13 متماثل (التشفير والفك نفس العملية):
- `Hello` → `Uryyb`
- `Uryyb` → `Hello`

### 6. Vigenere Cipher

#### `vigenere_cipher`
```typescript
{
  text: "HELLO",
  key: "KEY",
  operation: "encrypt"
}
```

**مثال:**
- النص: `HELLO`
- المفتاح: `KEY`
- النتيجة: `RIJVS`

### 7. ChaCha20

#### `chacha20_encrypt`
```typescript
{
  plaintext: "Secret data",
  key: "mykey"
}
```

#### `chacha20_decrypt`
```typescript
{
  ciphertext: "encrypted_hex",
  key: "key_hex",
  nonce: "nonce_hex"
}
```

### 8. Atbash Cipher

#### `atbash_cipher`
```typescript
{
  text: "HELLO"
}
```

عكس الأبجدية:
- `A↔Z`, `B↔Y`, `C↔X`, ...
- `HELLO` → `SVOOL`

### 9. Base64

#### `base64_encode`
```typescript
{
  text: "Hello World"
}
```

#### `base64_decode`
```typescript
{
  text: "SGVsbG8gV29ybGQ="
}
```

### 10. Hexadecimal

#### `hex_encode`
```typescript
{
  text: "Hello"
}
```

#### `hex_decode`
```typescript
{
  text: "48656c6c6f"
}
```

## أمثلة الاستخدام

### تشفير رسالة سرية بـ AES
```
Encrypt "Top Secret Message" using AES-256
```

### توليد مفاتيح RSA
```
Generate RSA 4096-bit key pair
```

### فك تشفير ROT13
```
Decrypt "Uryyb Jbeyq" using ROT13
```

### تشفير Vigenere
```
Encrypt "ATTACKATDAWN" with Vigenere cipher using key "LEMON"
```

## حالات الاستخدام

### 1. الأمن المعلوماتي
- تشفير البيانات الحساسة
- حماية الاتصالات
- تخزين آمن للمعلومات

### 2. CTF Challenges
- حل تحديات التشفير
- تحليل Ciphers الكلاسيكية
- Reverse engineering

### 3. التطوير
- اختبار خوارزميات التشفير
- تطوير أنظمة أمنية
- Cryptographic prototyping

### 4. التعليم
- تعلم التشفير
- فهم الخوارزميات
- التجريب الآمن

## مقارنة الخوارزميات

### متى تستخدم كل خوارزمية؟

| الخوارزمية | القوة | السرعة | الاستخدام |
|-----------|-------|--------|-----------|
| **AES-256** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | إنتاج، بيانات حساسة |
| **RSA-2048** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | تشفير المفاتيح، التوقيعات |
| **ChaCha20** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | بديل AES، أجهزة محمولة |
| **XOR** | ⭐ | ⭐⭐⭐⭐⭐ | تشويش بسيط، CTF |
| **Caesar** | ⭐ | ⭐⭐⭐⭐⭐ | تعليمي فقط |
| **Vigenere** | ⭐⭐ | ⭐⭐⭐⭐ | تاريخي، CTF |

### التوصيات الأمنية

✅ **للإنتاج:**
- AES-256-GCM
- RSA-2048 أو أعلى
- ChaCha20-Poly1305

⚠️ **للتعليم فقط:**
- Caesar, ROT13, Atbash
- XOR بدون مفتاح قوي

🔧 **للاختبار:**
- كل الخوارزميات مناسبة

## الأمان

### تحذيرات مهمة

1. **المفاتيح القوية**: استخدم دائماً مفاتيح عشوائية وقوية
2. **إدارة المفاتيح**: احفظ المفاتيح بشكل آمن
3. **IV/Nonce**: لا تستخدم نفس IV مرتين مع نفس المفتاح
4. **الخوارزميات القديمة**: Caesar, ROT13, XOR للتعليم فقط

### أفضل الممارسات

- ✅ استخدم AES-256 للبيانات الحساسة
- ✅ استخدم RSA مع padding صحيح (OAEP)
- ✅ احفظ IVs/Nonces مع النصوص المشفرة
- ✅ استخدم HMAC للتحقق من السلامة
- ❌ لا تخترع خوارزمية تشفير خاصة بك
- ❌ لا تستخدم تشفير stream cipher بنفس المفتاح

## التطوير

```bash
npm run watch    # وضع المراقبة
npm run inspector # التصحيح
```

## الترخيص

MIT
