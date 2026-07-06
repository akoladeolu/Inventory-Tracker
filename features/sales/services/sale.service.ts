import { db } from "@/lib/db";
import { sales, sale_items, products, stock_movements, inventory } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

interface SaleItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface CreateSaleInput {
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: "cash" | "card" | "transfer" | "mobile";
  user_id: string;
  items: SaleItemInput[];
}

export async function createSale(input: CreateSaleInput) {
  return await db.transaction(async (tx) => {
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // 1. Create sale record
    const [sale] = await tx
      .insert(sales)
      .values({
        invoice_number: invoiceNumber,
        customer_name: input.customer_name || "",
        customer_phone: input.customer_phone || "",
        subtotal: input.subtotal.toString(),
        discount: input.discount.toString(),
        total: input.total.toString(),
        payment_method: input.payment_method,
        user_id: input.user_id,
      })
      .returning();

    // 2. Process each item
    for (const item of input.items) {
      // Insert sale item
      await tx.insert(sale_items).values({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price.toString(),
        total: item.total.toString(),
      });

      // Get current product quantity for stock movement tracking
      const [product] = await tx
        .select({ quantity: products.quantity })
        .from(products)
        .where(eq(products.id, item.product_id));

      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      const previousQuantity = product.quantity;

      // Atomic quantity update with insufficient stock check
      const [updatedProduct] = await tx
        .update(products)
        .set({
          quantity: sql`quantity - ${item.quantity}`,
          updated_at: new Date(),
        })
        .where(
          and(
            eq(products.id, item.product_id),
            gte(products.quantity, item.quantity)
          )
        )
        .returning();

      if (!updatedProduct) {
        throw new Error(`Insufficient stock for product: ${item.product_id}`);
      }

      // Sync inventory table
      await tx
        .update(inventory)
        .set({
          quantity: sql`quantity - ${item.quantity}`,
          updated_at: new Date(),
        })
        .where(eq(inventory.product_id, item.product_id));

      // Create stock movement
      await tx.insert(stock_movements).values({
        product_id: item.product_id,
        type: "sale",
        quantity: item.quantity,
        previous_quantity: previousQuantity,
        new_quantity: previousQuantity - item.quantity,
        user_id: input.user_id,
        notes: `Sale ${invoiceNumber}`,
      });
    }

    return sale;
  });
}

export async function getSales(params?: {
  page?: number;
  per_page?: number;
}) {
  const page = params?.page || 1;
  const per_page = params?.per_page || 50;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  const data = await db
    .select()
    .from(sales)
    .orderBy(sql`${sales.created_at} DESC`)
    .limit(per_page)
    .offset(from);

  return data;
}

export async function getSaleById(id: string) {
  const [sale] = await db
    .select()
    .from(sales)
    .where(eq(sales.id, id));

  if (!sale) return null;

  const items = await db
    .select({
      id: sale_items.id,
      quantity: sale_items.quantity,
      unit_price: sale_items.unit_price,
      total: sale_items.total,
      product: {
        id: products.id,
        name: products.name,
        sku: products.sku,
      },
    })
    .from(sale_items)
    .innerJoin(products, eq(sale_items.product_id, products.id))
    .where(eq(sale_items.sale_id, id));

  return { ...sale, items };
}
