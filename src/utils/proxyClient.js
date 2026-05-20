import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

export const DEFAULT_PROXY_PORT = 10001;

export function resolveProxyPort(port = process.env.PROXY_PORT ?? DEFAULT_PROXY_PORT) {
  const parsedPort = Number(port);
  return Number.isInteger(parsedPort) && parsedPort > 0
    ? parsedPort
    : DEFAULT_PROXY_PORT;
}

function getProxyPassword() {
  return (
    process.env.PROXY_PASSWORD ||
    process.env.PROXY_PASS ||
    process.env.PROXY_SECRET ||
    ""
  );
}

export function getProxyConfig(port = DEFAULT_PROXY_PORT) {
  const host = process.env.PROXY_HOST;
  const user = process.env.PROXY_USER;
  const password = getProxyPassword();

  if (!host || !user || !password) {
    throw new Error(
      "Missing proxy configuration. Set PROXY_HOST, PROXY_USER, and PROXY_PASSWORD."
    );
  }

  const resolvedPort = resolveProxyPort(port);
  const proxyUrl = `http://${encodeURIComponent(user)}:${encodeURIComponent(
    password
  )}@${host}:${resolvedPort}`;

  return {
    host,
    password,
    port: resolvedPort,
    proxyUrl,
    user,
  };
}

export function createProxyAgent(port = DEFAULT_PROXY_PORT) {
  const { proxyUrl } = getProxyConfig(port);
  return new HttpsProxyAgent(proxyUrl);
}

export function createProxyClient(port = DEFAULT_PROXY_PORT, axiosConfig = {}) {
  const proxyAgent = createProxyAgent(port);

  return axios.create({
    ...axiosConfig,
    proxy: false,
    timeout: axiosConfig.timeout ?? Number(process.env.PROXY_TIMEOUT_MS || 20000),
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
}

export function buildProxyRequestUrl({
  baseUrl,
  headers = {},
  path,
  proxyPort,
  targetUrl,
}) {
  const proxyUrl = new URL(path, baseUrl);
  proxyUrl.searchParams.set("url", targetUrl);
  proxyUrl.searchParams.set("headers", JSON.stringify(headers));

  if (proxyPort !== undefined && proxyPort !== null) {
    proxyUrl.searchParams.set("proxyPort", String(resolveProxyPort(proxyPort)));
  }

  return proxyUrl.toString();
}

export function getProxyErrorStatus(error) {
  if (error?.response?.status === 407) {
    return 407;
  }

  if (Number.isInteger(error?.response?.status)) {
    return error.response.status;
  }

  if (error?.code === "ECONNABORTED") {
    return 504;
  }

  if (
    [
      "ECONNRESET",
      "EPIPE",
      "ETIMEDOUT",
      "ENOTFOUND",
      "EAI_AGAIN",
      "socket hang up",
    ].includes(error?.code)
  ) {
    return 502;
  }

  return 502;
}

export function getProxyErrorMessage(error, fallbackMessage = "Proxy request failed") {
  if (error?.response?.status === 407) {
    return "Proxy authentication required or the residential proxy rejected the credentials.";
  }

  if (error?.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function writeProxyError(res, error, fallbackMessage = "Proxy request failed") {
  const statusCode = getProxyErrorStatus(error);
  const message = getProxyErrorMessage(error, fallbackMessage);

  if (!res.headersSent) {
    res.writeHead(statusCode, {
      "Content-Type": "text/plain; charset=utf-8",
    });
  }

  res.end(message);
}