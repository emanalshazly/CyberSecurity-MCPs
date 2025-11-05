#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as crypto from "crypto";

// Hash type identification based on length and format
interface HashIdentification {
  possibleTypes: string[];
  length: number;
  format: string;
}

function identifyHashType(hash: string): HashIdentification {
  const cleanHash = hash.trim().toLowerCase();
  const length = cleanHash.length;
  const isHex = /^[a-f0-9]+$/.test(cleanHash);

  const possibleTypes: string[] = [];

  if (isHex) {
    switch (length) {
      case 32:
        possibleTypes.push("MD5", "NTLM", "MD4");
        break;
      case 40:
        possibleTypes.push("SHA-1", "RIPEMD-160", "Tiger-160");
        break;
      case 64:
        possibleTypes.push("SHA-256", "SHA3-256", "BLAKE2s-256", "RIPEMD-256");
        break;
      case 96:
        possibleTypes.push("SHA-384", "SHA3-384");
        break;
      case 128:
        possibleTypes.push("SHA-512", "SHA3-512", "BLAKE2b-512", "Whirlpool");
        break;
      case 56:
        possibleTypes.push("SHA-224", "SHA3-224");
        break;
      case 16:
        possibleTypes.push("MD2", "Half MD5");
        break;
      default:
        possibleTypes.push("Unknown");
    }
  } else if (/^\$[0-9a-z]+\$/.test(cleanHash)) {
    // Unix crypt format
    if (cleanHash.startsWith("$1$")) possibleTypes.push("MD5 Crypt");
    else if (cleanHash.startsWith("$2") || cleanHash.startsWith("$2a$") || cleanHash.startsWith("$2y$"))
      possibleTypes.push("bcrypt");
    else if (cleanHash.startsWith("$5$")) possibleTypes.push("SHA-256 Crypt");
    else if (cleanHash.startsWith("$6$")) possibleTypes.push("SHA-512 Crypt");
    else if (cleanHash.startsWith("$apr1$")) possibleTypes.push("Apache MD5");
    else possibleTypes.push("Unix Crypt (Unknown variant)");
  } else if (cleanHash.includes(":")) {
    possibleTypes.push("Salted Hash (format: hash:salt or username:hash)");
  } else {
    possibleTypes.push("Unknown or Base64-encoded hash");
  }

  return {
    possibleTypes,
    length,
    format: isHex ? "Hexadecimal" : "Other",
  };
}

// Generate hash from input string
function generateHash(input: string, algorithm: string): string {
  const supportedAlgorithms = [
    "md5",
    "sha1",
    "sha224",
    "sha256",
    "sha384",
    "sha512",
    "sha3-224",
    "sha3-256",
    "sha3-384",
    "sha3-512",
    "ripemd160",
  ];

  if (!supportedAlgorithms.includes(algorithm.toLowerCase())) {
    throw new Error(
      `Unsupported algorithm. Supported: ${supportedAlgorithms.join(", ")}`
    );
  }

  return crypto.createHash(algorithm).update(input).digest("hex");
}

// Generate multiple hashes at once
function generateMultipleHashes(input: string): Record<string, string> {
  const algorithms = [
    "md5",
    "sha1",
    "sha256",
    "sha384",
    "sha512",
    "sha3-256",
    "sha3-512",
  ];

  const results: Record<string, string> = {};
  for (const algo of algorithms) {
    results[algo.toUpperCase()] = generateHash(input, algo);
  }

  return results;
}

// HMAC generation
function generateHMAC(input: string, key: string, algorithm: string): string {
  return crypto.createHmac(algorithm, key).update(input).digest("hex");
}

// Compare hash with input
function compareHash(input: string, hash: string): {
  matches: boolean;
  testedAlgorithms: string[];
  matchedAlgorithm?: string;
} {
  const identification = identifyHashType(hash);
  const testedAlgorithms: string[] = [];
  const cleanHash = hash.trim().toLowerCase();

  // Map common hash types to crypto algorithms
  const algorithmMap: Record<string, string> = {
    MD5: "md5",
    "SHA-1": "sha1",
    "SHA-256": "sha256",
    "SHA-384": "sha384",
    "SHA-512": "sha512",
    "SHA3-256": "sha3-256",
    "SHA3-512": "sha3-512",
  };

  for (const possibleType of identification.possibleTypes) {
    const algorithm = algorithmMap[possibleType];
    if (algorithm) {
      testedAlgorithms.push(algorithm);
      const generatedHash = generateHash(input, algorithm);
      if (generatedHash === cleanHash) {
        return {
          matches: true,
          testedAlgorithms,
          matchedAlgorithm: algorithm,
        };
      }
    }
  }

  return {
    matches: false,
    testedAlgorithms,
  };
}

