import { ProductFormPage } from "@/components/products/product-form-page";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductFormPage productId={productId} />;
}
