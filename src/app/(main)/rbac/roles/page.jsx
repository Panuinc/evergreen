"use client";

import { useCallback } from "react";
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
  Checkbox,
  Spinner,
} from "@heroui/react";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { useRoles } from "@/hooks/rbac/useRoles";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อ", uid: "roleName", sortable: true },
  { name: "รายละเอียด", uid: "roleDescription" },
  { name: "ประเภท", uid: "roleType", sortable: true },
  { name: "ผู้ใช้", uid: "userCount", sortable: true },
  { name: "สิทธิ์", uid: "permCount", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "roleName",
  "roleDescription",
  "roleType",
  "userCount",
  "permCount",
  "actions",
];

export default function RolesPage() {
  const {
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
  } = useRoles();

  const renderCell = useCallback(
    (role, columnKey) => {
      switch (columnKey) {
        case "roleName":
          return <span className="font-medium">{role.roleName}</span>;
        case "roleDescription":
          return (
            <span className="text-default-500">
              {role.roleDescription || "-"}
            </span>
          );
        case "roleType":
          return role.roleIsSuperadmin ? (
            <Chip variant="bordered" size="md" radius="md">
              Superadmin
            </Chip>
          ) : (
            <Chip variant="bordered" size="md" radius="md">
              มาตรฐาน
            </Chip>
          );
        case "userCount":
          return role.userRoles?.[0]?.count ?? 0;
        case "permCount":
          return role.rolePermissions?.[0]?.count ?? 0;
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
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleDelete(role)}
                isDisabled={role.roleIsSuperadmin}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return role[columnKey] || "-";
      }
    },
    [handleOpen, handleDelete, openPermissions],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={roles}
        renderCell={renderCell}
        enableCardView
        rowKey="roleId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามชื่อ, รายละเอียด..."
        searchKeys={["roleName", "roleDescription"]}
        emptyContent="ไม่พบบทบาท"
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

      {/* Create/Edit Modal */}
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
                  value={formData.roleName}
                  onChange={(e) =>
                    setFormData({ ...formData, roleName: e.target.value })
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
                  value={formData.roleDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      roleDescription: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Switch
                  size="md"
                  isSelected={formData.roleIsSuperadmin}
                  onValueChange={(val) =>
                    setFormData({ ...formData, roleIsSuperadmin: val })
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

      {/* Permission Assignment Modal */}
      <Modal
        isOpen={permModalOpen}
        onClose={() => setPermModalOpen(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            สิทธิ์ของ &ldquo;{selectedRole?.roleName}&rdquo;
          </ModalHeader>
          <ModalBody>
            {permLoading ? (
              <div className="flex justify-center p-4">
                <Spinner />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="flex flex-col gap-2">
                    <h3 className="font-semibold capitalize">{resource}</h3>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((perm) => (
                        <Checkbox
                          key={perm.permissionId}
                          size="md"
                          radius="md"
                          isSelected={rolePermIds.includes(perm.permissionId)}
                          onValueChange={() =>
                            togglePermission(perm.permissionId)
                          }
                        >
                          {perm.actions?.actionName}
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
