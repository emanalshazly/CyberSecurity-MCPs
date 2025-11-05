#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as crypto from "crypto";

// AES Encryption/Decryption
interface AESResult {
  encrypted?: string;
  decrypted?: string;
  iv?: string;
  key?: string;
  error?: string;
}

function encryptAES(
  plaintext: string,
  key: string,
  mode: string = "aes-256-cbc"
): AESResult {
  try {
    // Ensure key is correct length
    const keyBuffer = Buffer.from(key.padEnd(32, "0").slice(0, 32));
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(mode, keyBuffer, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      encrypted,
      iv: iv.toString("hex"),
      key: keyBuffer.toString("hex"),
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

function decryptAES(
  ciphertext: string,
  key: string,
  iv: string,
  mode: string = "aes-256-cbc"
): AESResult {
  try {
    const keyBuffer = Buffer.from(key, "hex");
    const ivBuffer = Buffer.from(iv, "hex");

    const decipher = crypto.createDecipheriv(mode, keyBuffer, ivBuffer);
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return { decrypted };
  } catch (error: any) {
    return { error: error.message };
  }
}

// RSA Encryption/Decryption
interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
}

function generateRSAKeyPair(keySize: number = 2048): RSAKeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: keySize,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { publicKey, privateKey };
}

function encryptRSA(plaintext: string, publicKey: string): string {
  const buffer = Buffer.from(plaintext, "utf8");
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer
  );
  return encrypted.toString("base64");
}

function decryptRSA(ciphertext: string, privateKey: string): string {
  const buffer = Buffer.from(ciphertext, "base64");
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer
  );
  return decrypted.toString("utf8");
}

// XOR Encryption/Decryption
function xorCipher(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const textCode = text.charCodeAt(i);
    const keyCode = key.charCodeAt(i % key.length);
    result += String.fromCharCode(textCode ^ keyCode);
  }
  return Buffer.from(result, "binary").toString("hex");
}

function xorDecipher(hexText: string, key: string): string {
  const text = Buffer.from(hexText, "hex").toString("binary");
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const textCode = text.charCodeAt(i);
    const keyCode = key.charCodeAt(i % key.length);
    result += String.fromCharCode(textCode ^ keyCode);
  }
  return result;
}

// Caesar Cipher
function caesarEncrypt(text: string, shift: number): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const code = char.charCodeAt(0);
    const isUpperCase = code >= 65 && code <= 90;
    const base = isUpperCase ? 65 : 97;
    return String.fromCharCode(((code - base + shift) % 26) + base);
  });
}

function caesarDecrypt(text: string, shift: number): string {
  return caesarEncrypt(text, 26 - (shift % 26));
}

// ROT13
function rot13(text: string): string {
  return caesarEncrypt(text, 13);
}

// Base64 Encoding/Decoding
function base64Encode(text: string): string {
  return Buffer.from(text, "utf8").toString("base64");
}

function base64Decode(text: string): string {
  return Buffer.from(text, "base64").toString("utf8");
}

// Hex Encoding/Decoding
function hexEncode(text: string): string {
  return Buffer.from(text, "utf8").toString("hex");
}

function hexDecode(text: string): string {
  return Buffer.from(text, "hex").toString("utf8");
}

// Vigenere Cipher
function vigenereEncrypt(text: string, key: string): string {
  key = key.toUpperCase();
  let result = "";
  let keyIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[a-zA-Z]/.test(char)) {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      const shift = key.charCodeAt(keyIndex % key.length) - 65;
      result += String.fromCharCode(((code - base + shift) % 26) + base);
      keyIndex++;
    } else {
      result += char;
    }
  }
  return result;
}

function vigenereDecrypt(text: string, key: string): string {
  key = key.toUpperCase();
  let result = "";
  let keyIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[a-zA-Z]/.test(char)) {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      const shift = key.charCodeAt(keyIndex % key.length) - 65;
      result += String.fromCharCode(((code - base - shift + 26) % 26) + base);
      keyIndex++;
    } else {
      result += char;
    }
  }
  return result;
}

