import { computed, ref, type Ref } from "vue";
import { showConfirmDialog, showToast } from "vant";
import type { useStockRecords } from "./useStockRecords";
import { createEmptyMaterialForm, createId } from "@/utils/stockData.ts";
import type { EditorType, Material, MaterialProductLink, Product } from "@/types/stock";

export function useMaterialEditor(materials: Ref<Material[]>, products: Ref<Product[]>, commit: ReturnType<typeof useStockRecords>["commit"]) {
  const materialEditor = ref({
    show: false,
    type: "add" as EditorType,
    form: createEmptyMaterialForm(),
    productLinks: [] as MaterialProductLink[],
  });
  const restock = ref({ show: false, materialId: "", quantity: 0 });
  const restockMaterial = computed(() => materials.value.find((item) => item.id === restock.value.materialId));
  const restockTotal = computed(() => {
    const material = restockMaterial.value;
    const quantity = restock.value.quantity;
    if (!material || !Number.isFinite(quantity) || quantity <= 0) return null;
    const total = Number((material.num + quantity).toPrecision(15));
    return Number.isFinite(total) && total > material.num ? total : null;
  });

  function openRestock(item: Material) {
    restock.value = { show: true, materialId: item.id, quantity: 0 };
  }

  function submitRestock() {
    const material = restockMaterial.value;
    const total = restockTotal.value;
    if (!restock.value.show || !material || total === null) return;

    const nextMaterials = materials.value.map((item) =>
      item.id === material.id ? { ...item, num: total } : item,
    );
    if (!commit({ materials: nextMaterials }, { reason: "restock" })) return;
    restock.value.show = false;
    showToast(`已补库存，${material.name}当前库存 ${total}`);
  }

  function openMaterialEditor(item?: Material) {
    materialEditor.value.type = item ? "edit" : "add";
    materialEditor.value.form = item
      ? { ...item }
      : createEmptyMaterialForm();
    materialEditor.value.productLinks = [];
    materialEditor.value.show = true;
  }

  function setMaterialLinkedProducts(productIds: string[]) {
    const previousLinks = new Map(materialEditor.value.productLinks.map((link) => [link.productId, link]));
    materialEditor.value.productLinks = [...new Set(productIds)].map((productId) =>
      previousLinks.get(productId) ?? { productId, quantity: 1 },
    );
  }

  function submitMaterialEditor() {
    if (!materialEditor.value.show) return;
    const name = materialEditor.value.form.name.trim();
    if (!name) {
      showToast("请输入备料名称");
      return;
    }

    const duplicated = materials.value.some((item) => item.name === name && item.id !== materialEditor.value.form.id);
    if (duplicated) {
      showToast("备料名称已存在");
      return;
    }

    const form = materialEditor.value.form;
    const num = Number(form.num ?? 0);
    if (!Number.isFinite(num) || num < 0) {
      showToast("请输入有效库存");
      return;
    }
    const isNew = materialEditor.value.type === "add";
    if (!isNew && !materials.value.some((item) => item.id === form.id)) return;
    const materialId = isNew ? createId("material") : form.id;
    const nextMaterials = isNew
      ? [...materials.value, { id: materialId, name, num }]
      : materials.value.map((item) => item.id === form.id ? { ...item, name, num } : item);

    const quantities = new Map<string, number>();
    for (const { productId, quantity } of isNew ? materialEditor.value.productLinks : []) {
      if (!products.value.some((product) => product.id === productId)) {
        showToast("所选货品已不存在，请重新选择");
        return;
      }
      if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity < 1 || quantity > 1000) {
        showToast("请输入 1 到 1000 之间的每件用量");
        return;
      }
      quantities.set(productId, quantity);
    }

    const nextProducts = quantities.size ? products.value.map((product) => {
      const quantity = quantities.get(product.id);
      if (quantity === undefined) return product;
      return { ...product, recipe: [...product.recipe, { materialId, quantity }] };
    }) : undefined;
    const changes = nextProducts ? { materials: nextMaterials, products: nextProducts } : { materials: nextMaterials };
    if (!commit(changes, { reason: isNew ? "initial" : "adjustment" })) return;
    materialEditor.value.show = false;
    if (quantities.size) showToast(`已添加备料并关联 ${quantities.size} 款货品`);
  }

  function removeMaterial(id: string) {
    showConfirmDialog({
      title: "提示",
      message: "删除备料后，相关货品配方也会移除该备料，确认继续吗？",
    }).then(() => {
      const nextMaterials = materials.value.filter((item) => item.id !== id);
      const nextProducts = products.value.map((product) => ({
        ...product,
        recipe: product.recipe.filter((item) => item.materialId !== id),
      }));
      if (!commit({ materials: nextMaterials, products: nextProducts }, { reason: "removal" })) return;
      showToast("备料已删除");
    }).catch(() => {
    });
  }

  return {
    materialEditor,
    restock,
    restockMaterial,
    restockTotal,
    openRestock,
    submitRestock,
    openMaterialEditor,
    setMaterialLinkedProducts,
    submitMaterialEditor,
    removeMaterial,
  };
}
