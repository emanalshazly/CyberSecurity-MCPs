# Cipher Identifier MCP Server

مخدم MCP ذكي لتحديد أنواع التشفير/الترميز تلقائياً وفكها. أداة قوية لحل تحديات CTF وتحليل النصوص المشفرة.

## المميزات الذكية 🧠

### التحديد التلقائي الذكي
- **تحليل متعدد الطبقات**: يفحص النص بطرق متعددة
- **نظام درجات الثقة**: يعطي نسبة الثقة لكل احتمال
- **أولويات ذكية**: يرتب النتائج حسب الاحتمالية

### أنواع التشفير/الترميز المدعومة
✅ **Base64** - ترميز قاعدة 64
✅ **Hexadecimal** - ترميز ست عشري
✅ **Binary** - ثنائي (0 و 1)
✅ **Caesar Cipher** - تشفير القيصر (مع brute force)
✅ **ROT13** - دوران 13
✅ **Atbash** - عكس الأبجدية
✅ **Morse Code** - شفرة مورس
✅ **URL Encoding** - ترميز URL

### التحليل الذكي
- **Frequency Analysis**: تحليل تردد الحروف
- **English Scoring**: تقييم مدى قرب النص من الإنجليزية
- **Pattern Recognition**: التعرف على الأنماط
- **Multi-layer Detection**: كشف التشفير متعدد الطبقات

## التثبيت

```bash
npm install
npm run build
```

## الإعداد

```json
{
  "mcpServers": {
    "cipher-identifier": {
      "command": "node",
      "args": ["/path/to/cipher-identifier-mcp/build/index.js"]
    }
  }
}
```

## الأدوات المتاحة

### 1. identify_cipher - التحديد الذكي ⭐

**الأداة الأقوى!** تحدد نوع التشفير تلقائياً

```typescript
{
  text: "SGVsbG8gV29ybGQ="
}
```

**النتيجة:**
```json
{
  "possibleCiphers": [
    {
      "encoding": "Base64",
      "confidence": 0.95,
      "decoded": "Hello World",
      "notes": "Successfully decoded as Base64"
    }
  ],
  "bestGuess": {
    "encoding": "Base64",
    "confidence": 0.95,
    "decoded": "Hello World"
  },
  "textLength": 16,
  "hasOnlyLetters": false,
  "hasSpecialChars": true
}
```

### 2. auto_decrypt - فك التشفير التلقائي 🚀

يحاول فك التشفير تلقائياً ويعطيك النتيجة الأفضل

```typescript
{
  text: "Uryyb Jbeyq"
}
```

**النتيجة:**
```json
{
  "success": true,
  "method": "ROT13",
  "confidence": 0.85,
  "decrypted": "Hello World",
  "notes": "Found 2 common English words after ROT13",
  "alternatives": [...]
}
```

### 3. brute_force_caesar - كسر Caesar 💪

يجرب جميع الإزاحات الممكنة (1-25)

```typescript
{
  text: "KHOOR"
}
```

**النتيجة:**
```json
{
  "totalResults": 25,
  "topResults": [
    {
      "encoding": "Caesar (shift 23)",
      "confidence": 0.9,
      "decoded": "HELLO",
      "notes": "Caesar cipher with shift of 23"
    }
  ]
}
```

### 4. frequency_analysis - تحليل التردد 📊

يحلل تردد الحروف للكشف عن تشفير الاستبدال

```typescript
{
  text: "ENCRYPTED TEXT HERE"
}
```

**النتيجة:**
```json
{
  "totalLetters": 150,
  "uniqueLetters": 18,
  "distribution": [
    { "letter": "e", "count": 18, "percentage": "12.00" },
    { "letter": "t", "count": 14, "percentage": "9.33" }
  ],
  "topFive": [...],
  "englishComparison": {
    "e": 12.70,
    "t": 9.06,
    "a": 8.17
  },
  "notes": "Compare with English frequencies..."
}
```

### 5. decode_base64

فك Base64 مباشرة

### 6. decode_hex

فك Hexadecimal مباشرة

### 7. decode_binary

فك Binary مباشرة

### 8. decode_morse

فك Morse Code

```typescript
{
  text: ".... . .-.. .-.. --- / .-- --- .-. .-.. -.."
}
```

## أمثلة الاستخدام

### مثال 1: نص مشفر غير معروف
```
I found this encrypted text: "SGVsbG8gV29ybGQ="
Can you decrypt it?
```

**النتيجة:** سيحدد تلقائياً أنه Base64 ويفكه إلى "Hello World"

