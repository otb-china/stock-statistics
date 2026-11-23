import { computed, type Ref } from "vue";
import type { Material, MaterialGroupKey, Product } from "@/types/stock";
import { craftableStatus, recipeQuantities, requiredMaterialQuantity } from "@/utils/stockData";

type ProductWithRecipe = Pick<Product, "id" | "recipe">;

export function useMaterialStatus(materials: Ref<Material[]>, products: Ref<Product[]>) {
  const materialsMap = computed(() => {
    return new Map(materials.value.map((item) => [item.id, item]));
  });

  const activeProducts = computed(() => {
    return products.value.filter((item) => item.status === "active");
  });

  function materialCapacity(materialId: string, quantity: number) {
    const material = materialsMap.value.get(materialId);
    if (!material || !Number.isFinite(material.num) || !Number.isFinite(quantity) || quantity <= 0) return 0;
    const maxCount = Number.MAX_SAFE_INTEGER;
    let count = Math.min(maxCount, Math.max(0, Math.floor(material.num / quantity)));
    // Check the rounded material requirement used when an order is submitted.
    while (count > 0 && requiredMaterialQuantity(quantity, count) > material.num) count--;
    while (count < maxCount && requiredMaterialQuantity(quantity, count + 1) <= material.num) count++;
    return count;
  }

  function productCapacity(product: ProductWithRecipe) {
    const quantities = recipeQuantities(product.recipe);
    const tracked = [...quantities].filter(([id]) => !materialsMap.value.get(id)?.untracked);
    const details = Array.from(tracked, ([materialId, quantity]) => ({
      name: materialsMap.value.get(materialId)?.name ?? "缺失备料",
      count: materialCapacity(materialId, quantity),
      shared: activeRelatedProducts(materialId).some((item) => item.id !== product.id),
    }));
    const maxCount = details.length ? Math.min(...details.map((item) => item.count)) : quantities.size ? Infinity : 0;
    return { details, maxCount };
  }

  function craftableCountForProduct(product: Product) {
    return productCapacity(product).maxCount;
  }

  function limitingMaterials(product: ProductWithRecipe) {
    const { details, maxCount } = productCapacity(product);
    return details.filter((item) => item.count === maxCount).map((item) => item.name).join("、");
  }

  function sharedMaterials(product: ProductWithRecipe) {
    return productCapacity(product).details.filter((item) => item.shared).map((item) => item.name).join("、");
  }

  function activeRelatedProducts(materialId: string) {
    return activeProducts.value.filter((product) => product.recipe.some((item) => item.materialId === materialId));
  }

  function materialStatus(item: Material) {
    if (item.untracked) return "safe";
    if (Number(item.num) <= 0) return "danger";
    let status: "warning" | "safe" = "safe";
    for (const product of activeRelatedProducts(item.id)) {
      const quantity = recipeQuantities(product.recipe).get(item.id) ?? 0;
      const relatedStatus = craftableStatus(materialCapacity(item.id, quantity), product.warningThreshold);
      if (relatedStatus === "danger") return "danger";
      if (relatedStatus === "warning") status = "warning";
    }
    return status;
  }

  function materialGroupKey(item: Material): MaterialGroupKey {
    if (item.untracked) return "untracked";
    if (!activeRelatedProducts(item.id).length) return "unlinked";
    return materialStatus(item);
  }

  function materialRelatedSummary(materialId: string) {
    const activeList = activeRelatedProducts(materialId);
    if (activeList.length > 1) return `关联 ${activeList.length} 个货品`;
    const [product] = activeList;
    return product ? `关联 ${product.name}` : "未关联货品";
  }

  function materialStatusClass(item: Material) {
    return `status-${materialGroupKey(item)}`;
  }

  function recipePreview(product: Product) {
    if (!product.recipe.length) return "未配置备料";
    return product.recipe
      .map((item) => `${materialsMap.value.get(item.materialId)?.name || "未知备料"} x${item.quantity}`)
      .join("、");
  }

  return {
    materialsMap,
    activeProducts,
    craftableCountForProduct,
    limitingMaterials,
    sharedMaterials,
    activeRelatedProducts,
    materialStatus,
    materialGroupKey,
    materialRelatedSummary,
    materialStatusClass,
    recipePreview,
  };
}
