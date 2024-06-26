import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const productsEndpoint = "https://gradistore-spi.herokuapp.com/products/all";
const shopifyProductsEndpoint = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2024-04/products.json`;
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

async function fetchProductsFromExternalAPI() {
  try {
    const response = await fetch(productsEndpoint);
    if (!response.ok) {
      throw new Error(
        `Error al obtener los productos: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.products.nodes;
  } catch (error) {
    console.error(
      "Error al obtener los productos de la API externa:",
      error.message
    );
    throw error;
  }
}

async function createProductsInShopify(products) {
  try {
    for (const product of products) {
      const newProduct = {
        product: {
          title: product.title,
          body_html: `<strong>${product.title}</strong>`,
          vendor: "Gradiweb",
          product_type: "Tipo de producto",
          published: true,
          variants: [
            {
              price: parseFloat(product.prices.min.amount),
              sku: "SKU-123",
              inventory_quantity: product.totalInventory,
            },
          ],
          images: [
            {
              src: product.featuredImage.url,
            },
          ],
        },
      };

      const response = await fetch(shopifyProductsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        throw new Error(
          `Error al crear el producto ${product.title}: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();
      console.log(`Producto creado en Shopify: ${responseData.product.title}`);
    }
  } catch (error) {
    console.error("Error al crear productos en Shopify:", error.message);
    throw error;
  }
}

async function main() {
  try {
    const products = await fetchProductsFromExternalAPI();
    await createProductsInShopify(products);
  } catch (error) {
    console.error("Error en la aplicación:", error);
  }
}

// Ejecutar la función principal
main();
