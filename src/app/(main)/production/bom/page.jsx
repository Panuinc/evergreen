"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
} from "@heroui/react";
import { Plus, Trash2, Pencil } from "lucide-react";

const unitOptions = ["ชิ้น", "แผ่น", "เมตร", "อัน", "ตัว", "คู่", "ม้วน", "กก."];

const emptyLine = {
  partName: "",
  material: "",
  length: "",
  width: "",
  thickness: "",
  quantity: "",
  unit: "ชิ้น",
  remark: "",
};

export default function BomPage() {
  // Door dimensions
  const [doorThickness, setDoorThickness] = useState("");
  const [doorWidth, setDoorWidth] = useState("");
  const [doorHeight, setDoorHeight] = useState("");

  // BOM lines
  const [bomLines, setBomLines] = useState([]);

  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({ ...emptyLine });

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAdd = useCallback(() => {
    setEditingIndex(null);
    setFormData({ ...emptyLine });
    onOpen();
  }, [onOpen]);

  const handleEdit = useCallback(
    (index) => {
      setEditingIndex(index);
      setFormData({ ...bomLines[index] });
      onOpen();
    },
    [bomLines, onOpen],
  );

  const handleSave = useCallback(() => {
    if (!formData.partName) return;
    setBomLines((prev) => {
      if (editingIndex !== null) {
        const updated = [...prev];
        updated[editingIndex] = { ...formData };
        return updated;
      }
      return [...prev, { ...formData }];
    });
    onClose();
  }, [formData, editingIndex, onClose]);

  const handleDelete = useCallback((index) => {
    setBomLines((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Door Dimensions Card */}
      <Card shadow="sm">
        <CardHeader className="px-4 pb-0">
          <h3 className="text-lg font-semibold">ขนาดประตู</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="ความหนา (mm)"
              labelPlacement="outside"
              placeholder="เช่น 40"
              variant="bordered"
              size="md"
              radius="md"
              type="number"
              min={0}
              value={doorThickness}
              onChange={(e) => setDoorThickness(e.target.value)}
              endContent={<span className="text-default-400 text-sm">mm</span>}
              isRequired
            />
            <Input
              label="ความกว้าง (mm)"
              labelPlacement="outside"
              placeholder="เช่น 900"
              variant="bordered"
              size="md"
              radius="md"
              type="number"
              min={0}
              value={doorWidth}
              onChange={(e) => setDoorWidth(e.target.value)}
              endContent={<span className="text-default-400 text-sm">mm</span>}
              isRequired
            />
            <Input
              label="ความสูง (mm)"
              labelPlacement="outside"
              placeholder="เช่น 2100"
              variant="bordered"
              size="md"
              radius="md"
              type="number"
              min={0}
              value={doorHeight}
              onChange={(e) => setDoorHeight(e.target.value)}
              endContent={<span className="text-default-400 text-sm">mm</span>}
              isRequired
            />
          </div>
        </CardBody>
      </Card>

      {/* BOM Table Card */}
      <Card shadow="sm" className="flex-1">
        <CardHeader className="px-4 pb-0 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            รายการ BOM{" "}
            <span className="text-default-400 text-sm font-normal">
              ({bomLines.length} รายการ)
            </span>
          </h3>
          <Button
            color="primary"
            size="sm"
            startContent={<Plus size={16} />}
            onPress={handleAdd}
          >
            เพิ่มรายการ
          </Button>
        </CardHeader>
        <CardBody className="overflow-auto">
          <Table aria-label="BOM Table" removeWrapper>
            <TableHeader>
              <TableColumn width={60}>#</TableColumn>
              <TableColumn minWidth={150}>ชื่อชิ้นส่วน</TableColumn>
              <TableColumn minWidth={120}>วัสดุ</TableColumn>
              <TableColumn width={100}>ความยาว (mm)</TableColumn>
              <TableColumn width={100}>ความกว้าง (mm)</TableColumn>
              <TableColumn width={100}>ความหนา (mm)</TableColumn>
              <TableColumn width={80}>จำนวน</TableColumn>
              <TableColumn width={80}>หน่วย</TableColumn>
              <TableColumn minWidth={120}>หมายเหตุ</TableColumn>
              <TableColumn width={100}>จัดการ</TableColumn>
            </TableHeader>
            <TableBody emptyContent="ยังไม่มีรายการ กดปุ่ม 'เพิ่มรายการ' เพื่อเริ่มถอด BOM">
              {bomLines.map((line, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{line.partName}</TableCell>
                  <TableCell>{line.material || "-"}</TableCell>
                  <TableCell>
                    {line.length ? Number(line.length).toLocaleString("th-TH") : "-"}
                  </TableCell>
                  <TableCell>
                    {line.width ? Number(line.width).toLocaleString("th-TH") : "-"}
                  </TableCell>
                  <TableCell>
                    {line.thickness ? Number(line.thickness).toLocaleString("th-TH") : "-"}
                  </TableCell>
                  <TableCell>
                    {line.quantity ? Number(line.quantity).toLocaleString("th-TH") : "-"}
                  </TableCell>
                  <TableCell>{line.unit}</TableCell>
                  <TableCell>{line.remark || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={() => handleEdit(index)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDelete(index)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {editingIndex !== null ? "แก้ไขรายการ BOM" : "เพิ่มรายการ BOM"}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="ชื่อชิ้นส่วน"
                labelPlacement="outside"
                placeholder="เช่น ไม้กรอบบน"
                variant="bordered"
                size="md"
                radius="md"
                value={formData.partName}
                onChange={(e) => updateField("partName", e.target.value)}
                isRequired
              />
              <Input
                label="วัสดุ"
                labelPlacement="outside"
                placeholder="เช่น WPC, ไม้สัก"
                variant="bordered"
                size="md"
                radius="md"
                value={formData.material}
                onChange={(e) => updateField("material", e.target.value)}
              />
              <Input
                label="ความยาว (mm)"
                labelPlacement="outside"
                placeholder="มิลลิเมตร"
                variant="bordered"
                size="md"
                radius="md"
                type="number"
                min={0}
                value={formData.length}
                onChange={(e) => updateField("length", e.target.value)}
              />
              <Input
                label="ความกว้าง (mm)"
                labelPlacement="outside"
                placeholder="มิลลิเมตร"
                variant="bordered"
                size="md"
                radius="md"
                type="number"
                min={0}
                value={formData.width}
                onChange={(e) => updateField("width", e.target.value)}
              />
              <Input
                label="ความหนา (mm)"
                labelPlacement="outside"
                placeholder="มิลลิเมตร"
                variant="bordered"
                size="md"
                radius="md"
                type="number"
                min={0}
                value={formData.thickness}
                onChange={(e) => updateField("thickness", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="จำนวน"
                  labelPlacement="outside"
                  placeholder="0"
                  variant="bordered"
                  size="md"
                  radius="md"
                  type="number"
                  min={0}
                  value={formData.quantity}
                  onChange={(e) => updateField("quantity", e.target.value)}
                />
                <Select
                  label="หน่วย"
                  labelPlacement="outside"
                  placeholder="เลือกหน่วย"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={new Set([formData.unit])}
                  onSelectionChange={(keys) => updateField("unit", [...keys][0])}
                >
                  {unitOptions.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
            <Input
              label="หมายเหตุ"
              labelPlacement="outside"
              placeholder="หมายเหตุเพิ่มเติม"
              variant="bordered"
              size="md"
              radius="md"
              className="mt-4"
              value={formData.remark}
              onChange={(e) => updateField("remark", e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              ยกเลิก
            </Button>
            <Button color="primary" onPress={handleSave} isDisabled={!formData.partName}>
              {editingIndex !== null ? "บันทึก" : "เพิ่ม"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
