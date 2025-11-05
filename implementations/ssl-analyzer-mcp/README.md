# SSL/TLS Analyzer MCP Server

مخدم MCP متخصص في تحليل واختبار شهادات SSL/TLS وإعدادات الأمان.

## المميزات

- **تحليل الشهادات**: فحص تفاصيل شهادات SSL/TLS الكاملة
- **اختبار TLS Versions**: فحص نسخ TLS المدعومة والكشف عن النسخ الضعيفة
- **فحص Cipher Suites**: التحقق من خوارزميات التشفير المستخدمة
- **HTTP Security Headers**: فحص وتقييم رؤوس الأمان HTTP
- **التحقق من Certificate Chain**: فحص سلسلة الشهادات والثقة

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
    "ssl-analyzer": {
      "command": "node",
      "args": ["/path/to/ssl-analyzer-mcp/build/index.js"]
    }
  }
}
```

## الأدوات المتاحة

### 1. get_certificate
الحصول على معلومات مفصلة عن شهادة SSL/TLS

**مثال:**
```typescript
{
  hostname: "google.com",
  port: 443  // اختياري
}
```

**النتيجة:**
```json
{
  "subject": {
    "CN": "*.google.com"
  },
  "issuer": {
    "CN": "GTS CA 1D4",
    "O": "Google Trust Services"
  },
  "validFrom": "Dec 4 08:25:43 2023 GMT",
  "validTo": "Feb 26 08:25:42 2024 GMT",
  "daysUntilExpiry": 45,
  "serialNumber": "...",
  "fingerprint": "...",
  "fingerprint256": "...",
  "subjectAltNames": ["DNS:*.google.com", "DNS:google.com"],
  "isExpired": false,
  "isSelfSigned": false,
  "signatureAlgorithm": "sha256WithRSAEncryption",
  "publicKeyAlgorithm": "RSA",
  "publicKeySize": 2048
}
```

### 2. check_ssl_config
فحص إعدادات SSL/TLS

**مثال:**
```typescript
{
  hostname: "example.com",
  port: 443
}
```

**النتيجة:**
```json
{
  "protocol": "TLSv1.3",
  "cipher": {
    "name": "TLS_AES_256_GCM_SHA384",
    "version": "TLSv1.3",
    "bits": 256
  },
  "authorized": true,
  "supportsTLS13": true,
  "supportsTLS12": true,
  "certificateChainLength": 3
}
```

### 3. test_tls_versions
اختبار نسخ TLS المدعومة

**مثال:**
```typescript
{
  hostname: "example.com"
}
```

**النتيجة:**
```json
{
  "supportedVersions": ["TLSv1.2", "TLSv1.3"],
  "unsupportedVersions": ["TLSv1", "TLSv1.1"],
  "details": {
    "TLSv1": false,
    "TLSv1.1": false,
    "TLSv1.2": true,
    "TLSv1.3": true
  },
  "hasVulnerableVersions": false
}
```

### 4. check_security_headers
فحص رؤوس الأمان HTTP

**مثال:**
```typescript
{
  url: "https://example.com"
}
```

**النتيجة:**
```json
{
  "headers": {
    "strict-transport-security": "max-age=31536000",
    "content-security-policy": "default-src 'self'",
    "x-frame-options": "SAMEORIGIN",
    "x-content-type-options": "nosniff"
  },
  "hasHSTS": true,
  "hasCSP": true,
  "hasFrameOptions": true,
  "hasContentTypeOptions": true,
  "score": 80
}
```

**توزيع النقاط:**
- HSTS: 25 نقطة
- CSP: 25 نقطة
- X-Frame-Options: 15 نقطة
- X-Content-Type-Options: 15 نقطة
- X-XSS-Protection: 10 نقاط
- Referrer-Policy: 5 نقاط
- Permissions-Policy: 5 نقاط

### 5. verify_certificate_chain
التحقق من سلسلة الشهادات

**مثال:**
```typescript
{
  hostname: "example.com"
}
```

**النتيجة:**
```json
{
  "valid": true,
  "chain": [
    {
      "subject": { "CN": "example.com" },
      "issuer": { "CN": "Intermediate CA" },
      "validFrom": "...",
      "validTo": "..."
    },
    {
      "subject": { "CN": "Intermediate CA" },
      "issuer": { "CN": "Root CA" },
      "validFrom": "...",
      "validTo": "..."
    }
  ],
  "chainLength": 2,
  "error": null
}
```

## أمثلة الاستخدام

### فحص شهادة موقع
```
Check the SSL certificate for github.com
```

### اختبار نسخ TLS
```
Test which TLS versions are supported by example.com
```

### فحص رؤوس الأمان
```
Check security headers for https://mywebsite.com
```

### التحقق من صلاحية الشهادة
```
Verify the certificate chain for secure.example.com
```

## حالات الاستخدام

1. **Security Audits**: تدقيق أمان المواقع والخوادم
2. **Certificate Monitoring**: مراقبة انتهاء صلاحية الشهادات
3. **Compliance Testing**: التحقق من المعايير الأمنية (PCI DSS, HIPAA)
4. **Vulnerability Assessment**: الكشف عن TLS/SSL ضعيف
5. **Development Testing**: اختبار إعدادات SSL أثناء التطوير

## التحذيرات الأمنية

- ⚠️ **TLS 1.0/1.1**: نسخ قديمة وغير آمنة، يجب تعطيلها
- ⚠️ **Self-Signed Certificates**: شهادات ذاتية التوقيع، غير موثوقة للإنتاج
- ⚠️ **Expired Certificates**: شهادات منتهية الصلاحية
- ⚠️ **Weak Ciphers**: خوارزميات تشفير ضعيفة

## التطوير

```bash
npm run watch    # وضع المراقبة
npm run inspector # التصحيح
```

## الترخيص

MIT
