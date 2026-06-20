import colors from "colors";
import { text as streamToText } from "node:stream/consumers";
import {
  createProxyClient,
  getRandomProxyPort,
  writeProxyError,
} from "../utils/proxyClient.js";

export async function proxyTs(
  url,
  headers,
  req,
  res,
  proxyPort
) {
  const resolvedPort = proxyPort ?? getRandomProxyPort();

  const fileName = url.split("/").pop()?.split("?")[0] || url;
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  console.log(
    colors.gray(`[${time}]`) +
      colors.cyan(" [ ts ]") +
      colors.yellow(` port ${resolvedPort}`) +
      colors.white(` → ${fileName}`)
  );

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");

  try {
    const client = createProxyClient(resolvedPort, {
      responseType: "stream",
      validateStatus: () => true,
    });

    const upstream = await client.request({
      data: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : req,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
        ...headers,
      },
      method: req.method ?? "GET",
      url,
    });

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
      const errorBody = await streamToText(upstream.data).catch(() => "");
      res.writeHead(upstream.status, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end(
        errorBody.trim()
          ? errorBody
          : `Upstream segment request failed with status ${upstream.status}.`
      );
      return;
    }

    res.writeHead(upstream.status ?? 200, {
      ...upstream.headers,
      "content-type": upstream.headers["content-type"] || "video/mp2t",
    });

    upstream.data.pipe(res, {
      end: true,
    });
  } catch (e) {
    writeProxyError(res, e, "Segment proxy failed");
    return null;
  }
}
