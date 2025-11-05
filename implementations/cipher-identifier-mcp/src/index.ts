#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as crypto from "crypto";

interface DetectionResult {
  encoding: string;
  confidence: number;
  decoded?: string;
  notes?: string;
}

interface CipherAnalysis {
  possibleCiphers: DetectionResult[];
  bestGuess?: DetectionResult;
  originalText: string;
  textLength: number;
  hasOnlyLetters: boolean;
  hasSpecialChars: boolean;
}

// Detect and decode Base64
function detectBase64(text: string): DetectionResult | null {
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;

  if (!base64Regex.test(text.trim())) {
    return null;
  }

  // Check if length is valid for base64
  const trimmed = text.trim();
  if (trimmed.length % 4 !== 0 && !trimmed.endsWith("=")) {
    return null;
  }

  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");

    // Check if decoded text is printable
    const isPrintable = /^[\x20-\x7E\s]*$/.test(decoded);

    if (isPrintable) {
      return {
        encoding: "Base64",
        confidence: 0.95,
        decoded,
        notes: "Successfully decoded as Base64",
      };
    }
  } catch {
    return null;
  }

  return null;
}

// Detect and decode Hexadecimal
function detectHex(text: string): DetectionResult | null {
  const hexRegex = /^[0-9a-fA-F]+$/;
  const trimmed = text.trim();

  if (!hexRegex.test(trimmed)) {
    return null;
  }

  // Check if even length
  if (trimmed.length % 2 !== 0) {
    return null;
  }

  try {
    const decoded = Buffer.from(trimmed, "hex").toString("utf8");

    // Check if decoded text is printable
    const isPrintable = /^[\x20-\x7E\s]*$/.test(decoded);

    if (isPrintable) {
      return {
        encoding: "Hexadecimal",
        confidence: 0.9,
        decoded,
        notes: "Successfully decoded as Hex",
      };
    }
  } catch {
    return null;
  }

  return null;
}

// Detect ROT13
function detectROT13(text: string): DetectionResult | null {
  const rot13 = (str: string): string => {
    return str.replace(/[a-zA-Z]/g, (char) => {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      return String.fromCharCode(((code - base + 13) % 26) + base);
    });
  };

  const decoded = rot13(text);

  // Check if decoded text makes more sense (has more common English words)
  const commonWords = ["the", "be", "to", "of", "and", "a", "in", "that", "have", "i"];
  const decodedLower = decoded.toLowerCase();
  const matchCount = commonWords.filter(word => decodedLower.includes(word)).length;

  if (matchCount >= 2) {
    return {
      encoding: "ROT13",
      confidence: 0.7 + (matchCount * 0.05),
      decoded,
      notes: `Found ${matchCount} common English words after ROT13`,
    };
  }

  return null;
}