### مثال 2: Caesar Cipher
```
Decrypt this: "Wkh txlfn eurzq ira"
```

**النتيجة:** سيجرب جميع الإزاحات ويجد أن shift=3 يعطي "The quick brown fox"

### مثال 3: Multi-layer Encryption
```
This looks encrypted: "01001000 01100101 01101100 01101100 01101111"
```

**النتيجة:** سيحدد أنه Binary ويفكه

### مثال 4: Morse Code
```
.... . .-.. .-.. ---
```

**النتيجة:** "HELLO"

## كيف يعمل الذكاء؟ 🤖

### 1. Pattern Recognition
يفحص الأنماط في النص:
- هل يحتوي على أحرف فقط؟
- هل هناك أرقام ستعشرية؟
- هل يحتوي على `=` في النهاية؟
- هل الطول قابل للقسمة على 4 أو 8؟

### 2. Confidence Scoring
لكل طريقة فك، يحسب نسبة الثقة:
- **Base64/Hex**: يفحص صحة الترميز
- **Caesar/ROT13**: يبحث عن كلمات إنجليزية شائعة
- **Binary**: يتحقق من محاذاة البايتات

### 3. English Text Scoring
يقيم مدى قرب النص من الإنجليزية:
- تردد الحروف (E, T, A, O الأكثر شيوعاً)
- وجود كلمات شائعة (the, be, to, of, and)
- متوسط طول الكلمات (3-7 أحرف)
- أنماط الأحرف الساكنة والمتحركة

### 4. Multi-Layer Detection
يمكنه كشف التشفير متعدد الطبقات:
```
Base64 → Hex → Binary → Plain Text
```

## حالات الاستخدام

### 1. CTF Challenges 🏆
حل تحديات Crypto بسرعة:
- تحديد نوع التشفير تلقائياً
- Brute force للتشفيرات الضعيفة
- تحليل التردد للاستبدال

### 2. Forensics 🔍
تحليل البيانات المشفرة:
- فك ترميز البيانات المخفية
- كشف التشفير في الملفات
- تحليل Communications المشفرة

### 3. Security Testing 🛡️
اختبار قوة التشفير:
- محاولة كسر التشفير
- تحليل الضعف
- اختبار الأنماط

### 4. Learning 📚
تعلم التشفير:
- فهم كيف تعمل الخوارزميات
- تجربة أنواع مختلفة
- تحليل الأمان

## نصائح للاستخدام الأمثل

### ✅ استخدم identify_cipher أولاً
ابدأ دائماً بـ `identify_cipher` للحصول على جميع الاحتمالات

### ✅ انظر إلى confidence score
- **> 0.9**: شبه مؤكد
- **0.7-0.9**: احتمال عالي
- **0.5-0.7**: احتمال متوسط
- **< 0.5**: غير مرجح

### ✅ جرب البدائل
إذا كان النص لا معنى له، جرب البدائل في `alternatives`

### ✅ استخدم frequency_analysis
للتشفيرات المعقدة، استخدم تحليل التردد للحصول على أدلة

## الأمثلة الشائعة

### Base64
```
Input:  "SGVsbG8gV29ybGQ="
Output: "Hello World"
```

### Hex
```
Input:  "48656c6c6f"
Output: "Hello"
```

### Caesar (shift 3)
```
Input:  "Khoor"
Output: "Hello"
```

### ROT13
```
Input:  "Uryyb"
Output: "Hello"
```

### Binary
```
Input:  "01001000 01100101 01101100 01101100 01101111"
Output: "Hello"
```

### Morse
```
Input:  ".... . .-.. .-.. ---"
Output: "HELLO"
```

## القيود الحالية

⚠️ **لا يدعم:**
- تشفير AES/RSA/ChaCha20 (يحتاج مفاتيح)
- تشفير Vigenere (يحتاج مفتاح)
- XOR (يحتاج مفتاح)
- تشفيرات معقدة أخرى تحتاج مفاتيح

✅ **يدعم:**
- جميع أنواع الترميز
- التشفيرات الكلاسيكية البسيطة
- Brute force للتشفيرات الضعيفة

## التطوير المستقبلي

🔮 **قادم قريباً:**
- دعم المزيد من أنواع التشفير
- تحسين نظام التقييم
- دعم multi-layer decryption
- تحليل أكثر ذكاءً
- دعم لغات أخرى غير الإنجليزية

## التطوير

```bash
npm run watch    # وضع المراقبة
npm run inspector # التصحيح
```

## الترخيص

MIT