// ChaCha20 Encryption (using Node.js crypto)
function encryptChaCha20(plaintext: string, key: string): any {
  try {
    const keyBuffer = Buffer.from(key.padEnd(32, "0").slice(0, 32));
    const nonce = crypto.randomBytes(12); // ChaCha20 uses 12-byte nonce

    const cipher = crypto.createCipheriv("chacha20", keyBuffer, nonce);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      encrypted,
      nonce: nonce.toString("hex"),
      key: keyBuffer.toString("hex"),
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

function decryptChaCha20(ciphertext: string, key: string, nonce: string): any {
  try {
    const keyBuffer = Buffer.from(key, "hex");
    const nonceBuffer = Buffer.from(nonce, "hex");

    const decipher = crypto.createDecipheriv("chacha20", keyBuffer, nonceBuffer);
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return { decrypted };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Atbash Cipher
function atbashCipher(text: string): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const code = char.charCodeAt(0);
    const isUpperCase = code >= 65 && code <= 90;
    const base = isUpperCase ? 65 : 97;
    return String.fromCharCode(base + (25 - (code - base)));
  });
}

// Define available tools
const tools: Tool[] = [
  {
    name: "aes_encrypt",
    description:
      "Encrypt text using AES (Advanced Encryption Standard) with various modes (CBC, GCM, CTR)",
    inputSchema: {
      type: "object",
      properties: {
        plaintext: {
          type: "string",
          description: "The text to encrypt",
        },
        key: {
          type: "string",
          description: "Encryption key (will be padded to 32 bytes for AES-256)",
        },
        mode: {
          type: "string",
          description: "AES mode (default: aes-256-cbc)",
        },
      },
      required: ["plaintext", "key"],
    },
  },
  {
    name: "aes_decrypt",
    description: "Decrypt AES encrypted text",
    inputSchema: {
      type: "object",
      properties: {
        ciphertext: {
          type: "string",
          description: "The encrypted text (hex encoded)",
        },
        key: {
          type: "string",
          description: "Decryption key (hex encoded)",
        },
        iv: {
          type: "string",
          description: "Initialization vector (hex encoded)",
        },
        mode: {
          type: "string",
          description: "AES mode (default: aes-256-cbc)",
        },
      },
      required: ["ciphertext", "key", "iv"],
    },
  },
  {
    name: "rsa_generate_keypair",
    description:
      "Generate RSA public/private key pair for asymmetric encryption",
    inputSchema: {
      type: "object",
      properties: {
        keySize: {
          type: "number",
          description: "Key size in bits (1024, 2048, 4096). Default: 2048",
        },
      },
    },
  },
  {
    name: "rsa_encrypt",
    description: "Encrypt text using RSA public key",
    inputSchema: {
      type: "object",
      properties: {
        plaintext: {
          type: "string",
          description: "The text to encrypt",
        },
        publicKey: {
          type: "string",
          description: "RSA public key in PEM format",
        },
      },
      required: ["plaintext", "publicKey"],
    },
  },
  {
    name: "rsa_decrypt",
    description: "Decrypt RSA encrypted text using private key",
    inputSchema: {
      type: "object",
      properties: {
        ciphertext: {
          type: "string",
          description: "The encrypted text (base64 encoded)",
        },
        privateKey: {
          type: "string",
          description: "RSA private key in PEM format",
        },
      },
      required: ["ciphertext", "privateKey"],
    },
  },
  {
    name: "xor_encrypt",
    description: "Encrypt text using XOR cipher with a key",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text to encrypt",
        },
        key: {
          type: "string",
          description: "XOR key",
        },
      },
      required: ["text", "key"],
    },
  },
  {
    name: "xor_decrypt",
    description: "Decrypt XOR encrypted text",
    inputSchema: {
      type: "object",
      properties: {
        hexText: {
          type: "string",
          description: "The encrypted text (hex encoded)",
        },
        key: {
          type: "string",
          description: "XOR key",
        },
      },
      required: ["hexText", "key"],
    },
  },
  {
    name: "caesar_cipher",
    description:
      "Encrypt or decrypt text using Caesar cipher with specified shift",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text to encrypt/decrypt",
        },
        shift: {
          type: "number",
          description: "Shift amount (positive for encrypt, use decrypt for decrypt)",
        },
        operation: {
          type: "string",
          description: "Operation: 'encrypt' or 'decrypt'",
        },
      },
      required: ["text", "shift", "operation"],
    },
  },
  {
    name: "rot13",
    description:
      "ROT13 cipher (Caesar with shift 13) - encrypt and decrypt are the same",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text to encrypt/decrypt",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "base64_encode",
    description: "Encode text to Base64",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text to encode",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "base64_decode",
    description: "Decode Base64 encoded text",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The Base64 text to decode",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "hex_encode",
    description: "Encode text to hexadecimal",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text to encode",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "hex_decode",
    description: "Decode hexadecimal encoded text",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The hex text to decode",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "vigenere_cipher",
    description:
      "Encrypt or decrypt text using Vigenere cipher with a keyword",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text to encrypt/decrypt",
        },
        key: {
          type: "string",
          description: "The keyword for Vigenere cipher",
        },
        operation: {
          type: "string",
          description: "Operation: 'encrypt' or 'decrypt'",
        },
      },
      required: ["text", "key", "operation"],
    },
  },
  {
    name: "chacha20_encrypt",
    description: "Encrypt text using ChaCha20 stream cipher",
    inputSchema: {
      type: "object",
      properties: {
        plaintext: {
          type: "string",
          description: "The text to encrypt",
        },
        key: {
          type: "string",
          description: "Encryption key (will be padded to 32 bytes)",
        },
      },
      required: ["plaintext", "key"],
    },
  },
  {
    name: "chacha20_decrypt",
    description: "Decrypt ChaCha20 encrypted text",
    inputSchema: {
      type: "object",
      properties: {
        ciphertext: {
          type: "string",
          description: "The encrypted text (hex encoded)",
        },
        key: {
          type: "string",
          description: "Decryption key (hex encoded)",
        },
        nonce: {
          type: "string",
          description: "Nonce (hex encoded)",
        },
      },
      required: ["ciphertext", "key", "nonce"],
    },
  },
  {
    name: "atbash_cipher",
    description:
      "Atbash cipher - substitutes each letter with its reverse in the alphabet (A↔Z, B↔Y, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text to encrypt/decrypt",
        },
      },
      required: ["text"],
    },
  },
];

