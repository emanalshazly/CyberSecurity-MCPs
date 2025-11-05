# Hash Analyzer MCP Server

مخدم MCP متخصص في تحليل وتحديد أنواع الـ Hash والتعامل مع التشفير.

## المميزات

- **تحديد نوع الـ Hash**: التعرف التلقائي على نوع الـ Hash (MD5, SHA-1, SHA-256, SHA-512, bcrypt, وغيرها)
- **توليد Hash**: إنشاء Hash باستخدام خوارزميات مختلفة
- **توليد HMAC**: إنشاء Hash-based Message Authentication Codes
- **مقارنة Hash**: التحقق من تطابق النص مع Hash معين
- **تحليل Entropy**: تحليل جودة وقوة الـ Hash والكشف عن الأنماط المشبوهة

## التثبيت

```bash
npm install
npm run build
```

## الإعداد

أضف إلى `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hash-analyzer": {
      "command": "node",
      "args": ["/path/to/hash-analyzer-mcp/build/index.js"]
    }
  }
}
```

## الأدوات المتاحة

### 1. identify_hash
تحديد نوع الـ Hash بناءً على الطول والصيغة

**مثال:**
```typescript
{
  hash: "5d41402abc4b2a76b9719d911017c592"
}
```

**النتيجة:**
```json
{
  "possibleTypes": ["MD5", "NTLM", "MD4"],
  "length": 32,
  "format": "Hexadecimal"
}
```

### 2. generate_hash
توليد Hash من نص باستخدام خوارزمية محددة

**مثال:**
```typescript
{
  input: "hello world",
  algorithm: "sha256"
}
```

**الخوارزميات المدعومة:**
- md5
- sha1, sha224, sha256, sha384, sha512
- sha3-224, sha3-256, sha3-384, sha3-512
- ripemd160

### 3. generate_multiple_hashes
توليد عدة Hashes مرة واحدة

**مثال:**
```typescript
{
  input: "password123"
}
```

**النتيجة:**
```json
{
  "input": "password123",
  "hashes": {
    "MD5": "482c811da5d5b4bc6d497ffa98491e38",
    "SHA1": "cbfdac6008f9cab4083784cbd1874f76618d2a97",
    "SHA256": "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
    ...
  }
}
```

### 4. generate_hmac
توليد HMAC باستخدام مفتاح سري

**مثال:**
```typescript
{
  input: "message",
  key: "secret_key",
  algorithm: "sha256"
}
```

### 5. compare_hash
مقارنة نص مع Hash للتحقق من التطابق

**مثال:**
```typescript
{
  input: "hello",
  hash: "5d41402abc4b2a76b9719d911017c592"
}
```

**النتيجة:**
```json
{
  "matches": true,
  "testedAlgorithms": ["md5"],
  "matchedAlgorithm": "md5"
}
```

### 6. analyze_hash_entropy
تحليل جودة الـ Hash والكشف عن الأنماط المشبوهة

**مثال:**
```typescript
{
  hash: "5d41402abc4b2a76b9719d911017c592"
}
```

**النتيجة:**
```json
{
  "entropy": 3.89,
  "hasRepeatingPatterns": false,
  "characterDistribution": { "5": 2, "d": 2, ... },
  "suspiciousPattern": false
}
```

## أمثلة الاستخدام

### تحديد نوع Hash غير معروف
```
What type of hash is this: 5d41402abc4b2a76b9719d911017c592?
```

### توليد Hash لكلمة مرور
```
Generate SHA-256 hash for "mypassword123"
```

### التحقق من تطابق Hash
```
Check if "hello" matches this hash: 5d41402abc4b2a76b9719d911017c592
```

### تحليل قوة Hash
```
Analyze the entropy of this hash: aaaaabbbbbcccccddddd
```

## حالات الاستخدام

1. **تحليل Forensics**: تحديد خوارزميات التشفير المستخدمة
2. **فحص كلمات المرور**: التحقق من الـ Hashes والمقارنة
3. **مراجعة الأمان**: تحليل جودة الـ Hashes المستخدمة
4. **التطوير**: اختبار وتوليد Hashes للتطبيقات

## التطوير

```bash
npm run watch    # وضع المراقبة
npm run inspector # التصحيح
```

## الترخيص

MIT
