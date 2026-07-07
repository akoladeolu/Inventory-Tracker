"use server";

import { db } from "@/lib/db";
import { products, categories, inventory, stock_movements } from "@/lib/db/schema";
import { eq, sql, and, ilike, or } from "drizzle-orm";
import { getUserProfile } from "@/lib/auth";

export async function getProducts(params?: {
  search?: string;
  category_id?: string;
  status?: string;
  page?: number;
  per_page?: number;
}) {
  const page = params?.page || 1;
  const per_page = params?.per_page || 20;
  const from = (page - 1) * per_page;

  let conditions = [];

  if (params?.search) {
    conditions.push(
      or(
        ilike(products.name, `%${params.search}%`),
        ilike(products.sku, `%${params.search}%`)
      )
    );
  }

  if (params?.category_id) {
    conditions.push(eq(products.category_id, params.category_id));
  }

  if (params?.status) {
    conditions.push(eq(products.status, params.status as "active" | "archived"));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      category_id: products.category_id,
      brand: products.brand,
      cost_price: products.cost_price,
      selling_price: products.selling_price,
      quantity: products.quantity,
      low_stock_threshold: products.low_stock_threshold,
      image_url: products.image_url,
      description: products.description,
      status: products.status,
      created_at: products.created_at,
      updated_at: products.updated_at,
      categories: {
        name: categories.name,
      },
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(where)
    .orderBy(sql`${products.created_at} DESC`)
    .limit(per_page)
    .offset(from);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(where);

  return {
    products: data,
    total: count,
    page,
    per_page,
    totalPages: Math.ceil(count / per_page),
  };
}

export async function getProduct(id: string) {
  const [data] = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      category_id: products.category_id,
      brand: products.brand,
      cost_price: products.cost_price,
      selling_price: products.selling_price,
      quantity: products.quantity,
      low_stock_threshold: products.low_stock_threshold,
      image_url: products.image_url,
      description: products.description,
      status: products.status,
      created_at: products.created_at,
      updated_at: products.updated_at,
      categories: {
        name: categories.name,
      },
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(eq(products.id, id));

  return data;
}

export async function createProduct(product: {
  name: string;
  sku: string;
  category_id: string;
  brand?: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold?: number;
  image_url?: string | null;
  description?: string;
}) {
  const profile = await getUserProfile();

  return await db.transaction(async (tx) => {
    // 1. Create product
    const [newProduct] = await tx
      .insert(products)
      .values({
        name: product.name,
        sku: product.sku,
        category_id: product.category_id,
        brand: product.brand || "",
        cost_price: product.cost_price.toString(),
        selling_price: product.selling_price.toString(),
        quantity: product.quantity,
        low_stock_threshold: product.low_stock_threshold || 10,
        image_url: product.image_url || null,
        description: product.description || "",
      })
      .returning();

    // 2. Create inventory record
    await tx.insert(inventory).values({
      product_id: newProduct.id,
      quantity: product.quantity,
    });

    // 3. Create initial stock movement if quantity > 0
    if (product.quantity > 0 && profile) {
      await tx.insert(stock_movements).values({
        product_id: newProduct.id,
        type: "stock_in",
        quantity: product.quantity,
        previous_quantity: 0,
        new_quantity: product.quantity,
        user_id: profile.id,
        notes: "Initial stock",
      });
    }

    return newProduct;
  });
}

export async function updateProduct(
  id: string,
  product: {
    name?: string;
    sku?: string;
    category_id?: string;
    brand?: string;
    cost_price?: number;
    selling_price?: number;
  low_stock_threshold?: number;
  image_url?: string | null;
  description?: string;
  status?: string;
  }
) {
  const updateData: Record<string, any> = {
    updated_at: new Date(),
  };

  if (product.name !== undefined) updateData.name = product.name;
  if (product.sku !== undefined) updateData.sku = product.sku;
  if (product.category_id !== undefined) updateData.category_id = product.category_id;
  if (product.brand !== undefined) updateData.brand = product.brand;
  if (product.cost_price !== undefined) updateData.cost_price = product.cost_price.toString();
  if (product.selling_price !== undefined) updateData.selling_price = product.selling_price.toString();
  if (product.low_stock_threshold !== undefined) updateData.low_stock_threshold = product.low_stock_threshold;
  if (product.image_url !== undefined) updateData.image_url = product.image_url;
  if (product.description !== undefined) updateData.description = product.description;
  if (product.status !== undefined) updateData.status = product.status;

  const [data] = await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, id))
    .returning();

  return data;
}

export async function archiveProduct(id: string) {
  return updateProduct(id, { status: "archived" });
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
}
