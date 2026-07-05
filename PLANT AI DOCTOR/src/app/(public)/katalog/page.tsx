import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { Product } from "@/types";
import KatalogClient from "@/components/catalog/KatalogClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Katalog Produk | Bakoel Kembang Boyolali",
  description: "Jelajahi berbagai koleksi tanaman hias, bunga potong segar, pupuk berkualitas, pot cantik, dan aksesoris berkebun terlengkap di Bakoel Kembang Boyolali.",
};

async function getProducts(): Promise<Product[]> {
  let products: Product[] = [];
  
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    
    const res = await fetch(`${baseUrl}/api/products`, {
      cache: "no-store",
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        products = json.data;
      }
    }
  } catch (error) {
    console.error("Gagal fetch dari API /api/products, menggunakan fallback DB query:", error);
    
    try {
      const supabase = createAdminClient();
      const { data, error: dbError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
        
      if (!dbError && data) {
        products = data;
      }
    } catch (fallbackError) {
      console.error("Fallback query database gagal:", fallbackError);
    }
  }
  
  return products;
}

export default async function KatalogPage() {
  const products = await getProducts();
  return <KatalogClient products={products} />;
}
