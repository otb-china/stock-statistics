import { computed, ref, type ComputedRef, type Ref } from "vue";
import dayjs from "dayjs";
import { showToast } from "vant";
import type { useStockRecords } from "./useStockRecords";
import { createEmptyOrderForm, createId, isValidAmount, moneyCents, recipeQuantities, summarizeOrders } from "@/utils/stockData.ts";
import type { Material, Order, OrderEditorType, Product, ProductRecipe } from "@/types/stock";

interface UseOrderActionsOptions {
  materials: Ref<Material[]>;
  products: Ref<Product[]>;
  orders: Ref<Order[]>;
  commit: ReturnType<typeof useStockRecords>["commit"];
  activeProducts: ComputedRef<Product[]>;
  ordersExpanded: Ref<boolean>;
  orderPreviewLimit: number;
  dateFormat: string;
  openMaterialEditor: () => void;
  openProductEditor: () => void;
}

export function useOrderActions(options: UseOrderActionsOptions) {
  const calculation = ref(false);
  const orderSearch = ref("");
  const unitPrice = ref(0);
  const unitCost = ref<number>();
  const deletingOrderId = ref("");
  const orderInfo = ref({
    type: "add" as OrderEditorType,
    show: false,
    form: createEmptyOrderForm(),
    get data() { return options.orders.value; },
    monthData: [] as (ReturnType<typeof summarizeOrders> & { month: string })[],
    editingId: "",
    checkedMonth: "",
  });

  const OrderData = computed(() => {
    const checkedMonth = orderInfo.value.checkedMonth;
    const search = orderSearch.value.trim().toLowerCase();
    return orderInfo.value.data.filter((item) =>
      (!checkedMonth || item.orderDate?.substring(0, 7) === checkedMonth)
      && (!search || item.title.toLowerCase().includes(search)),
    );
  });

  const visibleOrders = computed(() => {
    if (options.ordersExpanded.value || OrderData.value.length <= options.orderPreviewLimit) return OrderData.value;
    return OrderData.value.slice(0, options.orderPreviewLimit);
  });

  const collapsedOrdersCount = computed(() => Math.max(0, OrderData.value.length - options.orderPreviewLimit));

  const orderTotals = computed(() => summarizeOrders(orderInfo.value.data));

  const selectedOrderProduct = computed(() => productByName(orderInfo.value.form.title));

  const activeOrderProducts = computed(() => options.activeProducts.value);

  const orderDeduction = computed(() => getOrderDeduction(selectedOrderProduct.value, orderInfo.value.form.quantity));
  const canSyncCalculation = computed(() =>
    orderDeduction.value.items.length > 0 && orderDeduction.value.shortages.length === 0,
  );
  const deductionMessage = computed(() => {
    if (!Number.isSafeInteger(orderInfo.value.form.quantity) || orderInfo.value.form.quantity < 1) return "请输入有效件数。";
    if (!orderDeduction.value.items.length) return "该货品缺少有效配方，可以仅记录订单。";
    if (orderDeduction.value.shortages.length) return orderDeduction.value.shortages.join("、");
    const preview = orderDeduction.value.items.map(({ materialId, quantity }) => {
      const name = options.materials.value.find((item) => item.id === materialId)?.name;
      return `${name} × ${quantity}`;
    }).join("、");
    return calculation.value ? `预计扣料 ${preview}` : "仅记录订单，不扣减库存。";
  });

  const deletingOrder = computed(() => orderInfo.value.data.find((item) => item.id === deletingOrderId.value));
  const deleteOrderShow = computed({
    get: () => Boolean(deletingOrder.value),
    set: (show: boolean) => {
      if (!show) deletingOrderId.value = "";
    },
  });
  const returnableMaterials = computed(() => {
    const items = deletingOrder.value?.deductedMaterials;
    if (!items?.length) return [];
    const allAvailable = items.every((item) => options.materials.value.some((material) =>
      material.id === item.materialId && Number.isFinite(material.num + item.quantity),
    ));
    return allAvailable ? items : [];
  });
  const deleteOrderDescription = computed(() => {
    const order = deletingOrder.value;
    if (!order) return "";
    if (order.deductedMaterials === undefined) return "历史订单缺少扣料明细。如需补回备料，请核实后手动调整库存。";
    if (!order.deductedMaterials.length) return "该订单没有扣减备料。";
    if (!returnableMaterials.value.length) return "扣料明细中的备料已无法完整返还，请核实后手动调整库存。";
    return `可返还 ${returnableMaterials.value.map((item) => {
      const material = options.materials.value.find((entry) => entry.id === item.materialId);
      return `${material?.name} × ${item.quantity}`;
    }).join("、")}`;
  });
  const deleteOrderActions = computed(() => {
    const actions = [{ name: "仅删除订单", color: "#c63535", callback: () => deleteOrder(false) }];
    if (returnableMaterials.value.length) {
      actions.unshift({ name: "删除并返料", color: "#c63535", callback: () => deleteOrder(true) });
    }
    return actions;
  });

  function getOrderDeduction(product: Product | undefined, count: number) {
    if (!Number.isSafeInteger(count) || count < 1) return { items: [], shortages: [] };
    const quantities = recipeQuantities(product?.recipe ?? []);
    const items: ProductRecipe[] = [];
    const shortages: string[] = [];
    for (const [materialId, perItem] of quantities) {
      const quantity = Number((perItem * count).toPrecision(15));
      const material = options.materials.value.find((entry) => entry.id === materialId);
      items.push({ materialId, quantity });
      if (!material || !Number.isFinite(material.num) || !Number.isFinite(quantity)) {
        shortages.push(`${material?.name ?? "配方备料"}不可用`);
      } else if (material.num < quantity) {
        shortages.push(`${material.name}缺 ${Number((quantity - material.num).toPrecision(12))}`);
      }
    }
    return { items, shortages };
  }

  function productByName(name: string) {
    return options.products.value.find((item) => item.name === name);
  }

  function initOrderMonthData() {
    const months = new Map<string, Order[]>();

    for (const item of orderInfo.value.data) {
      if (item.orderDate) {
        const month = item.orderDate.substring(0, 7);
        const monthOrders = months.get(month);
        if (monthOrders) monthOrders.push(item);
        else months.set(month, [item]);
      }
    }

    orderInfo.value.monthData = [...months]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, orders]) => ({
        month,
        ...summarizeOrders(orders),
      }));
    if (orderInfo.value.checkedMonth && !orderInfo.value.monthData.some((item) => item.month === orderInfo.value.checkedMonth)) {
      monthChange("");
    }
  }

  function monthChange(month: string) {
    orderInfo.value.checkedMonth = orderInfo.value.checkedMonth === month ? "" : month;
    options.ordersExpanded.value = false;
  }

  function setOrderDate(date: string) {
    orderInfo.value.form.orderDate = date;
  }

  function onProductChange(productName: string) {
    const product = productByName(productName);
    if (product && product.name !== orderInfo.value.form.title) {
      orderInfo.value.form.title = product.name;
      unitPrice.value = product.defaultValue || 0;
      unitCost.value = product.defaultCost;
      updateOrderAmounts(orderInfo.value.form.quantity);
      calculation.value = canSyncCalculation.value;
    }
    if (!orderInfo.value.form.orderDate) {
      orderInfo.value.form.orderDate = dayjs(new Date()).format(options.dateFormat);
    }
  }

  function updateOrderAmounts(quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;
    orderInfo.value.form.value = moneyCents(unitPrice.value * quantity) / 100;
    orderInfo.value.form.cost = unitCost.value === undefined ? undefined : moneyCents(unitCost.value * quantity) / 100;
  }

  function setOrderQuantity(quantity: number) {
    const couldDeduct = canSyncCalculation.value;
    orderInfo.value.form.quantity = quantity;
    updateOrderAmounts(quantity);
    if (orderInfo.value.type === "add" && (!couldDeduct || !canSyncCalculation.value)) {
      calculation.value = canSyncCalculation.value;
    }
  }

  function setOrderValue(value: string) {
    // Vant emits an empty string while the input is being edited.
    orderInfo.value.form.value = value === "" ? Number.NaN : Number(value);
    const quantity = orderInfo.value.form.quantity;
    if (value !== "" && Number.isSafeInteger(quantity) && quantity > 0) unitPrice.value = Number(value) / quantity;
  }

  function setOrderCost(value: string) {
    const cost = value === "" ? undefined : Number(value);
    orderInfo.value.form.cost = cost;
    const quantity = orderInfo.value.form.quantity;
    if (cost === undefined) unitCost.value = undefined;
    else if (Number.isSafeInteger(quantity) && quantity > 0) unitCost.value = cost / quantity;
  }

  function openCreateOrder(product?: Product) {
    if (!options.materials.value.length) {
      showToast("请先新增备料");
      options.openMaterialEditor();
      return;
    }

    const availableProducts = options.activeProducts.value;
    if (!availableProducts.length) {
      showToast("请先新增货品");
      options.openProductEditor();
      return;
    }
    const selectedProduct = product ? availableProducts.find((item) => item.id === product.id) : availableProducts[0];
    if (!selectedProduct) {
      showToast("该货品当前无法记单");
      return;
    }
    orderInfo.value.type = "add";
    unitPrice.value = selectedProduct.defaultValue || 0;
    unitCost.value = selectedProduct.defaultCost;
    orderInfo.value.form = {
      id: "",
      title: selectedProduct.name,
      value: unitPrice.value,
      cost: unitCost.value,
      quantity: 1,
      orderDate: dayjs(new Date()).format(options.dateFormat),
    };
    calculation.value = canSyncCalculation.value;
    orderInfo.value.show = true;
  }

  function orderSubmit() {
    if (!orderInfo.value.show) return;
    const { type, form, editingId, data } = orderInfo.value;
    const { value, cost } = form;
    if (!Number.isSafeInteger(form.quantity) || form.quantity < 1) {
      showToast("请输入大于 0 的整数件数");
      return;
    }
    if (!form.title || !isValidAmount(value) || !form.orderDate) {
      showToast("请填写有效的金额和日期");
      return;
    }
    if (cost !== undefined && !isValidAmount(cost)) {
      showToast("请输入有效的订单成本");
      return;
    }
    const amounts = { value: moneyCents(value) / 100, cost: cost === undefined ? undefined : moneyCents(cost) / 100 };

    const nextOrders = [...data];
    let changes: ProductRecipe[] = [];
    let savedOrder: Order;
    if (type === "add") {
      if (calculation.value && !canSyncCalculation.value) {
        calculation.value = false;
        showToast("库存无法扣减，请确认后仅记录订单");
        return;
      }
      const deduction = calculation.value ? orderDeduction.value.items : [];
      changes = deduction.map((item) => ({ ...item, quantity: -item.quantity }));
      savedOrder = { ...form, ...amounts, id: createId("order"), deductedMaterials: deduction };
      nextOrders.unshift(savedOrder);
    } else {
      const index = data.findIndex((item) => item.id === editingId);
      if (index < 0) return;
      const previous = data[index];
      let deduction = previous.deductedMaterials;
      if (deduction?.length && form.quantity !== previous.quantity) {
        const previousDeduction = deduction;
        const nextDeduction = previousDeduction.map((item) => ({
          ...item,
          quantity: Number((item.quantity / previous.quantity * form.quantity).toPrecision(15)),
        }));
        changes = previousDeduction.map((item, index) => ({
          materialId: item.materialId,
          quantity: Number((item.quantity - nextDeduction[index].quantity).toPrecision(15)),
        }));
        deduction = nextDeduction;
      }
      savedOrder = { ...form, ...amounts, id: previous.id, deductedMaterials: deduction };
      nextOrders[index] = savedOrder;
    }

    nextOrders.sort((a, b) => b.orderDate.localeCompare(a.orderDate));
    if (!persistOrderChange(nextOrders, changes, savedOrder)) return;
    orderInfo.value.show = false;
    orderInfo.value.form = createEmptyOrderForm();
    const savedMonth = form.orderDate.substring(0, 7);
    if (orderInfo.value.checkedMonth && orderInfo.value.checkedMonth !== savedMonth) monthChange(savedMonth);
    initOrderMonthData();
    showToast(type === "add" ? "订单已记录" : "订单已保存");
  }

  function beforeUpd(item: Order) {
    orderInfo.value.type = "upd";
    orderInfo.value.editingId = item.id;
    orderInfo.value.form = { ...item };
    unitPrice.value = item.value / item.quantity;
    unitCost.value = item.cost === undefined ? undefined : item.cost / item.quantity;
    calculation.value = false;
    orderInfo.value.show = true;
  }

  function deleteOrder(returnMaterials: boolean) {
    const order = deletingOrder.value;
    if (!order) return;
    const items = returnMaterials ? returnableMaterials.value : [];
    if (returnMaterials && !items.length) {
      showToast("无法返还该订单的备料");
      return;
    }
    const nextOrders = orderInfo.value.data.filter((item) => item.id !== order.id);
    if (!persistOrderChange(nextOrders, items, order)) return;
    deletingOrderId.value = "";
    initOrderMonthData();
    showToast(returnMaterials ? "订单已删除，备料已返还" : "订单已删除");
  }

  function del(order: Order) {
    deletingOrderId.value = order.id;
  }

  function persistOrderChange(orders: Order[], changes: ProductRecipe[], order: Order) {
    const stock = new Map(options.materials.value.map((item) => [item.id, item]));
    const balances = new Map<string, number>();
    for (const { materialId, quantity } of changes) {
      const material = stock.get(materialId);
      const balance = Number(((material?.num ?? 0) + quantity).toPrecision(15));
      if (!material || !Number.isFinite(balance) || balance < 0) {
        showToast(material ? `${material.name}库存不足，无法保存订单` : "原扣料明细中的备料已不存在，无法调整库存");
        return false;
      }
      balances.set(materialId, balance);
    }
    if (!balances.size) return options.commit({ orders });
    const materials = options.materials.value.map((item) => {
      const balance = balances.get(item.id);
      return balance === undefined ? item : { ...item, num: balance };
    });
    return options.commit({ orders, materials }, { reason: changes[0].quantity < 0 ? "deduction" : "return", order });
  }

  return {
    calculation,
    orderInfo,
    OrderData,
    orderSearch,
    visibleOrders,
    collapsedOrdersCount,
    orderTotals,
    activeOrderProducts,
    canSyncCalculation,
    deductionMessage,
    deletingOrder,
    deleteOrderShow,
    deleteOrderDescription,
    deleteOrderActions,
    initOrderMonthData,
    monthChange,
    setOrderDate,
    setOrderQuantity,
    setOrderValue,
    setOrderCost,
    onProductChange,
    openCreateOrder,
    orderSubmit,
    beforeUpd,
    del,
  };
}