// Analyze hash entropy and patterns
function analyzeHashEntropy(hash: string): {
  entropy: number;
  hasRepeatingPatterns: boolean;
  characterDistribution: Record<string, number>;
  suspiciousPattern: boolean;
} {
  const cleanHash = hash.trim().toLowerCase();
  const charCount: Record<string, number> = {};

  // Count character frequency
  for (const char of cleanHash) {
    charCount[char] = (charCount[char] || 0) + 1;
  }

  // Calculate Shannon entropy
  let entropy = 0;
  for (const count of Object.values(charCount)) {
    const probability = count / cleanHash.length;
    entropy -= probability * Math.log2(probability);
  }

  // Check for repeating patterns
  const hasRepeatingPatterns = /(.{2,})\1{2,}/.test(cleanHash);

  // Check for suspicious patterns (too many same characters)
  const maxRepetition = Math.max(...Object.values(charCount));
  const suspiciousPattern = maxRepetition > cleanHash.length * 0.3;

  return {
    entropy,
    hasRepeatingPatterns,
    characterDistribution: charCount,
    suspiciousPattern,
  };
}

// Define available tools
const tools: Tool[] = [
  {
    name: "identify_hash",
    description:
      "Identify the type of hash based on its length and format. Supports MD5, SHA-1, SHA-256, SHA-512, bcrypt, and more.",
    inputSchema: {
      type: "object",
      properties: {
        hash: {
          type: "string",
          description: "The hash string to identify",
        },
      },
      required: ["hash"],
    },
  },
  {
    name: "generate_hash",
    description:
      "Generate a hash from input text using specified algorithm (MD5, SHA-1, SHA-256, SHA-512, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "The text to hash",
        },
        algorithm: {
          type: "string",
          description:
            "Hash algorithm (md5, sha1, sha256, sha384, sha512, sha3-256, sha3-512, etc.)",
        },
      },
      required: ["input", "algorithm"],
    },
  },
  {
    name: "generate_multiple_hashes",
    description:
      "Generate multiple common hashes (MD5, SHA-1, SHA-256, SHA-512, etc.) from input text at once",
    inputSchema: {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "The text to hash",
        },
      },
      required: ["input"],
    },
  },
  {
    name: "generate_hmac",
    description:
      "Generate HMAC (Hash-based Message Authentication Code) using specified algorithm and key",
    inputSchema: {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "The message to create HMAC for",
        },
        key: {
          type: "string",
          description: "The secret key",
        },
        algorithm: {
          type: "string",
          description: "HMAC algorithm (sha256, sha512, etc.)",
        },
      },
      required: ["input", "key", "algorithm"],
    },
  },
  {
    name: "compare_hash",
    description:
      "Compare a hash with input text to verify if they match. Automatically tries different algorithms.",
    inputSchema: {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "The plaintext input to compare",
        },
        hash: {
          type: "string",
          description: "The hash to compare against",
        },
      },
      required: ["input", "hash"],
    },
  },
  {
    name: "analyze_hash_entropy",
    description:
      "Analyze hash entropy, character distribution, and detect suspicious patterns that might indicate a weak or fake hash",
    inputSchema: {
      type: "object",
      properties: {
        hash: {
          type: "string",
          description: "The hash to analyze",
        },
      },
      required: ["hash"],
    },
  },
];

// Initialize MCP Server
const server = new Server(
  {
    name: "hash-analyzer-mcp",
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
      case "identify_hash": {
        const result = identifyHashType(args.hash as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "generate_hash": {
        const hash = generateHash(args.input as string, args.algorithm as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  algorithm: args.algorithm,
                  input: args.input,
                  hash,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "generate_multiple_hashes": {
        const hashes = generateMultipleHashes(args.input as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  input: args.input,
                  hashes,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "generate_hmac": {
        const hmac = generateHMAC(
          args.input as string,
          args.key as string,
          args.algorithm as string
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  algorithm: args.algorithm,
                  input: args.input,
                  hmac,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "compare_hash": {
        const result = compareHash(args.input as string, args.hash as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "analyze_hash_entropy": {
        const result = analyzeHashEntropy(args.hash as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
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
  console.error("Hash Analyzer MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
