import https from "node:https";
import http from "node:http";
import { HttpsProxyAgent } from "https-proxy-agent";
import dotenv from "dotenv";

dotenv.config();

// Create proxy agent if credentials are configured
let proxyAgent = null;
if (process.env.PROXY_HOST && process.env.PROXY_USER && process.env.PROXY_PASS) {
  proxyAgent = new HttpsProxyAgent(
    `http://${process.env.PROXY_USER}:${process.env.PROXY_PASS}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`
  );
}

export async function proxyTs(url, headers, req, res) {
  let forceHTTPS = false;

  if (url.startsWith("https://")) {
    forceHTTPS = true;
  }

  const uri = new URL(url);
  const options = {
    hostname: uri.hostname,
    port: uri.port,
    path: uri.pathname + uri.search,
    method: req.method,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
      ...headers,
    },
    ...(proxyAgent ? { agent: proxyAgent } : {}),
  };
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");

  try {
    const proxyFn = forceHTTPS ? https : http;
    const proxy = proxyFn.request(options, (r) => {
        r.headers["content-type"] = "video/mp2t";
        res.writeHead(r.statusCode ?? 200, r.headers);
        r.pipe(res, {
          end: true,
        });
      });

      req.pipe(proxy, {
          end: true,
        });
  } catch (e) {
    res.writeHead(500);
    res.end(e.message);
    return null;
  }
}

