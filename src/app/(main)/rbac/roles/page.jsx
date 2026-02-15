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
import { useRoles } from "@/hooks/useRoles";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Name", uid: "roleName", sortable: true },
  { name: "Description", uid: "roleDescription" },
  { name: "Type", uid: "roleType", sortable: true },
  { name: "Users", uid: "userCount", sortable: true },
  { name: "Permissions", uid: "permCount", sortable: true },
  { name: "Actions", uid: "actions" },
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

  const renderCell = useCallback((role, columnKey) => {
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
          <Chip variant="bordered" size="md" radius="md">Superadmin</Chip>
        ) : (
          <Chip variant="bordered" size="md" radius="md">Standard</Chip>
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
              title="Manage Permissions"
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
  }, [handleOpen, handleDelete, openPermissions]);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={roles}
        renderCell={renderCell}
        rowKey="roleId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by name, description..."
        searchKeys={["roleName", "roleDescription"]}
        emptyContent="No roles found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Role
          </Button>
        }
      />

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>{editingRole ? "Edit Role" : "Create Role"}</ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Name"
                  labelPlacement="outside"
                  placeholder="e.g. hr_manager"
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
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Describe this role..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.roleDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, roleDescription: e.target.value })
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
                  Superadmin (bypass all permission checks)
                </Switch>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={onClose}>
              Cancel
            </Button>
            <Button variant="solid" size="md" radius="md" onPress={handleSave}>
              {editingRole ? "Update" : "Create"}
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
            Permissions for &ldquo;{selectedRole?.roleName}&rdquo;
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
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
