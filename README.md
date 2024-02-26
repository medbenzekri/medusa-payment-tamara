<p align="center">
  <a href="https://tamara.co">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.tamara.co/assets/png/tamara-logo-badge-en.png">
    <source media="(prefers-color-scheme: light)" srcset="https://cdn.tamara.co/assets/png/tamara-logo-badge-en.png">
    <img alt="Tamara logo" src="https://cdn.tamara.co/assets/png/tamara-logo-badge-en.png">
    </picture>
  </a>
</p>
<h1 align="center">
  Tamara
</h1>

<h4 align="center">
  <a href="https://docs.tamara.co">Documentation</a> |
  <a href="https://tamara.co">Website</a>
</h4>

<p align="center">
  Building blocks for digital commerce
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/master/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    <a href="https://www.producthunt.com/posts/medusa"><img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt"></a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

## Compatibility

This plugin is compatible with versions >= 1.20.2 of `@medusajs/medusa`. 

## How to Install

1\. Run the following command in the directory of the Medusa backend:

  ```bash
  yarn add medusa-payment-tamara
  ```

2\. Set the following environment variables in `.env`:

  ```bash
  TAMARA_TOKEN=YOUR_TAMARA_TOKEN
  #this is the sandbox api set to xxxx for production 
  TAMARA_API=https://api-sandbox.tamara.co
  # the redirecting url for the user 
  WEB_ENDPOINT="http://localhost:3000"
  ```

3\. In `medusa-config.js` add the following at the end of the `plugins` array:

  ```js
  const plugins = [
    // ...
    {
      resolve: `medusa-payment-tamara`,
      options: {
        tamara_token: process.env.TAMARA_TOKEN,
        tamara_api: process.env.TAMARA_API,
        web_endpoint: process.env.WEB_ENDPOINT
      },
    },
  ]
  ```

---