// Brute force Caesar cipher
function bruteForceCaesar(text: string): DetectionResult[] {
  const results: DetectionResult[] = [];

  for (let shift = 1; shift < 26; shift++) {
    const decoded = text.replace(/[a-zA-Z]/g, (char) => {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      return String.fromCharCode(((code - base + shift) % 26) + base);
    });

    // Score based on common English patterns
    const score = scoreEnglishText(decoded);

    if (score > 0.3) {
      results.push({
        encoding: `Caesar (shift ${shift})`,
        confidence: Math.min(score, 0.9),
        decoded,
        notes: `Caesar cipher with shift of ${shift}`,
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

// Score text for English-like characteristics
function scoreEnglishText(text: string): number {
  const lowerText = text.toLowerCase();
  let score = 0;

  // Common English words
  const commonWords = [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at"
  ];

  // Check for common words
  let wordMatches = 0;
  for (const word of commonWords) {
    if (new RegExp(`\\b${word}\\b`, "i").test(lowerText)) {
      wordMatches++;
    }
  }
  score += wordMatches * 0.05;

  // Check letter frequency (English has high frequency of e, t, a, o, i, n)
  const letterCounts = new Map<string, number>();
  const letters = lowerText.replace(/[^a-z]/g, "");

  for (const char of letters) {
    letterCounts.set(char, (letterCounts.get(char) || 0) + 1);
  }

  const totalLetters = letters.length;
  if (totalLetters > 0) {
    const eFreq = (letterCounts.get("e") || 0) / totalLetters;
    const tFreq = (letterCounts.get("t") || 0) / totalLetters;
    const aFreq = (letterCounts.get("a") || 0) / totalLetters;

    // English letter frequencies approximately: e=12%, t=9%, a=8%
    if (eFreq > 0.08 && eFreq < 0.15) score += 0.2;
    if (tFreq > 0.06 && tFreq < 0.12) score += 0.1;
    if (aFreq > 0.05 && aFreq < 0.11) score += 0.1;
  }

  // Check for reasonable word lengths
  const words = lowerText.split(/\s+/);
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  if (avgWordLength > 3 && avgWordLength < 8) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

// Detect Atbash
function detectAtbash(text: string): DetectionResult | null {
  const atbash = (str: string): string => {
    return str.replace(/[a-zA-Z]/g, (char) => {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      return String.fromCharCode(base + (25 - (code - base)));
    });
  };

  const decoded = atbash(text);
  const score = scoreEnglishText(decoded);

  if (score > 0.4) {
    return {
      encoding: "Atbash",
      confidence: Math.min(score + 0.1, 0.9),
      decoded,
      notes: "Atbash cipher (reverse alphabet)",
    };
  }

  return null;
}

// Detect binary
function detectBinary(text: string): DetectionResult | null {
  const binaryRegex = /^[01\s]+$/;
  const trimmed = text.trim().replace(/\s/g, "");

  if (!binaryRegex.test(trimmed)) {
    return null;
  }

  // Check if divisible by 8 (byte-aligned)
  if (trimmed.length % 8 !== 0) {
    return null;
  }

  try {
    let decoded = "";
    for (let i = 0; i < trimmed.length; i += 8) {
      const byte = trimmed.substr(i, 8);
      decoded += String.fromCharCode(parseInt(byte, 2));
    }

    // Check if printable
    const isPrintable = /^[\x20-\x7E\s]*$/.test(decoded);

    if (isPrintable) {
      return {
        encoding: "Binary",
        confidence: 0.95,
        decoded,
        notes: "Successfully decoded binary (8-bit ASCII)",
      };
    }
  } catch {
    return null;
  }

  return null;
}

// Detect URL encoding
function detectURLEncoded(text: string): DetectionResult | null {
  // Check if text contains URL encoded characters
  if (!/%[0-9A-Fa-f]{2}/.test(text)) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(text);

    if (decoded !== text) {
      return {
        encoding: "URL Encoding",
        confidence: 0.9,
        decoded,
        notes: "Successfully decoded URL encoding",
      };
    }
  } catch {
    return null;
  }

  return null;
}

// Detect Morse code
function detectMorse(text: string): DetectionResult | null {
  const morseRegex = /^[.\-\s/]+$/;

  if (!morseRegex.test(text)) {
    return null;
  }

  const morseTable: Record<string, string> = {
    ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E",
    "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J",
    "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O",
    ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T",
    "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y",
    "--..": "Z", ".----": "1", "..---": "2", "...--": "3", "....-": "4",
    ".....": "5", "-....": "6", "--...": "7", "---..": "8", "----.": "9",
    "-----": "0", "/": " "
  };

  try {
    const words = text.split(" / ");
    let decoded = "";

    for (const word of words) {
      const letters = word.split(" ");
      for (const letter of letters) {
        if (letter && morseTable[letter]) {
          decoded += morseTable[letter];
        }
      }
      decoded += " ";
    }

    decoded = decoded.trim();

    if (decoded.length > 0) {
      return {
        encoding: "Morse Code",
        confidence: 0.85,
        decoded,
        notes: "Decoded Morse code (dots and dashes)",
      };
    }
  } catch {
    return null;
  }

  return null;
}

// Comprehensive cipher identification
function identifyCipher(text: string): CipherAnalysis {
  const possibleCiphers: DetectionResult[] = [];

  // Try all detection methods
  const base64Result = detectBase64(text);
  if (base64Result) possibleCiphers.push(base64Result);

  const hexResult = detectHex(text);
  if (hexResult) possibleCiphers.push(hexResult);

  const binaryResult = detectBinary(text);
  if (binaryResult) possibleCiphers.push(binaryResult);

  const urlResult = detectURLEncoded(text);
  if (urlResult) possibleCiphers.push(urlResult);

  const morseResult = detectMorse(text);
  if (morseResult) possibleCiphers.push(morseResult);

  const rot13Result = detectROT13(text);
  if (rot13Result) possibleCiphers.push(rot13Result);

  const atbashResult = detectAtbash(text);
  if (atbashResult) possibleCiphers.push(atbashResult);

  // Brute force Caesar cipher (only if text is mostly letters)
  const lettersOnly = text.replace(/[^a-zA-Z]/g, "");
  if (lettersOnly.length > text.length * 0.8) {
    const caesarResults = bruteForceCaesar(text);
    possibleCiphers.push(...caesarResults.slice(0, 3)); // Top 3 Caesar results
  }

  // Sort by confidence
  possibleCiphers.sort((a, b) => b.confidence - a.confidence);

  const analysis: CipherAnalysis = {
    possibleCiphers,
    bestGuess: possibleCiphers[0],
    originalText: text,
    textLength: text.length,
    hasOnlyLetters: /^[a-zA-Z\s]+$/.test(text),
    hasSpecialChars: /[^a-zA-Z0-9\s]/.test(text),
  };

  return analysis;
}

// Auto-decrypt - tries to automatically decrypt text
function autoDecrypt(text: string): any {
  const analysis = identifyCipher(text);

  if (analysis.bestGuess && analysis.bestGuess.confidence > 0.7) {
    return {
      success: true,
      method: analysis.bestGuess.encoding,
      confidence: analysis.bestGuess.confidence,
      decrypted: analysis.bestGuess.decoded,
      notes: analysis.bestGuess.notes,
      alternatives: analysis.possibleCiphers.slice(1, 4),
    };
  }

  return {
    success: false,
    message: "Could not confidently identify cipher type",
    suggestions: analysis.possibleCiphers.slice(0, 5),
    analysis: {
      textLength: analysis.textLength,
      hasOnlyLetters: analysis.hasOnlyLetters,
      hasSpecialChars: analysis.hasSpecialChars,
    },
  };
}

// Frequency analysis
function frequencyAnalysis(text: string): any {
  const letterCounts = new Map<string, number>();
  const letters = text.toLowerCase().replace(/[^a-z]/g, "");

  for (const char of letters) {
    letterCounts.set(char, (letterCounts.get(char) || 0) + 1);
  }

  const total = letters.length;
  const frequencies: Record<string, any> = {};

  // Sort by frequency
  const sorted = Array.from(letterCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([letter, count]) => ({
      letter,
      count,
      percentage: ((count / total) * 100).toFixed(2),
    }));

  // English letter frequency for comparison
  const englishFreq: Record<string, number> = {
    e: 12.70, t: 9.06, a: 8.17, o: 7.51, i: 6.97,
    n: 6.75, s: 6.33, h: 6.09, r: 5.99, d: 4.25,
  };

  return {
    totalLetters: total,
    uniqueLetters: letterCounts.size,
    distribution: sorted,
    topFive: sorted.slice(0, 5),
    englishComparison: englishFreq,
    notes: "Compare with English frequencies to identify substitution ciphers",
  };
}

// Define available tools
const tools: Tool[] = [
  {
    name: "identify_cipher",
    description:
      "Intelligently identify the type of cipher or encoding used in encrypted/encoded text. Detects Base64, Hex, Caesar, ROT13, Morse, Binary, URL encoding, and more.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The encrypted or encoded text to identify",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "auto_decrypt",
    description:
      "Automatically detect and decrypt/decode text. Tries multiple cipher types and returns the most likely result with confidence score.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The encrypted text to automatically decrypt",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "brute_force_caesar",
    description:
      "Try all 25 possible Caesar cipher shifts and return results scored by likelihood of being English text",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The Caesar cipher encrypted text",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "frequency_analysis",
    description:
      "Perform letter frequency analysis on encrypted text. Useful for identifying substitution ciphers by comparing with English letter frequencies.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text to analyze",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "decode_base64",
    description: "Decode Base64 encoded text",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Base64 encoded text",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "decode_hex",
    description: "Decode hexadecimal encoded text",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Hex encoded text",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "decode_binary",
    description: "Decode binary (0s and 1s) to ASCII text",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Binary text (8-bit groups)",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "decode_morse",
    description: "Decode Morse code (dots, dashes, spaces)",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Morse code text (use spaces between letters, / between words)",
        },
      },
      required: ["text"],
    },
  },
];

// Initialize MCP Server
const server = new Server(
  {
    name: "cipher-identifier-mcp",
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
      case "identify_cipher": {
        const result = identifyCipher(args.text as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "auto_decrypt": {
        const result = autoDecrypt(args.text as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "brute_force_caesar": {
        const results = bruteForceCaesar(args.text as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalResults: results.length,
                  topResults: results.slice(0, 5),
                  allResults: results,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "frequency_analysis": {
        const result = frequencyAnalysis(args.text as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "decode_base64": {
        const result = detectBase64(args.text as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "decode_hex": {
        const result = detectHex(args.text as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "decode_binary": {
        const result = detectBinary(args.text as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "decode_morse": {
        const result = detectMorse(args.text as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
  console.error("Cipher Identifier MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
