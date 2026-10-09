const fs = require('fs');
const path = require('path');

const collectionPaths = [
  path.join(__dirname, '../docs/postman/TrueLern-Complete-API.postman_collection.json'),
  path.join(__dirname, '../TrueLern_Postman_Collection.json')
];

const newRequests = [
  {
    name: '[POST] /api/finance/stripe/create-checkout',
    request: {
      method: 'POST',
      header: [
        { key: 'Authorization', value: 'Bearer {{accessToken}}', type: 'text' },
        { key: 'Cookie', value: 'accessToken={{accessToken}}; refreshToken={{refreshToken}}', type: 'text' },
        { key: 'Content-Type', value: 'application/json', type: 'text' }
      ],
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          invoiceId: '{{invoiceId}}',
          studentId: '{{studentId}}',
          successUrl: '{{baseUrl}}/parent/finance?payment=success&invoiceId={{invoiceId}}',
          cancelUrl: '{{baseUrl}}/parent/finance?payment=cancelled&invoiceId={{invoiceId}}'
        }, null, 2)
      },
      url: {
        raw: '{{baseUrl}}/api/finance/stripe/create-checkout',
        host: ['{{baseUrl}}'],
        path: ['api', 'finance', 'stripe', 'create-checkout']
      },
      description: '**Purpose:** Creates a server-authoritative Stripe Checkout session for an invoice.\n**Authentication:** Required\n**Role:** Parent, Student, Admin\n**Source File:** `app/api/finance/stripe/create-checkout/route.ts`'
    },
    response: [],
    event: [
      {
        listen: 'test',
        script: {
          exec: [
            'pm.test("Status code is 200 or 400", function () {',
            '    pm.expect([200, 400]).to.include(pm.response.code);',
            '});'
          ],
          type: 'text/javascript'
        }
      }
    ]
  },
  {
    name: '[POST] /api/finance/stripe/webhook',
    request: {
      method: 'POST',
      header: [
        { key: 'stripe-signature', value: '{{stripeSignature}}', type: 'text' },
        { key: 'Content-Type', value: 'application/json', type: 'text' }
      ],
      body: {
        mode: 'raw',
        raw: '{"id": "evt_mock", "type": "checkout.session.completed"}'
      },
      url: {
        raw: '{{baseUrl}}/api/finance/stripe/webhook',
        host: ['{{baseUrl}}'],
        path: ['api', 'finance', 'stripe', 'webhook']
      },
      description: '**Purpose:** Receives, validates signatures, and idempotently processes Stripe Webhook events.\n**Authentication:** Stripe Signature Header\n**Source File:** `app/api/finance/stripe/webhook/route.ts`'
    },
    response: [],
    event: [
      {
        listen: 'test',
        script: {
          exec: [
            'pm.test("Status code is 200 or 400", function () {',
            '    pm.expect([200, 400]).to.include(pm.response.code);',
            '});'
          ],
          type: 'text/javascript'
        }
      }
    ]
  },
  {
    name: '[GET] /api/admin/finance/health',
    request: {
      method: 'GET',
      header: [
        { key: 'Authorization', value: 'Bearer {{accessToken}}', type: 'text' },
        { key: 'Cookie', value: 'accessToken={{accessToken}}; refreshToken={{refreshToken}}', type: 'text' }
      ],
      url: {
        raw: '{{baseUrl}}/api/admin/finance/health',
        host: ['{{baseUrl}}'],
        path: ['api', 'admin', 'finance', 'health']
      },
      description: '**Purpose:** Diagnostic health check for Stripe payment gateway and environment mode alignment.\n**Authentication:** Required\n**Role:** Admin, Super Admin\n**Source File:** `app/api/admin/finance/health/route.ts`'
    },
    response: [],
    event: [
      {
        listen: 'test',
        script: {
          exec: [
            'pm.test("Status code is 200", function () {',
            '    pm.response.to.have.status(200);',
            '});'
          ],
          type: 'text/javascript'
        }
      }
    ]
  },
  {
    name: '[GET] /api/admin/finance/reconcile',
    request: {
      method: 'GET',
      header: [
        { key: 'Authorization', value: 'Bearer {{accessToken}}', type: 'text' },
        { key: 'Cookie', value: 'accessToken={{accessToken}}; refreshToken={{refreshToken}}', type: 'text' }
      ],
      url: {
        raw: '{{baseUrl}}/api/admin/finance/reconcile?invoiceId={{invoiceId}}',
        host: ['{{baseUrl}}'],
        path: ['api', 'admin', 'finance', 'reconcile'],
        query: [
          { key: 'invoiceId', value: '{{invoiceId}}' }
        ]
      },
      description: '**Purpose:** Read-only reconciliation tool comparing Stripe truth vs Invoice vs Payment vs Receipt vs Enrollment.\n**Authentication:** Required\n**Role:** Admin, Super Admin, Finance Manager\n**Source File:** `app/api/admin/finance/reconcile/route.ts`'
    },
    response: [],
    event: [
      {
        listen: 'test',
        script: {
          exec: [
            'pm.test("Status code is 200", function () {',
            '    pm.response.to.have.status(200);',
            '});'
          ],
          type: 'text/javascript'
        }
      }
    ]
  }
];

for (const filePath of collectionPaths) {
  if (!fs.existsSync(filePath)) continue;
  const col = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const f = col.item.find(i => i.name && i.name.includes('17 Finance'));
  if (!f) continue;

  const existingNames = new Set(f.item.map(i => i.name));
  let added = 0;
  for (const r of newRequests) {
    if (!existingNames.has(r.name)) {
      f.item.push(r);
      added++;
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(col, null, 2), 'utf8');
  console.log(`Updated ${path.basename(filePath)}: added ${added} requests (total in 17 Finance: ${f.item.length})`);
}
