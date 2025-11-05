#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// API Keys from environment variables
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY || "";
const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY || "";
const SHODAN_API_KEY = process.env.SHODAN_API_KEY || "";

// VirusTotal Functions
async function checkUrlVirusTotal(url: string): Promise<any> {
  if (!VIRUSTOTAL_API_KEY) {
    return { error: "VirusTotal API key not configured" };
  }

  try {
    // Submit URL for scanning
    const scanResponse = await axios.post(
      "https://www.virustotal.com/api/v3/urls",
      new URLSearchParams({ url }),
      {
        headers: {
          "x-apikey": VIRUSTOTAL_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const analysisId = scanResponse.data.data.id;

    // Get analysis results
    const resultResponse = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
      {
        headers: {
          "x-apikey": VIRUSTOTAL_API_KEY,
        },
      }
    );

    return resultResponse.data;
  } catch (error: any) {
    return { error: error.message };
  }
}

async function checkIpVirusTotal(ip: string): Promise<any> {
  if (!VIRUSTOTAL_API_KEY) {
    return { error: "VirusTotal API key not configured" };
  }

  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/ip_addresses/${ip}`,
      {
        headers: {
          "x-apikey": VIRUSTOTAL_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
}

async function checkDomainVirusTotal(domain: string): Promise<any> {
  if (!VIRUSTOTAL_API_KEY) {
    return { error: "VirusTotal API key not configured" };
  }

  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/domains/${domain}`,
      {
        headers: {
          "x-apikey": VIRUSTOTAL_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
}

async function checkFileHashVirusTotal(hash: string): Promise<any> {
  if (!VIRUSTOTAL_API_KEY) {
    return { error: "VirusTotal API key not configured" };
  }

  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/files/${hash}`,
      {
        headers: {
          "x-apikey": VIRUSTOTAL_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
}

// AbuseIPDB Functions
async function checkIpAbuseIPDB(ip: string): Promise<any> {
  if (!ABUSEIPDB_API_KEY) {
    return { error: "AbuseIPDB API key not configured" };
  }

  try {
    const response = await axios.get("https://api.abuseipdb.com/api/v2/check", {
      headers: {
        Key: ABUSEIPDB_API_KEY,
        Accept: "application/json",
      },
      params: {
        ipAddress: ip,
        maxAgeInDays: 90,
        verbose: true,
      },
    });

    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
}

async function reportIpAbuseIPDB(
  ip: string,
  categories: string,
  comment: string
): Promise<any> {
  if (!ABUSEIPDB_API_KEY) {
    return { error: "AbuseIPDB API key not configured" };
  }

  try {
    const response = await axios.post(
      "https://api.abuseipdb.com/api/v2/report",
      new URLSearchParams({
        ip,
        categories,
        comment,
      }),
      {
        headers: {
          Key: ABUSEIPDB_API_KEY,
          Accept: "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
}

// Shodan Functions
async function searchShodan(query: string): Promise<any> {
  if (!SHODAN_API_KEY) {
    return { error: "Shodan API key not configured" };
  }

  try {
    const response = await axios.get(
      "https://api.shodan.io/shodan/host/search",
      {
        params: {
          key: SHODAN_API_KEY,
          query,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
}

async function getHostInfoShodan(ip: string): Promise<any> {
  if (!SHODAN_API_KEY) {
    return { error: "Shodan API key not configured" };
  }

  try {
    const response = await axios.get(`https://api.shodan.io/shodan/host/${ip}`, {
      params: {
        key: SHODAN_API_KEY,
      },
    });

    return response.data;
  } catch (error: any) {
    return { error: error.message };
  }
}

// Define available tools
const tools: Tool[] = [
  {
    name: "virustotal_check_url",
    description:
      "Scan a URL using VirusTotal to check for malware, phishing, and security threats",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to scan",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "virustotal_check_ip",
    description:
      "Check an IP address reputation using VirusTotal database",
    inputSchema: {
      type: "object",
      properties: {
        ip: {
          type: "string",
          description: "The IP address to check",
        },
      },
      required: ["ip"],
    },
  },
  {
    name: "virustotal_check_domain",
    description:
      "Check a domain reputation and security status using VirusTotal",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "The domain to check",
        },
      },
      required: ["domain"],
    },
  },
  {
    name: "virustotal_check_file_hash",
    description:
      "Check a file hash (MD5, SHA1, SHA256) against VirusTotal database",
    inputSchema: {
      type: "object",
      properties: {
        hash: {
          type: "string",
          description: "The file hash (MD5, SHA1, or SHA256)",
        },
      },
      required: ["hash"],
    },
  },
  {
    name: "abuseipdb_check_ip",
    description:
      "Check IP address reputation and abuse reports using AbuseIPDB",
    inputSchema: {
      type: "object",
      properties: {
        ip: {
          type: "string",
          description: "The IP address to check",
        },
      },
      required: ["ip"],
    },
  },
  {
    name: "abuseipdb_report_ip",
    description:
      "Report an abusive IP address to AbuseIPDB database",
    inputSchema: {
      type: "object",
      properties: {
        ip: {
          type: "string",
          description: "The IP address to report",
        },
        categories: {
          type: "string",
          description:
            "Comma-separated category IDs (e.g., '18,22' for brute-force and DDoS)",
        },
        comment: {
          type: "string",
          description: "Description of the abusive activity",
        },
      },
      required: ["ip", "categories", "comment"],
    },
  },
  {
    name: "shodan_search",
    description:
      "Search for devices and services on the internet using Shodan search engine",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Shodan search query (e.g., 'apache', 'port:22', 'country:US')",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "shodan_host_info",
    description:
      "Get detailed information about a host/IP address from Shodan",
    inputSchema: {
      type: "object",
      properties: {
        ip: {
          type: "string",
          description: "The IP address to get information about",
        },
      },
      required: ["ip"],
    },
  },
];

// Initialize MCP Server
const server = new Server(
  {
    name: "threat-intel-mcp",
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
      case "virustotal_check_url": {
        const result = await checkUrlVirusTotal(args.url as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "virustotal_check_ip": {
        const result = await checkIpVirusTotal(args.ip as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "virustotal_check_domain": {
        const result = await checkDomainVirusTotal(args.domain as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "virustotal_check_file_hash": {
        const result = await checkFileHashVirusTotal(args.hash as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "abuseipdb_check_ip": {
        const result = await checkIpAbuseIPDB(args.ip as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "abuseipdb_report_ip": {
        const result = await reportIpAbuseIPDB(
          args.ip as string,
          args.categories as string,
          args.comment as string
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "shodan_search": {
        const result = await searchShodan(args.query as string);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "shodan_host_info": {
        const result = await getHostInfoShodan(args.ip as string);
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
  console.error("Threat Intelligence MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
