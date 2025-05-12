const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP_NAME;
const METAFIELD_NAMESPACE = "custom";
const METAFIELD_KEY = "lost_status";

async function updateLostStatus(handle, status, res) {
  console.log(`▶️ Updating Page Metafield for: ${handle}, status: ${status}`);

  try {
    const pageResp = await axios.get(
      `https://${SHOPIFY_SHOP}.myshopify.com/admin/api/2023-10/pages.json?handle=${handle}`,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    const pages = pageResp.data.pages;
    if (!pages || pages.length === 0) {
      return res.status(404).send("Page not found for handle: " + handle);
    }

    const pageId = pages[0].id;

    const metafieldPayload = {
      metafield: {
        namespace: METAFIELD_NAMESPACE,
        key: METAFIELD_KEY,
        type: "boolean",
        value: status.toString()
      }
    };

    await axios.post(
      `https://${SHOPIFY_SHOP}.myshopify.com/admin/api/2023-10/pages/${pageId}/metafields.json`,
      metafieldPayload,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Page metafield updated for page ID:", pageId);
    res.send(`Pet marked as ${status ? "LOST" : "FOUND"}`);
  } catch (err) {
    console.error("❌ Error:", err?.response?.data || err.message);
    res.status(500).send("Something went wrong.");
  }
}

app.get('/mark-lost', async (req, res) => {
  const handle = req.query.handle;
  if (!handle) return res.status(400).send("Missing 'handle'");
  await updateLostStatus(handle, true, res);
});

app.get('/mark-found', async (req, res) => {
  const handle = req.query.handle;
  if (!handle) return res.status(400).send("Missing 'handle'");
  await updateLostStatus(handle, false, res);
});

app.listen(PORT, () => {
  console.log(`📝 REST Page Metafield backend running on port ${PORT}`);
});