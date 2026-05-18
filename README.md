# M3U8 Proxy Server

Welcome to the M3U8 Proxy Server! Tired of dealing with those pesky CORS errors when trying to stream your M3U8 files? Fear not, because our proxy server is here to save the day!

## 🎯 What This Project Does

This Node.js application acts as a middleman between your requests and the M3U8 files you're trying to access. Just drop your M3U8 link into the input box, and we'll take care of the rest. Our server proxies the M3U8 file and provides you with a new link to use—free from CORS troubles.

### Cloudflare-worker

- Create an example starter worker in your cloudflare account
- Edit the code of the worker after deploying it
- Override the code of your starter worker with the code given in `m3u8proxy(cf_worker).js`
- Deploy your worker

## 🚀 How It Works

1. **Enter Your M3U8 Link**: Simply input your M3U8 URL into the provided input box.
2. **Get a Proxied Link**: Our server fetches the M3U8 file and proxies it for you.
3. **Use the Proxied Link**: Replace your original link with the new proxied link in your platform.

## <span>⚙️ Envs</span>

- `HOST`: host of your proxy server `optional`
- `PORT`: port number (any) `optional`
- `PUBLIC_URL`: link of your website `mandatory`
- `ALLOWED_ORIGINS`: origins you want to allow `mandatory`

## 🕵️‍♂️ How to Use

If you want to use the proxy directly, append your M3U8 link to the following URL:

[https://<server-ip>/m3u8-proxy?url={url}](https://<server-ip>/m3u8-proxy?url={url})

For example, if your M3U8 link is `https://example.com/stream.m3u8`, you would use:

[https://<server-ip>/m3u8-proxy?url=https://example.com/stream.m3u8](https://<server-ip>/m3u8-proxy?url=https://example.com/stream.m3u8)

## 😂 A Note About CORS

CORS, oh CORS—you're like that friend who always shows up uninvited. But don’t worry, our proxy server is the bouncer that keeps you and your streams happy and stress-free. No more unwanted guests in the form of CORS errors!

## 📜 License

This project is licensed under the MIT License.

## 🤝 Contributing

Feel free to open issues or pull requests if you have suggestions or improvements!

<br/>
