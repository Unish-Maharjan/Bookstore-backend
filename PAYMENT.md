# Sandbox payment workflow

This project uses MongoDB through Mongoose. MongoDB creates the `orders` and `payments` collections and indexes from the schemas when the application starts, so there is no SQL migration or migration command. Existing collections and data are not deleted or replaced.

## Configuration

Copy `.env.example` to `.env` and set real local values for `DATABASE_URI` and `JWT_SECRET`. Keep:

```env
PAYMENT_MODE=test
```

The test flow never contacts a bank or payment provider. Verification succeeds only when the authenticated user owns the pending payment, `PAYMENT_MODE=test`, the supplied `success` value is `true`, and the generated `TEST-TXN-...` reference matches the stored payment.

## Run

```powershell
npm install
npm start
```

Ensure MongoDB is running at the URI in `.env`. There is no separate database update command. Restarting the backend is sufficient for Mongoose to create the new collections/indexes.

## API flow

All payment and order endpoints use the existing `Authorization: Bearer <token>` middleware.

1. Register or log in with `POST /auth/register` or `POST /auth/login` and copy `token`.
2. Add a book to the authenticated user's cart with the existing `POST /cart` endpoint. Use the book's ID and quantity. The cart implementation currently expects `userId` in the request body, so use the logged-in user's MongoDB ID.
3. Create an order from that cart:

```http
POST http://localhost:3000/api/orders
Authorization: Bearer <token>
Content-Type: application/json

{}
```

The response contains the backend-calculated `totalAmount`, for example `1500`, `currency: "NPR"`, and `status: "PENDING_PAYMENT"`. Copy `_id` as `orderId`.

4. Initiate the sandbox payment. Do not send an amount:

```http
POST http://localhost:3000/api/payments/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "<orderId>",
  "paymentMethod": "TEST"
}
```

The response is `201` and includes a generated reference like `TEST-TXN-1A2B3C4D5E6F7890`, `status: "PENDING"`, and the amount copied from the order.

5. Verify the transaction:

```http
POST http://localhost:3000/api/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "transactionId": "<transactionId>",
  "success": true
}
```

Successful response:

```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "paymentId": "<paymentId>",
    "transactionId": "TEST-TXN-1A2B3C4D5E6F7890",
    "orderId": "<orderId>",
    "amount": 1500,
    "currency": "NPR",
    "paymentMethod": "TEST",
    "status": "COMPLETED"
  }
}
```

6. Confirm both records:

```http
GET http://localhost:3000/api/payments/<paymentId>
Authorization: Bearer <token>
```

```http
GET http://localhost:3000/api/orders/<orderId>
Authorization: Bearer <token>
```

The payment is `COMPLETED`; the order is `PAID` with `paymentStatus: "PAID"`.

The same requests are ready to paste into Postman or use from `payment-flow.http` with the VS Code REST Client extension. A failed verification (`success: false`) returns `400`, marks the payment `FAILED`, and does not mark the order paid. A second initiation for the same order is rejected with `409`.