// Initialize MCP Server
const server = new Server(
  {
    name: "encryption-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "aes_encrypt": {
        const result = encryptAES(
          args.plaintext as string,
          args.key as string,
          (args.mode as string) || "aes-256-cbc"
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "aes_decrypt": {
        const result = decryptAES(
          args.ciphertext as string,
          args.key as string,
          args.iv as string,
          (args.mode as string) || "aes-256-cbc"
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "rsa_generate_keypair": {
        const keySize = (args.keySize as number) || 2048;
        const result = generateRSAKeyPair(keySize);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "rsa_encrypt": {
        const result = encryptRSA(
          args.plaintext as string,
          args.publicKey as string
        );
        return {
          content: [
            { type: "text", text: JSON.stringify({ encrypted: result }, null, 2) },
          ],
        };
      }

      case "rsa_decrypt": {
        const result = decryptRSA(
          args.ciphertext as string,
          args.privateKey as string
        );
        return {
          content: [
            { type: "text", text: JSON.stringify({ decrypted: result }, null, 2) },
          ],
        };
      }

      case "xor_encrypt": {
        const result = xorCipher(args.text as string, args.key as string);
        return {
          content: [
            { type: "text", text: JSON.stringify({ encrypted: result }, null, 2) },
          ],
        };
      }

      case "xor_decrypt": {
        const result = xorDecipher(args.hexText as string, args.key as string);
        return {
          content: [
            { type: "text", text: JSON.stringify({ decrypted: result }, null, 2) },
          ],
        };
      }

      case "caesar_cipher": {
        const operation = args.operation as string;
        const result =
          operation === "encrypt"
            ? caesarEncrypt(args.text as string, args.shift as number)
            : caesarDecrypt(args.text as string, args.shift as number);
        return {
          content: [
            { type: "text", text: JSON.stringify({ result }, null, 2) },
          ],
        };
      }

      case "rot13": {
        const result = rot13(args.text as string);
        return {
          content: [
            { type: "text", text: JSON.stringify({ result }, null, 2) },
          ],
        };
      }

      case "base64_encode": {
        const result = base64Encode(args.text as string);
        return {
          content: [
            { type: "text", text: JSON.stringify({ encoded: result }, null, 2) },
          ],
        };
      }

      case "base64_decode": {
        const result = base64Decode(args.text as string);
        return {
          content: [
            { type: "text", text: JSON.stringify({ decoded: result }, null, 2) },
          ],
        };
      }

      case "hex_encode": {
        const result = hexEncode(args.text as string);
        return {
          content: [
            { type: "text", text: JSON.stringify({ encoded: result }, null, 2) },
          ],
        };
      }

      case "hex_decode": {
        const result = hexDecode(args.text as string);
        return {
          content: [
            { type: "text", text: JSON.stringify({ decoded: result }, null, 2) },
          ],
        };
      }

      case "vigenere_cipher": {
        const operation = args.operation as string;
        const result =
          operation === "encrypt"
            ? vigenereEncrypt(args.text as string, args.key as string)
            : vigenereDecrypt(args.text as string, args.key as string);
        return {
          content: [
            { type: "text", text: JSON.stringify({ result }, null, 2) },
          ],
        };
      }

      case "chacha20_encrypt": {
        const result = encryptChaCha20(
          args.plaintext as string,
          args.key as string
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "chacha20_decrypt": {
        const result = decryptChaCha20(
          args.ciphertext as string,
          args.key as string,
          args.nonce as string
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "atbash_cipher": {
        const result = atbashCipher(args.text as string);
        return {
          content: [
            { type: "text", text: JSON.stringify({ result }, null, 2) },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Encryption MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
