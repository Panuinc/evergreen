"use client";

import { useCallback, useMemo } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Switch,
  Chip,
  Checkbox,} from "@heroui/react";
import { Plus, Edit, Trash2, Shield, Power } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";
import Loading from "@/components/ui/Loading";

const baseColumns = [
  { name: "ชื่อ", uid: "rbacRoleName", sortable: true },
  { name: "รายละเอียด", uid: "rbacRoleDescription" },
  { name: "ประเภท", uid: "roleType", sortable: true },
  { name: "ผู้ใช้", uid: "userCount", sortable: true },
  { name: "สิทธิ์", uid: "permCount", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const BASE_VISIBLE_COLUMNS = [
  "rbacRoleName",
  "rbacRoleDescription",
  "roleType",
  "userCount",
  "permCount",
  "actions",
];

export default function RolesView({
  roles,
  loading,
  editingRole,
  formData,
  setFormData,
  isOpen,
  onClose,
  handleOpen,
  handleSave,
  handleDelete,
  permModalOpen,
  setPermModalOpen,
  selectedRole,
  permLoading,
  rolePermIds,
  groupedPermissions,
  openPermissions,
  togglePermission,
  toggleActive,
}) {
  const { isSuperAdmin } = useRBAC();

  const initialVisibleColumns = useMemo(() => {
    if (isSuperAdmin) {
      return [...BASE_VISIBLE_COLUMNS, "isActive"];
    }
    return BASE_VISIBLE_COLUMNS;
  }, [isSuperAdmin]);

  const columns = useMemo(() => {
    if (isSuperAdmin) {
      const actionsCol = baseColumns[baseColumns.length - 1];
      return [
        ...baseColumns.slice(0, -1),
        { name: "สถานะใช้งาน", uid: "isActive" },
        actionsCol,
      ];
    }
    return baseColumns;
  }, [isSuperAdmin]);

  const renderCell = useCallback(
    (role, columnKey) => {
      switch (columnKey) {
        case "rbacRoleName":
          return <span className="font-light">{role.rbacRoleName}</span>;
        case "rbacRoleDescription":
          return (
            <span className="text-muted-foreground">
              {role.rbacRoleDescription || "-"}
            </span>
          );
        case "roleType":
          return role.rbacRoleIsSuperadmin ? (
            <Chip variant="flat" size="md" radius="md">
              Superadmin
            </Chip>
          ) : (
            <Chip variant="flat" size="md" radius="md">
              มาตรฐาน
            </Chip>
          );
        case "userCount":
          return role.rbacUserRole?.[0]?.count ?? 0;
        case "permCount":
          return role.rbacRolePermission?.[0]?.count ?? 0;
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={role.isActive ? "success" : "danger"}
            >
              {role.isActive ? "Active" : "Inactive"}
            </Chip>
          );
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                isIconOnly
                variant="bordered"
                size="md"
                radius="md"
                onPress={() => openPermissions(role)}
                title="จัดการสิทธิ์"
              >
                <Shield />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(role)}
              >
                <Edit />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="md"
                  isSelected={role.isActive}
                  onValueChange={() => toggleActive(role)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => handleDelete(role)}
                  isDisabled={role.rbacRoleIsSuperadmin}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return role[columnKey] || "-";
      }
    },
    [handleOpen, handleDelete, openPermissions, toggleActive, isSuperAdmin],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={roles}
        renderCell={renderCell}
        enableCardView
        rowKey="rbacRoleId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามชื่อ, รายละเอียด..."
        searchKeys={["rbacRoleName", "rbacRoleDescription"]}
        emptyContent="ไม่พบบทบาท"
        actionMenuItems={(item) =>
          [
            { key: "permissions", label: "จัดการสิทธิ์", icon: <Shield />, onPress: () => openPermissions(item) },
            { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => handleOpen(item) },
            isSuperAdmin
              ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power />, onPress: () => toggleActive(item) }
              : !item.rbacRoleIsSuperadmin
                ? { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => handleDelete(item) }
                : null,
          ].filter(Boolean)
        }
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มบทบาท
          </Button>
        }
      />

      {}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>{editingRole ? "แก้ไขบทบาท" : "สร้างบทบาท"}</ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="ชื่อ"
                  labelPlacement="outside"
                  placeholder="เช่น hr_manager"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.rbacRoleName}
                  onChange={(e) =>
                    setFormData({ ...formData, rbacRoleName: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายบทบาทนี้..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.rbacRoleDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rbacRoleDescription: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Switch
                  size="md"
                  isSelected={formData.rbacRoleIsSuperadmin}
                  onValueChange={(val) =>
                    setFormData({ ...formData, rbacRoleIsSuperadmin: val })
                  }
                >
                  Superadmin (ข้ามการตรวจสอบสิทธิ์ทั้งหมด)
                </Switch>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={onClose}>
              ยกเลิก
            </Button>
            <Button variant="bordered" size="md" radius="md" onPress={handleSave}>
              {editingRole ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {}
      <Modal
        isOpen={permModalOpen}
        onClose={() => setPermModalOpen(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            สิทธิ์ของ &ldquo;{selectedRole?.rbacRoleName}&rdquo;
          </ModalHeader>
          <ModalBody>
            {permLoading ? (
              <div className="flex justify-center p-4">
                <Loading />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="flex flex-col gap-2">
                    <p className="font-light capitalize">{resource}</p>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((perm) => (
                        <Checkbox
                          key={perm.rbacPermissionId}
                          size="md"
                          radius="md"
                          isSelected={rolePermIds.includes(perm.rbacPermissionId)}
                          onValueChange={() =>
                            togglePermission(perm.rbacPermissionId)
                          }
                        >
                          {perm.rbacAction?.rbacActionName}
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={() => setPermModalOpen(false)}
            >
              เสร็จ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
