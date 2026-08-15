import { getAdminSession } from "../../../../lib/admin-auth";
import { getOrder } from "../../../../lib/order-store";
import { isValidOrderId, noStoreJson } from "../../../../lib/security";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession("orders:read");
  if (!session) return noStoreJson({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!isValidOrderId(id)) return noStoreJson({ error: "Invalid order reference" }, { status: 400 });

  const order = await getOrder(id);
  if (!order) return noStoreJson({ error: "Order not found" }, { status: 404 });

  return noStoreJson({ order });
}
