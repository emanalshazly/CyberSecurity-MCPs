#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as tls from "tls";
import * as https from "https";
import * as crypto from "crypto";
import axios from "axios";

interface CertificateInfo {
  subject: any;
  issuer: any;
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  serialNumber: string;
  fingerprint: string;
  fingerprint256: string;
  keyUsage?: string[];
  extKeyUsage?: string[];
  subjectAltNames?: string[];
  isExpired: boolean;
  isSelfSigned: boolean;
  signatureAlgorithm: string;
  publicKeyAlgorithm: string;
  publicKeySize?: number;
}

interface SSLLabsResult {
  host: string;
  port: number;
  protocol: string;
  isPublic: boolean;
  status: string;
  endpoints?: any[];
}

// Get certificate information from a hostname
async function getCertificate(
  hostname: string,
  port: number = 443
): Promise<CertificateInfo> {
  return new Promise((resolve, reject) => {
    const options = {
      host: hostname,
      port: port,
      servername: hostname,
      rejectUnauthorized: false,
    };

    const socket = tls.connect(options, () => {
      const cert = socket.getPeerCertificate(true);

      if (!cert || Object.keys(cert).length === 0) {
        socket.destroy();
        reject(new Error("No certificate found"));
        return;
      }

      // Calculate days until expiry
      const validTo = new Date(cert.valid_to);
      const now = new Date();
      const daysUntilExpiry = Math.floor(
        (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if self-signed
      const isSelfSigned =
        JSON.stringify(cert.subject) === JSON.stringify(cert.issuer);

      // Extract subject alternative names
      const subjectAltNames = cert.subjectaltname
        ? cert.subjectaltname.split(", ")
        : [];

      const certInfo: CertificateInfo = {
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        daysUntilExpiry,
        serialNumber: cert.serialNumber,
        fingerprint: cert.fingerprint,
        fingerprint256: cert.fingerprint256,
        subjectAltNames,
        isExpired: daysUntilExpiry < 0,
        isSelfSigned,
        signatureAlgorithm: cert.sigalg || "Unknown",
        publicKeyAlgorithm: cert.pubkey ? "RSA" : "Unknown",
        publicKeySize: cert.bits,
      };

      socket.destroy();
      resolve(certInfo);
    });

    socket.on("error", (error) => {
      reject(error);
    });

    socket.setTimeout(10000, () => {
      socket.destroy();
      reject(new Error("Connection timeout"));
    });
  });
}

// Check SSL/TLS configuration
async function checkSSLConfiguration(
  hostname: string,
  port: number = 443
): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      host: hostname,
      port: port,
      servername: hostname,
      rejectUnauthorized: false,
    };

    const socket = tls.connect(options, () => {
      const protocol = socket.getProtocol();
      const cipher = socket.getCipher();
      const cert = socket.getPeerCertificate();

      const config = {
        protocol: protocol,
        cipher: {
          name: cipher?.name,
          version: cipher?.version,
          bits: cipher?.bits,
        },
        authorized: socket.authorized,
        authorizationError: socket.authorizationError,
        alpnProtocol: socket.alpnProtocol,
        supportsTLS13: protocol?.includes("TLSv1.3"),
        supportsTLS12: protocol?.includes("TLSv1.2"),
        certificateChainLength: getCertificateChainLength(cert),
      };

      socket.destroy();
      resolve(config);
    });

    socket.on("error", (error) => {
      reject(error);
    });

    socket.setTimeout(10000, () => {
      socket.destroy();
      reject(new Error("Connection timeout"));
    });
  });
}

// Get certificate chain length
function getCertificateChainLength(cert: any): number {
  let count = 0;
  let current = cert;

  while (current && Object.keys(current).length > 0) {
    count++;
    current = current.issuerCertificate;
    // Prevent infinite loop for self-signed certs
    if (
      current &&
      current.fingerprint === cert.fingerprint &&
      count > 1
    ) {
      break;
    }
  }

  return count;
}

// Test supported TLS versions
async function testTLSVersions(
  hostname: string,
  port: number = 443
): Promise<any> {
  const versions = ["TLSv1", "TLSv1.1", "TLSv1.2", "TLSv1.3"];
  const results: Record<string, boolean> = {};

  for (const version of versions) {
    try {
      await new Promise<void>((resolve, reject) => {
        const options: any = {
          host: hostname,
          port: port,
          servername: hostname,
          rejectUnauthorized: false,
          minVersion: version,
          maxVersion: version,
        };

        const socket = tls.connect(options, () => {
          socket.destroy();
          resolve();
        });

        socket.on("error", () => {
          reject();
        });

        socket.setTimeout(5000, () => {
          socket.destroy();
          reject();
        });
      });

      results[version] = true;
    } catch {
      results[version] = false;
    }
  }

  return {
    supportedVersions: Object.keys(results).filter((v) => results[v]),
    unsupportedVersions: Object.keys(results).filter((v) => !results[v]),
    details: results,
    hasVulnerableVersions: results["TLSv1"] || results["TLSv1.1"],
  };
}

