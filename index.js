const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const graphqlEndpoint = `https://${SHOPIFY_SHOP}.myshopify.com/admin/api/2023-10/graphql.json`;

app.get('/mark-lost', async (req, res) => {
  const { handle, location } = req.query;

  if (!handle) {
    return res.status(400).json({ error: 'Missing handle' });
  }

  console.log(`📍 Marking ${handle} as LOST with location: ${location || 'N/A'}`);

  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        query: `
          mutation UpdatePetProfile($handle: String!, $lost: Boolean!, $location: String) {
            metaobjectUpdate(handle: $handle, type: "pet_profile", metaobject: {
              fields: [
                { key: "lost_status", value: $lost },
                { key: "last_seen_location", value: $location }
              ]
            }) {
              metaobject { id }
              userErrors { field, message }
            }
          }
        `,
        variables: {
          handle: handle,
          lost: true,
          location: location || ''
        }
      })
    });

    const result = await response.json();

    if (result.errors || result.data?.metaobjectUpdate?.userErrors?.length) {
      console.error('❌ Error:', result.errors || result.data.metaobjectUpdate.userErrors);
      return res.status(500).json({ error: 'GraphQL update failed', detail: result });
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Exception:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/mark-found', async (req, res) => {
  const { handle } = req.query;

  if (!handle) {
    return res.status(400).json({ error: 'Missing handle' });
  }

  console.log(`✅ Marking ${handle} as FOUND`);

  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        query: `
          mutation UpdatePetProfile($handle: String!, $lost: Boolean!) {
            metaobjectUpdate(handle: $handle, type: "pet_profile", metaobject: {
              fields: [
                { key: "lost_status", value: $lost }
              ]
            }) {
              metaobject { id }
              userErrors { field, message }
            }
          }
        `,
        variables: {
          handle: handle,
          lost: false
        }
      })
    });

    const result = await response.json();

    if (result.errors || result.data?.metaobjectUpdate?.userErrors?.length) {
      console.error('❌ Error:', result.errors || result.data.metaobjectUpdate.userErrors);
      return res.status(500).json({ error: 'GraphQL update failed', detail: result });
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Exception:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(port, () => {
  console.log(`📝 REST Page Metafield backend running on port ${port}`);
});