import { ref, type Ref } from "vue";
import { showConfirmDialog, showToast } from "vant";
import type { useStockRecords } from "./useStockRecords";
import { createEmptyProductForm, createId, isValidAmount, moneyCents } from "@/utils/stockData.ts";
import type { EditorType, Material, Product } from "@/types/stock";

interface UseProductEditorOptions {
  openMaterialEditor?: () => void;
}

export function useProductEditor(
  materials: Ref<Material[]>,
  products: Ref<Product[]>,
  commit: ReturnType<typeof useStockRecords>["commit"],
  options: UseProductEditorOptions = {},
) {
  const productEditor = ref({
    show: false,
    type: "add" as EditorType,
    form: createEmptyProductForm(),
  });

  function openProductEditor(product?: Product) {
    if (!product && !materials.value.length) {
      showToast("请先新增备料");
      options.openMaterialEditor?.();
      return;
    }

    productEditor.value.type = product ? "edit" : "add";
    productEditor.value.form = product
      ? {
        ...product,
        recipe: product.recipe.map((item) => ({ ...item })),
      }
      : createEmptyProductForm();
    productEditor.value.show = true;
  }

  function setRecipeMaterials(materialIds: string[]) {
    const current = new Map(productEditor.value.form.recipe.map((item) => [item.materialId, item.quantity]));
    productEditor.value.form.recipe = materialIds.map((materialId) => ({
      materialId,
      quantity: current.get(materialId) ?? 1,
    }));
  }

  function toggleProductStatus(product: Product) {
    const nextStatus: Product["status"] = product.status === "active" ? "inactive" : "active";
    if (!products.value.some((item) => item.id === product.id)) return;
    const nextProducts = products.value.map((item) => item.id === product.id ? { ...item, status: nextStatus } : item);
    if (!commit({ products: nextProducts })) return;
    showToast(nextStatus === "active" ? "货品已设为正常" : "货品已设为停产");
  }

  function removeRecipeItem(index: number) {
    productEditor.value.form.recipe.splice(index, 1);
  }

  function submitProductEditor() {
    const name = productEditor.value.form.name.trim();
    if (!name) {
      showToast("请输入货品名称");
      return;
    }

    const validRecipe = productEditor.value.form.recipe
      .filter((item) => item.materialId && Number(item.quantity) > 0)
      .map((item) => ({
        materialId: item.materialId,
        quantity: Number(item.quantity),
      }));

    if (!validRecipe.length) {
      showToast("请至少配置一个备料");
      return;
    }

    const duplicatedMaterial = new Set(validRecipe.map((item) => item.materialId));
    if (duplicatedMaterial.size !== validRecipe.length) {
      showToast("同一个备料请只配置一次");
      return;
    }

    const duplicated = products.value.some((item) => item.name === name && item.id !== productEditor.value.form.id);
    if (duplicated) {
      showToast("货品名称已存在");
      return;
    }

    const { defaultValue, defaultCost } = productEditor.value.form;
    const isNew = productEditor.value.type === "add";
    if (!isValidAmount(defaultValue) || ((isNew || defaultCost !== undefined) && !isValidAmount(defaultCost))) {
      showToast("请输入有效的售价和成本");
      return;
    }

    const productPayload: Product = {
      id: productEditor.value.form.id || createId("product"),
      name,
      defaultValue: moneyCents(defaultValue) / 100,
      defaultCost: defaultCost === undefined ? undefined : moneyCents(defaultCost) / 100,
      status: productEditor.value.form.status,
      recipe: validRecipe,
    };

    if (!isNew && !products.value.some((item) => item.id === productPayload.id)) return;
    const nextProducts = isNew
      ? [...products.value, productPayload]
      : products.value.map((item) => item.id === productPayload.id ? productPayload : item);
    if (!commit({ products: nextProducts })) return;
    productEditor.value.show = false;
  }

  function removeProduct(id: string) {
    showConfirmDialog({
      title: "删除货品",
      message: "删除后无法恢复，确认删除这个货品吗？",
      confirmButtonText: "删除",
      className: "danger-dialog",
    }).then(() => {
      if (!commit({ products: products.value.filter((item) => item.id !== id) })) return;
      showToast("货品已删除");
    }).catch(() => {
    });
  }

  return {
    productEditor,
    openProductEditor,
    setRecipeMaterials,
    toggleProductStatus,
    removeRecipeItem,
    submitProductEditor,
    removeProduct,
  };
}
