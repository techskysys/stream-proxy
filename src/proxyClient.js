import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import dotenv from "dotenv";

dotenv.config();

const agent = new HttpsProxyAgent(
  `http://${process.env.PROXY_USER}:${process.env.PROXY_PASS}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`
);

export async function fetchWithProxy(url, headers = {}) {
  const res = await axios.get(url, {
    httpsAgent: agent,
    httpAgent: agent,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      ...headers,
    },
    timeout: 20000,
  });

  return res.data;
}
