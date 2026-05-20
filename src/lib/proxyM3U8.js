import dotenv from "dotenv";
import {
  buildProxyRequestUrl,
  createProxyClient,
  DEFAULT_PROXY_PORT,
  writeProxyError,
} from "../utils/proxyClient.js";

dotenv.config();

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || 8080;
const web_server_url =
  process.env.BASE_URL_DOMAIN || process.env.PUBLIC_URL || `http://${host}:${port}`;

export default async function proxyM3U8(
  url,
  headers,
  res,
  proxyPort = DEFAULT_PROXY_PORT,
  baseUrl = web_server_url
) {
  try {
    const client = createProxyClient(proxyPort, {
      responseType: "text",
      validateStatus: () => true,
    });

    const upstream = await client.get(url, { headers });

    if (upstream.status === 407) {
      res.writeHead(407, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end(
        "Proxy authentication required or the residential proxy rejected the credentials."
      );
      return;
    }

    if (upstream.status >= 400) {
      res.writeHead(upstream.status, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end(
        typeof upstream.data === "string" && upstream.data.trim()
          ? upstream.data
          : `Upstream playlist request failed with status ${upstream.status}.`
      );
      return;
    }

    const lines = String(upstream.data).split("\n");
    const newLines = [];

    for (const line of lines) {
      if (line.startsWith("#")) {
        if (line.startsWith("#EXT-X-KEY:")) {
          const regex = /https?:\/\/[^"\s]+/g;
          const match = regex.exec(line);
          if (match) {
            const keyUrl = buildProxyRequestUrl({
              baseUrl,
              headers,
              path: "/ts-proxy",
              proxyPort,
              targetUrl: match[0],
            });
            newLines.push(line.replace(match[0], keyUrl));
          } else {
            newLines.push(line);
          }
        } else if (line.startsWith("#EXT-X-MEDIA:TYPE=AUDIO")) {
          const regex = /URI="([^"]+)"/;
          const match = regex.exec(line);
          if (match) {
            const absUrl = new URL(match[1], url).href;
            const audioUrl = buildProxyRequestUrl({
              baseUrl,
              headers,
              path: "/m3u8-proxy",
              proxyPort,
              targetUrl: absUrl,
            });
            newLines.push(line.replace(match[1], audioUrl));
          } else {
            newLines.push(line);
          }
        } else if (line.startsWith("#EXT-X-I-FRAME-STREAM-INF")) {
          const regex = /URI="([^"]+)"/;
          const match = regex.exec(line);
          if (match) {
            const absUrl = new URL(match[1], url).href;
            const iframeUrl = buildProxyRequestUrl({
              baseUrl,
              headers,
              path: "/m3u8-proxy",
              proxyPort,
              targetUrl: absUrl,
            });
            newLines.push(line.replace(match[1], iframeUrl));
          } else {
            newLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      } else if (line.trim() !== "") {
        const absUrl = new URL(line, url).href;
        const isM3U8 = absUrl.includes(".m3u8");
        const path = isM3U8 ? "/m3u8-proxy" : "/ts-proxy";
        const proxyUrl = buildProxyRequestUrl({
          baseUrl,
          headers,
          path,
          proxyPort,
          targetUrl: absUrl,
        });
        newLines.push(proxyUrl);
      } else {
        newLines.push("");
      }
    }

    [
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Access-Control-Max-Age",
      "Access-Control-Allow-Credentials",
      "Access-Control-Expose-Headers",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
      "Origin",
      "Vary",
      "Referer",
      "Server",
      "x-cache",
      "via",
      "x-amz-cf-pop",
      "x-amz-cf-id",
    ].forEach((header) => res.removeHeader(header));

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");

    res.end(newLines.join("\n"));
  } catch (error) {
    writeProxyError(res, error, "Playlist proxy failed");
  }
}
