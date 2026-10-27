import React from "react";
import { useParams } from "react-router-dom";
import { ProductCreationForm } from "@/apps/web-seller/features/product/components/forms/ProductCreationForm";
import {
  ProductCategoryType,
  UpdateProductRequestDto,
} from "@/apps/web-seller/features/product/types/product.dto";
import type { ProductForm } from "@/apps/web-seller/features/product/types/product.ui";
import { useProductDetail } from "@/apps/web-seller/features/product/hooks/queries/useProductQuery";
import {
  useUpdateProduct,
  useDeleteProduct,
} from "@/apps/web-seller/features/product/hooks/mutations/useProductMutation";
import { Card, CardContent } from "@/apps/web-seller/common/components/cards/Card";
import { ContentLoading } from "@/apps/web-seller/common/components/loading/ContentLoading";

export const StoreDetailProductDetailPage: React.FC = () => {
  const { storeId, productId } = useParams<{ storeId: string; productId: string }>();

  const { data: product, isLoading } = useProductDetail(productId || "");
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  if (!storeId || !productId) {
    return (
      <div>
        <h2 className="text-xl font-semibold">스토어 또는 상품이 선택되지 않았습니다.</h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <ContentLoading
        variant="page"
        message="상품 정보를 불러오는 중…"
        className="border-0 shadow-none"
      />
    );
  }

  if (!product) {
    return (
      <div>
        <h2 className="text-xl font-semibold">상품을 찾을 수 없습니다.</h2>
      </div>
    );
  }

  // ProductResponseDto를 ProductForm으로 변환
  const productForm: ProductForm = {
    images: product.images || [],
    name: product.name,
    originalPrice: product.originalPrice,
    salePrice: product.salePrice,
    salesStatus: product.salesStatus,
    visibilityStatus: product.visibilityStatus,
    cakeSizeOptions: (product.cakeSizeOptions as any) || [],
    cakeFlavorOptions: (product.cakeFlavorOptions as any) || [],
    customOptions: product.customOptions ?? [],
    productType: product.productType,
    // '커스텀' 카테고리는 상품 유형을 따라 서버가 관리하므로 폼에서는 뺀다
    productCategoryTypes: (product.productCategoryTypes ?? []).filter(
      (category) => category !== ProductCategoryType.LETTERING,
    ),
    searchTags: product.searchTags ?? [],
    detailDescription: product.detailDescription ?? "",
    productNoticeFoodType: product.productNoticeFoodType,
    productNoticeProducer: product.productNoticeProducer,
    productNoticeOrigin: product.productNoticeOrigin,
    productNoticeAddress: product.productNoticeAddress,
    productNoticeManufactureDate: product.productNoticeManufactureDate,
    productNoticeExpirationDate: product.productNoticeExpirationDate,
    productNoticePackageCapacity: product.productNoticePackageCapacity,
    productNoticePackageQuantity: product.productNoticePackageQuantity,
    productNoticeIngredients: product.productNoticeIngredients,
    productNoticeCalories: product.productNoticeCalories,
    productNoticeSafetyNotice: product.productNoticeSafetyNotice,
    productNoticeGmoNotice: product.productNoticeGmoNotice,
    productNoticeImportNotice: product.productNoticeImportNotice,
    productNoticeCustomerService: product.productNoticeCustomerService,
  };

  const handleUpdate = async (data: ProductForm) => {
    const request: UpdateProductRequestDto = {
      name: data.name,
      images: data.images,
      originalPrice: data.originalPrice!,
      salePrice: data.salePrice!,
      salesStatus: data.salesStatus,
      visibilityStatus: data.visibilityStatus,
      cakeSizeOptions: data.cakeSizeOptions,
      cakeFlavorOptions: data.cakeFlavorOptions,
      customOptions: data.customOptions,
      productType: data.productType,
      productCategoryTypes: data.productCategoryTypes,
      searchTags: data.searchTags,
      detailDescription: data.detailDescription,
      productNoticeFoodType: data.productNoticeFoodType,
      productNoticeProducer: data.productNoticeProducer,
      productNoticeOrigin: data.productNoticeOrigin,
      productNoticeAddress: data.productNoticeAddress,
      productNoticeManufactureDate: data.productNoticeManufactureDate,
      productNoticeExpirationDate: data.productNoticeExpirationDate,
      productNoticePackageCapacity: data.productNoticePackageCapacity,
      productNoticePackageQuantity: data.productNoticePackageQuantity,
      productNoticeIngredients: data.productNoticeIngredients,
      productNoticeCalories: data.productNoticeCalories,
      productNoticeSafetyNotice: data.productNoticeSafetyNotice,
      productNoticeGmoNotice: data.productNoticeGmoNotice,
      productNoticeImportNotice: data.productNoticeImportNotice,
      productNoticeCustomerService: data.productNoticeCustomerService,
    };

    await updateProductMutation.mutateAsync({
      productId,
      request,
      storeId,
    });
  };

  const handleDelete = async () => {
    if (window.confirm("정말 이 상품을 삭제하시겠습니까?")) {
      await deleteProductMutation.mutateAsync({
        productId,
        storeId,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">상품 수정</h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <ProductCreationForm
            onSubmit={handleUpdate}
            initialValue={productForm}
            disabled={false}
            onDelete={handleDelete}
            isDeleting={deleteProductMutation.isPending || updateProductMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
};
