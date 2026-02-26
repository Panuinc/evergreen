"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getNetworkDevices,
  createNetworkDevice,
  updateNetworkDevice,
  deleteNetworkDevice,
} from "@/actions/it";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  itNetworkDeviceName: "",
  itNetworkDeviceType: "router",
  itNetworkDeviceIpAddress: "",
  itNetworkDeviceMacAddress: "",
  itNetworkDeviceLocation: "",
  itNetworkDeviceStatus: "online",
  itNetworkDeviceManufacturer: "",
  itNetworkDeviceModel: "",
  itNetworkDeviceNotes: "",
};

export function useItNetwork() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingDevice, setDeletingDevice] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getNetworkDevices();
      setDevices(data);
    } catch (error) {
      toast.error("โหลดอุปกรณ์เครือข่ายล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (device = null) => {
    if (device) {
      setEditingDevice(device);
      setFormData({
        itNetworkDeviceName: device.itNetworkDeviceName || "",
        itNetworkDeviceType: device.itNetworkDeviceType || "router",
        itNetworkDeviceIpAddress: device.itNetworkDeviceIpAddress || "",
        itNetworkDeviceMacAddress: device.itNetworkDeviceMacAddress || "",
        itNetworkDeviceLocation: device.itNetworkDeviceLocation || "",
        itNetworkDeviceStatus: device.itNetworkDeviceStatus || "online",
        itNetworkDeviceManufacturer: device.itNetworkDeviceManufacturer || "",
        itNetworkDeviceModel: device.itNetworkDeviceModel || "",
        itNetworkDeviceNotes: device.itNetworkDeviceNotes || "",
      });
    } else {
      setEditingDevice(null);
      setFormData(emptyForm);
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      itNetworkDeviceName: [(v) => !isRequired(v) && "กรุณาระบุชื่ออุปกรณ์"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      if (editingDevice) {
        await updateNetworkDevice(editingDevice.itNetworkDeviceId, formData);
        toast.success("อัปเดตอุปกรณ์สำเร็จ");
      } else {
        await createNetworkDevice(formData);
        toast.success("สร้างอุปกรณ์สำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกอุปกรณ์ล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (device) => {
    setDeletingDevice(device);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingDevice) return;
    try {
      await deleteNetworkDevice(deletingDevice.itNetworkDeviceId);
      toast.success("ลบอุปกรณ์สำเร็จ");
      deleteModal.onClose();
      setDeletingDevice(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบอุปกรณ์ล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    devices,
    loading,
    saving,
    editingDevice,
    formData,
    validationErrors,
    deletingDevice,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  };
}