// Check HTTP security headers
async function checkSecurityHeaders(url: string): Promise<any> {
  try {
    const response = await axios.get(url, {
      maxRedirects: 0,
      validateStatus: () => true,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    const headers = response.headers;
    const securityHeaders = {
      "strict-transport-security": headers["strict-transport-security"],
      "content-security-policy": headers["content-security-policy"],
      "x-frame-options": headers["x-frame-options"],
      "x-content-type-options": headers["x-content-type-options"],
      "x-xss-protection": headers["x-xss-protection"],
      "referrer-policy": headers["referrer-policy"],
      "permissions-policy": headers["permissions-policy"],
    };

    const analysis = {
      headers: securityHeaders,
      hasHSTS: !!securityHeaders["strict-transport-security"],
      hasCSP: !!securityHeaders["content-security-policy"],
      hasFrameOptions: !!securityHeaders["x-frame-options"],
      hasContentTypeOptions: !!securityHeaders["x-content-type-options"],
      score: calculateSecurityScore(securityHeaders),
    };

    return analysis;
  } catch (error: any) {
    return { error: error.message };
  }
}

// Calculate security score based on headers
function calculateSecurityScore(headers: Record<string, any>): number {
  let score = 0;
  const weights: Record<string, number> = {
    "strict-transport-security": 25,
    "content-security-policy": 25,
    "x-frame-options": 15,
    "x-content-type-options": 15,
    "x-xss-protection": 10,
    "referrer-policy": 5,
    "permissions-policy": 5,
  };

  for (const [header, weight] of Object.entries(weights)) {
    if (headers[header]) {
      score += weight;
    }
  }

  return score;
}

// Verify certificate chain
async function verifyCertificateChain(
  hostname: string,
  port: number = 443
): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      host: hostname,
      port: port,
      servername: hostname,
      rejectUnauthorized: true,
    };

    const socket = tls.connect(options, () => {
      const cert = socket.getPeerCertificate(true);
      const chain: any[] = [];

      let current = cert;
      while (current && Object.keys(current).length > 0) {
        chain.push({
          subject: current.subject,
          issuer: current.issuer,
          validFrom: current.valid_from,
          validTo: current.valid_to,
        });

        current = current.issuerCertificate;
        if (
          current &&
          current.fingerprint === cert.fingerprint &&
          chain.length > 1
        ) {
          break;
        }
      }

      socket.destroy();
      resolve({
        valid: socket.authorized,
        chain,
        chainLength: chain.length,
        error: socket.authorizationError,
      });
    });

    socket.on("error", (error) => {
      resolve({
        valid: false,
        error: error.message,
        chain: [],
      });
    });

    socket.setTimeout(10000, () => {
      socket.destroy();
      reject(new Error("Connection timeout"));
    });
  });
}

// Define available tools
const tools: Tool[] = [
  {
    name: "get_certificate",
    description:
      "Get detailed SSL/TLS certificate information from a hostname including expiry, issuer, fingerprint, and more",
    inputSchema: {
      type: "object",
      properties: {
        hostname: {
          type: "string",
          description: "The hostname to check (e.g., google.com)",
        },
        port: {
          type: "number",
          description: "Port number (default: 443)",
        },
      },
      required: ["hostname"],
    },
  },
  {
    name: "check_ssl_config",
    description:
      "Check SSL/TLS configuration including protocol version, cipher suite, and security settings",
    inputSchema: {
      type: "object",
      properties: {
        hostname: {
          type: "string",
          description: "The hostname to check",
        },
        port: {
          type: "number",
          description: "Port number (default: 443)",
        },
      },
      required: ["hostname"],
    },
  },
  {
    name: "test_tls_versions",
    description:
      "Test which TLS versions are supported by the server (TLS 1.0, 1.1, 1.2, 1.3) and identify vulnerable versions",
    inputSchema: {
      type: "object",
      properties: {
        hostname: {
          type: "string",
          description: "The hostname to test",
        },
        port: {
          type: "number",
          description: "Port number (default: 443)",
        },
      },
      required: ["hostname"],
    },
  },
  {
    name: "check_security_headers",
    description:
      "Check HTTP security headers like HSTS, CSP, X-Frame-Options, etc., and calculate security score",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The full URL to check (e.g., https://example.com)",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "verify_certificate_chain",
    description:
      "Verify the complete SSL certificate chain and check for any trust issues",
    inputSchema: {
      type: "object",
      properties: {
        hostname: {
          type: "string",
          description: "The hostname to verify",
        },
        port: {
          type: "number",
          description: "Port number (default: 443)",
        },
      },
      required: ["hostname"],
    },
  },
];

// Initialize MCP Server
const server = new Server(
  {
    name: "ssl-analyzer-mcp",
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
      case "get_certificate": {
        const port = (args.port as number) || 443;
        const result = await getCertificate(args.hostname as string, port);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "check_ssl_config": {
        const port = (args.port as number) || 443;
        const result = await checkSSLConfiguration(args.hostname as string, port);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "test_tls_versions": {
        const port = (args.port as number) || 443;
        const result = await testTLSVersions(args.hostname as string, port);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "check_security_headers": {
        const result = await checkSecurityHeaders(args.url as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "verify_certificate_chain": {
        const port = (args.port as number) || 443;
        const result = await verifyCertificateChain(args.hostname as string, port);
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
  console.error("SSL Analyzer MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
