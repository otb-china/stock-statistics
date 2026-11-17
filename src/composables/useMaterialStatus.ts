import { computed, type Ref } from "vue";
import type { Material, MaterialGroupKey, Product } from "@/types/stock";
import { recipeQuantities } from "@/utils/stockData";

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
    return Math.max(0, Math.floor(Number((material.num / quantity).toPrecision(15))));
  }

  function productCapacity(product: ProductWithRecipe) {
    const details = Array.from(recipeQuantities(product.recipe), ([materialId, quantity]) => ({
      name: materialsMap.value.get(materialId)?.name ?? "缺失备料",
      count: materialCapacity(materialId, quantity),
      shared: activeRelatedProducts(materialId).some((item) => item.id !== product.id),
    }));
    const maxCount = details.length ? Math.min(...details.map((item) => item.count)) : 0;
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

  function materialCraftableCount(materialId: string) {
    const material = materialsMap.value.get(materialId);
    const list = activeRelatedProducts(materialId);
    if (!material || !list.length) return 0;
    const counts = list.map((product) => {
      return materialCapacity(materialId, recipeQuantities(product.recipe).get(materialId) ?? 0);
    });
    return Math.min(...counts);
  }

  function materialStatus(item: Material) {
    if (Number(item.num) <= 0) return "danger";
    const list = activeRelatedProducts(item.id);
    if (!list.length) return "safe";
    const count = materialCraftableCount(item.id);
    if (count <= 0) return "danger";
    if (count < 2) return "warning";
    return "safe";
  }

  function materialGroupKey(item: Material): MaterialGroupKey {
    if (!activeRelatedProducts(item.id).length) return "unlinked";
    return materialStatus(item);
  }

  function materialRelatedSummary(materialId: string) {
    const activeList = activeRelatedProducts(materialId);
    if (!activeList.length) return "未关联货品";
    return `关联 ${activeList.map((product) => product.name).join("、")}`;
  }

  function materialStatusText(item: Material) {
    const status = materialGroupKey(item);
    if (status === "unlinked") return "未关联";
    if (status === "danger") return "缺货";
    return `可制 ${materialCraftableCount(item.id)}`;
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
    materialCraftableCount,
    materialStatus,
    materialGroupKey,
    materialRelatedSummary,
    materialStatusText,
    materialStatusClass,
    recipePreview,
  };
}
