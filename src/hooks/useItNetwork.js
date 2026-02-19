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
  deviceName: "",
  deviceType: "router",
  deviceIpAddress: "",
  deviceMacAddress: "",
  deviceLocation: "",
  deviceStatus: "online",
  deviceManufacturer: "",
  deviceModel: "",
  deviceNotes: "",
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
      toast.error("Failed to load network devices");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (device = null) => {
    if (device) {
      setEditingDevice(device);
      setFormData({
        deviceName: device.deviceName || "",
        deviceType: device.deviceType || "router",
        deviceIpAddress: device.deviceIpAddress || "",
        deviceMacAddress: device.deviceMacAddress || "",
        deviceLocation: device.deviceLocation || "",
        deviceStatus: device.deviceStatus || "online",
        deviceManufacturer: device.deviceManufacturer || "",
        deviceModel: device.deviceModel || "",
        deviceNotes: device.deviceNotes || "",
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
      deviceName: [(v) => !isRequired(v) && "Device name is required"],
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
        await updateNetworkDevice(editingDevice.deviceId, formData);
        toast.success("Device updated");
      } else {
        await createNetworkDevice(formData);
        toast.success("Device created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save device");
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
      await deleteNetworkDevice(deletingDevice.deviceId);
      toast.success("Device deleted");
      deleteModal.onClose();
      setDeletingDevice(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete device");
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
