"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Plus, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/dataTable";

const relationTypes = [
  { value: "cross_sell", label: "Cross-sell (ขายเพิ่ม)" },
  { value: "upsell", label: "Upsell (อัปเกรด)" },
];

const columns = [
  { name: "สินค้าต้นทาง", uid: "mktRelatedProductSourceItem", sortable: true },
  { name: "สินค้าเป้าหมาย", uid: "mktRelatedProductTargetItem", sortable: true },
  { name: "ประเภท", uid: "mktRelatedProductType", sortable: true },
  { name: "เหตุผล", uid: "mktRelatedProductReason" },
  { name: "", uid: "actions" },
];

const initialForm = {
  sourceItem: "",
  targetItem: "",
  type: "cross_sell",
  reason: "",
};

export default function RelatedProductsView({
  relatedProducts,
  loading,
  stockItems,
  onAdd,
  onDelete,
}) {
  const modal = useDisclosure();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [sourceSearch, setSourceSearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");

  const openCreate = () => {
    setForm(initialForm);
    setSourceSearch("");
    setTargetSearch("");
    modal.onOpen();
  };

  const handleSave = async () => {
    if (!form.sourceItem.trim() || !form.targetItem.trim()) return;
    if (form.sourceItem === form.targetItem) return;
    try {
      setSaving(true);
      await onAdd({
        sourceItem: form.sourceItem,
        targetItem: form.targetItem,
        type: form.type,
        reason: form.reason || null,
      });
      modal.onClose();
    } catch {
      // toast handled in hook
    } finally {
      setSaving(false);
    }
  };

  const getTypeLabel = (type) =>
    relationTypes.find((t) => t.value === type)?.label || type;

  const getItemName = (itemNumber) => {
    const item = stockItems.find((i) => i.bcItemNo === itemNumber);
    return item ? `${itemNumber} — ${item.bcItemDescription || ""}` : itemNumber;
  };

  const renderCell = (item, key) => {
    switch (key) {
      case "mktRelatedProductSourceItem":
        return (
          <div>
            <p className="font-light">{getItemName(item.mktRelatedProductSourceItem)}</p>
          </div>
        );
      case "mktRelatedProductTargetItem":
        return (
          <div>
            <p className="font-light">{getItemName(item.mktRelatedProductTargetItem)}</p>
          </div>
        );
      case "mktRelatedProductType":
        return (
          <Chip
            size="sm"
            variant="flat"
            color={item.mktRelatedProductType === "upsell" ? "secondary" : "primary"}
          >
            {getTypeLabel(item.mktRelatedProductType)}
          </Chip>
        );
      case "mktRelatedProductReason":
        return (
          <p className="text-sm text-default-500 line-clamp-2">
            {item.mktRelatedProductReason || "-"}
          </p>
        );
      case "actions":
        return (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="danger"
            onPress={() => onDelete(item.mktRelatedProductId)}
          >
            <Trash2 size={16} />
          </Button>
        );
      default:
        return item[key] || "-";
    }
  };

  const filteredSourceItems = stockItems.filter(
    (i) =>
      !sourceSearch ||
      i.bcItemNo?.toLowerCase().includes(sourceSearch.toLowerCase()) ||
      i.bcItemDescription?.toLowerCase().includes(sourceSearch.toLowerCase())
  );

  const filteredTargetItems = stockItems.filter(
    (i) =>
      !targetSearch ||
      i.bcItemNo?.toLowerCase().includes(targetSearch.toLowerCase()) ||
      i.bcItemDescription?.toLowerCase().includes(targetSearch.toLowerCase())
  );

  const addButton = (
    <Button color="primary" size="md" radius="md" startContent={<Plus />} onPress={openCreate}>
      เพิ่มคู่สินค้า
    </Button>
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <p className="text-xs font-light">Cross-sell / Upsell — จับคู่สินค้าที่เกี่ยวข้อง</p>

      <DataTable
        columns={columns}
        data={relatedProducts}
        renderCell={renderCell}
        rowKey="mktRelatedProductId"
        isLoading={loading}
        initialVisibleColumns={columns.map((c) => c.uid)}
        searchPlaceholder="ค้นหาสินค้า..."
        searchKeys={[
          "mktRelatedProductSourceItem",
          "mktRelatedProductTargetItem",
          "mktRelatedProductReason",
        ]}
        topEndContent={addButton}
        defaultRowsPerPage={20}
        emptyContent="ยังไม่มีคู่สินค้าที่เกี่ยวข้อง"
        enableCardView
      />

      <Modal isOpen={modal.isOpen} onOpenChange={modal.onClose} size="xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>เพิ่มคู่สินค้าที่เกี่ยวข้อง</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <div>
                <Input
                  label="ค้นหาสินค้าต้นทาง"
                  labelPlacement="outside"
                  placeholder="พิมพ์รหัสหรือชื่อสินค้า..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={sourceSearch}
                  onValueChange={setSourceSearch}
                />
                {form.sourceItem && (
                  <Chip size="sm" variant="flat" color="primary" className="mt-2" onClose={() => setForm((f) => ({ ...f, sourceItem: "" }))}>
                    {getItemName(form.sourceItem)}
                  </Chip>
                )}
                {sourceSearch && !form.sourceItem && (
                  <div className="max-h-40 overflow-y-auto border rounded-md mt-1">
                    {filteredSourceItems.slice(0, 20).map((item) => (
                      <button
                        key={item.bcItemNo}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-default-100 text-sm"
                        onClick={() => {
                          setForm((f) => ({ ...f, sourceItem: item.bcItemNo }));
                          setSourceSearch("");
                        }}
                      >
                        <span className="font-medium">{item.bcItemNo}</span>
                        <span className="text-default-400 ml-2">{item.bcItemDescription}</span>
                      </button>
                    ))}
                    {filteredSourceItems.length === 0 && (
                      <p className="px-3 py-2 text-sm text-default-400">ไม่พบสินค้า</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Input
                  label="ค้นหาสินค้าเป้าหมาย (แนะนำให้ลูกค้า)"
                  labelPlacement="outside"
                  placeholder="พิมพ์รหัสหรือชื่อสินค้า..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={targetSearch}
                  onValueChange={setTargetSearch}
                />
                {form.targetItem && (
                  <Chip size="sm" variant="flat" color="secondary" className="mt-2" onClose={() => setForm((f) => ({ ...f, targetItem: "" }))}>
                    {getItemName(form.targetItem)}
                  </Chip>
                )}
                {targetSearch && !form.targetItem && (
                  <div className="max-h-40 overflow-y-auto border rounded-md mt-1">
                    {filteredTargetItems.slice(0, 20).map((item) => (
                      <button
                        key={item.bcItemNo}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-default-100 text-sm"
                        onClick={() => {
                          setForm((f) => ({ ...f, targetItem: item.bcItemNo }));
                          setTargetSearch("");
                        }}
                      >
                        <span className="font-medium">{item.bcItemNo}</span>
                        <span className="text-default-400 ml-2">{item.bcItemDescription}</span>
                      </button>
                    ))}
                    {filteredTargetItems.length === 0 && (
                      <p className="px-3 py-2 text-sm text-default-400">ไม่พบสินค้า</p>
                    )}
                  </div>
                )}
              </div>

              <Select
                label="ประเภทความสัมพันธ์"
                labelPlacement="outside"
                variant="bordered"
                size="md"
                radius="md"
                selectedKeys={[form.type]}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0];
                  if (val) setForm((f) => ({ ...f, type: String(val) }));
                }}
              >
                {relationTypes.map((t) => (
                  <SelectItem key={t.value}>{t.label}</SelectItem>
                ))}
              </Select>

              <Textarea
                label="เหตุผล / หมายเหตุ"
                labelPlacement="outside"
                placeholder="เช่น ลูกค้าที่ซื้อสินค้านี้มักซื้อคู่กัน..."
                variant="bordered"
                size="md"
                radius="md"
                minRows={2}
                value={form.reason}
                onValueChange={(v) => setForm((f) => ({ ...f, reason: v }))}
              />

              <div className="bg-default-50 rounded-lg p-3 text-xs text-default-500">
                <p className="font-medium mb-1">คำอธิบาย:</p>
                <p><strong>Cross-sell</strong> — แนะนำสินค้าเสริมที่ใช้คู่กัน เช่น ซื้อรั้ว → แนะนำเสาค้ำ</p>
                <p><strong>Upsell</strong> — แนะนำรุ่นที่ดีกว่า/แพงกว่า เช่น รั้วธรรมดา → รั้วพรีเมียม</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={modal.onClose}>
              ยกเลิก
            </Button>
            <Button
              color="primary"
              size="md"
              radius="md"
              onPress={handleSave}
              isLoading={saving}
              isDisabled={!form.sourceItem || !form.targetItem || form.sourceItem === form.targetItem}
            >
              บันทึก
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
