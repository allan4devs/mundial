import type { StoreProduct, StoreProductCategory } from "@/lib/store/products";

export type ProductCategory = "all" | StoreProductCategory;
export type Product = StoreProduct;

export type CartItem = {
  productId: string;
  quantity: number;
};

export const CART_STORAGE_KEY = "lavieja-store-cart";
