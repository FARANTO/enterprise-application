import { Button } from '@/components/ui/button';

export default function ReceiptModal({ open, onClose, order }) {
  if (!open || !order) return null;

  const itemsHtml = (order.items || []).map((item) => {
    const name = item.product?.name || item.productName || `Product ${item.productId}`;
    const price = item.price?.toFixed?.(2) ?? Number(item.price || 0).toFixed(2);
    const total = ((item.price || 0) * (item.quantity || 0)).toFixed(2);
    return `<tr><td>${name}</td><td>${item.quantity || 0}</td><td>₹${price}</td><td>₹${total}</td></tr>`;
  }).join('');

  function printReceipt() {
    const w = window.open('', 'PRINT', 'width=600,height=800');
    if (!w) return;

    const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
    const branchName = order.branch?.name || order.branchName || '';
    const storeName = order.store?.name || order.storeName || '';
    const cashierName = order.cashier?.fullName || order.cashier?.FullName || order.cashierName || '';

    const html = `
      <html>
        <head>
          <title>Receipt ${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h2>Receipt - Order #${order.id}</h2>
          <div><strong>Store:</strong> ${storeName || '—'}</div>
          <div><strong>Branch:</strong> ${branchName || '—'}</div>
          <div><strong>Cashier:</strong> ${cashierName || '—'}</div>
          <div><strong>Date:</strong> ${createdAt}</div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <h3>Total: ₹${(order.totalAmount || 0).toFixed(2)}</h3>
          ${order.discountAmount ? `<div>Discount: -₹${Number(order.discountAmount || 0).toFixed(2)}</div>` : ''}
        </body>
      </html>
    `;

    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl bg-card p-5 rounded-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Receipt for Order #{order.id}</h3>
            <p className="text-sm text-muted-foreground">{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'No date available'}</p>
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>

        <div className="grid gap-2 mb-4 text-sm">
          <div><strong>Store:</strong> {order.store?.name || order.storeName || '—'}</div>
          <div><strong>Branch:</strong> {order.branch?.name || order.branchName || '—'}</div>
          <div><strong>Cashier:</strong> {order.cashier?.fullName || order.cashier?.FullName || order.cashierName || '—'}</div>
          <div><strong>Payment:</strong> {order.paymentType || '—'}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item) => (
                <tr key={item.id || item.productId} className="border-t">
                  <td className="px-3 py-2">{item.product?.name || item.productName || `Product ${item.productId}`}</td>
                  <td className="px-3 py-2">{item.quantity || 0}</td>
                  <td className="px-3 py-2">₹{(item.price || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 border-t pt-4 text-right">
          <div className="text-base">Total amount: <strong>₹{(order.totalAmount || 0).toFixed(2)}</strong></div>
          {order.discountAmount ? <div className="text-sm text-red-600">Discount: -₹{Number(order.discountAmount || 0).toFixed(2)}</div> : null}
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={printReceipt}>Print Receipt</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
