import { test, expect } from '@playwright/test';

test.describe('Checkout', () => {
  const BASE = 'http://localhost:3000';

  test.beforeEach(async ({ request }) => {
    await request.delete(`${BASE}/api/cart`);
  });

  test('POST /api/checkout creates an order and decrements stock', async ({ request }) => {
    // Get initial stock for record 1
    const before = await (await request.get(`${BASE}/api/records/1`)).json();

    // Add to cart and checkout
    await request.post(`${BASE}/api/cart`, { data: { recordId: 1, quantity: 1 } });
    const checkoutRes = await request.post(`${BASE}/api/checkout`, {
      data: { name: 'Jane Doe', email: 'jane@example.com', address: '123 Vinyl Lane, Brooklyn, NY 11201' },
    });

    expect(checkoutRes.status()).toBe(201);

    const order = await checkoutRes.json();
    expect(order).toHaveProperty('orderId');
    expect(order.items).toHaveLength(1);
    expect(order.items[0].recordId).toBe(1);
    expect(order.total).toBe(before.price);

    // Verify stock decremented
    const after = await (await request.get(`${BASE}/api/records/1`)).json();
    expect(after.stock).toBe(before.stock - 1);
  });

  test('POST /api/checkout with empty cart returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/checkout`, {
      data: { name: 'Jane Doe', email: 'jane@example.com', address: '123 Vinyl Lane' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Cart is empty');
  });

  test('GET /api/orders/:id returns the created order', async ({ request }) => {
    await request.post(`${BASE}/api/cart`, { data: { recordId: 3, quantity: 2 } });
    const checkoutRes = await request.post(`${BASE}/api/checkout`, {
      data: { name: 'Jane Doe', email: 'jane@example.com', address: '123 Vinyl Lane' },
    });
    const { orderId } = await checkoutRes.json();

    const orderRes = await request.get(`${BASE}/api/orders/${orderId}`);
    expect(orderRes.status()).toBe(200);

    const order = await orderRes.json();
    expect(order.id).toBe(orderId);
    expect(order.status).toBe('confirmed');
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(2);
  });

  test('full checkout flow via UI', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    // Add item to cart
    await page.getByTestId('add-to-cart-1').click();
    await expect(page.getByTestId('cart-badge')).toContainText('1');

    // Open cart and click checkout
    await page.getByTestId('cart-button').click();
    await expect(page.getByTestId('cart-drawer')).toBeVisible();
    await page.getByTestId('checkout-btn').click();

    // Fill in customer details
    await expect(page.getByTestId('checkout-form')).toBeVisible();
    await page.getByTestId('checkout-name').fill('Jane Doe');
    await page.getByTestId('checkout-email').fill('jane@example.com');
    await page.getByTestId('checkout-address').fill('123 Vinyl Lane, Brooklyn, NY 11201');
    await page.getByTestId('place-order-btn').click();

    // Verify confirmation appears
    await expect(page.getByTestId('checkout-confirmation')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('checkout-confirmation')).toContainText('Order');
  });
});
