# Threat Intelligence MCP Server

مخدم MCP لاستخبارات التهديدات الأمنية، يدمج مع أشهر منصات استخبارات التهديدات:

- **VirusTotal**: فحص URLs، IPs، Domains، و File Hashes
- **AbuseIPDB**: فحص والإبلاغ عن IPs المسيئة
- **Shodan**: البحث عن الأجهزة والخدمات على الإنترنت

## المميزات

### VirusTotal Integration
- فحص URLs للبرمجيات الخبيثة والتصيد الاحتيالي
- فحص سمعة عناوين IP
- فحص سمعة النطاقات (Domains)
- فحص File Hashes (MD5, SHA1, SHA256)

### AbuseIPDB Integration
- فحص سمعة IP وتقارير الإساءة
- الإبلاغ عن IPs المسيئة إلى قاعدة البيانات

### Shodan Integration
- البحث عن الأجهزة والخدمات على الإنترنت
- الحصول على معلومات مفصلة عن أي IP

## التثبيت

1. تثبيت المتطلبات:
```bash
npm install
```

2. بناء المشروع:
```bash
npm run build
```

## الإعداد

احصل على API Keys من:
- VirusTotal: https://www.virustotal.com/gui/join-us
- AbuseIPDB: https://www.abuseipdb.com/register
- Shodan: https://account.shodan.io/register

أضف التكوين إلى `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "threat-intel": {
      "command": "node",
      "args": ["/path/to/threat-intel-mcp/build/index.js"],
      "env": {
        "VIRUSTOTAL_API_KEY": "your-virustotal-api-key",
        "ABUSEIPDB_API_KEY": "your-abuseipdb-api-key",
        "SHODAN_API_KEY": "your-shodan-api-key"
      }
    }
  }
}
```

## الأدوات المتاحة

### VirusTotal Tools

#### `virustotal_check_url`
فحص URL للبرمجيات الخبيثة والتهديدات
```typescript
{
  url: "https://example.com"
}
```

#### `virustotal_check_ip`
فحص سمعة عنوان IP
```typescript
{
  ip: "8.8.8.8"
}
```

#### `virustotal_check_domain`
فحص سمعة النطاق
```typescript
{
  domain: "example.com"
}
```

#### `virustotal_check_file_hash`
فحص hash الملف
```typescript
{
  hash: "44d88612fea8a8f36de82e1278abb02f"
}
```

### AbuseIPDB Tools

#### `abuseipdb_check_ip`
فحص IP للإساءة
```typescript
{
  ip: "192.168.1.1"
}
```

#### `abuseipdb_report_ip`
الإبلاغ عن IP مسيء
```typescript
{
  ip: "192.168.1.1",
  categories: "18,22", // 18=Brute-Force, 22=DDoS
  comment: "SSH brute force attack detected"
}
```

### Shodan Tools

#### `shodan_search`
البحث في Shodan
```typescript
{
  query: "apache country:US"
}
```

#### `shodan_host_info`
معلومات عن Host
```typescript
{
  ip: "8.8.8.8"
}
```

## أمثلة الاستخدام

### فحص URL مشبوه
```
Check this URL for malware: https://suspicious-site.com
```

### فحص IP للإساءة
```
Check if IP 192.168.1.100 has been reported for abuse
```

### البحث عن أجهزة معينة
```
Search Shodan for MongoDB instances in Germany
```

## التطوير

وضع المراقبة (يعيد البناء تلقائياً):
```bash
npm run watch
```

التصحيح باستخدام Inspector:
```bash
npm run inspector
```

## الترخيص

MIT
