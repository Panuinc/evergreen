"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
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
  useDisclosure,
  Checkbox,
  Spinner,
} from "@heroui/react";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  getRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole,
} from "@/actions/rbac";

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    roleName: "",
    roleDescription: "",
    roleIsSuperadmin: false,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Permission assignment state
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [rolePermIds, setRolePermIds] = useState([]);
  const [permLoading, setPermLoading] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await getRoles();
      setRoles(data);
    } catch (error) {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        roleName: role.roleName,
        roleDescription: role.roleDescription || "",
        roleIsSuperadmin: role.roleIsSuperadmin || false,
      });
    } else {
      setEditingRole(null);
      setFormData({ roleName: "", roleDescription: "", roleIsSuperadmin: false });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    try {
      if (editingRole) {
        await updateRole(editingRole.roleId, formData);
        toast.success("Role updated");
      } else {
        await createRole(formData);
        toast.success("Role created");
      }
      onClose();
      loadRoles();
    } catch (error) {
      toast.error(error.message || "Failed to save role");
    }
  };

  const handleDelete = async (role) => {
    if (role.roleIsSuperadmin) {
      toast.error("Cannot delete superadmin role");
      return;
    }

    try {
      await deleteRole(role.roleId);
      toast.success("Role deleted");
      loadRoles();
    } catch (error) {
      toast.error(error.message || "Failed to delete role");
    }
  };

  const openPermissions = async (role) => {
    setSelectedRole(role);
    setPermLoading(true);
    setPermModalOpen(true);

    try {
      const [perms, rolePerm] = await Promise.all([
        getPermissions(),
        getRolePermissions(role.roleId),
      ]);
      setAllPermissions(perms);
      setRolePermIds(rolePerm.map((rp) => rp.rolePermissionPermissionId));
    } catch (error) {
      toast.error("Failed to load permissions");
    } finally {
      setPermLoading(false);
    }
  };

  const togglePermission = async (permissionId) => {
    if (!selectedRole) return;

    try {
      if (rolePermIds.includes(permissionId)) {
        await removePermissionFromRole(selectedRole.roleId, permissionId);
        setRolePermIds((prev) => prev.filter((id) => id !== permissionId));
        toast.success("Permission removed");
      } else {
        await assignPermissionToRole(selectedRole.roleId, permissionId);
        setRolePermIds((prev) => [...prev, permissionId]);
        toast.success("Permission assigned");
      }
    } catch (error) {
      toast.error("Failed to update permission");
    }
  };

  // Group permissions by resource for display
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const resourceName = perm.resources?.resourceName || "Unknown";
    if (!acc[resourceName]) acc[resourceName] = [];
    acc[resourceName].push(perm);
    return acc;
  }, {});

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-semibold">Roles</h1>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<Plus />}
          onPress={() => handleOpen()}
        >
          Add Role
        </Button>
      </div>

      <Table aria-label="Roles table">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Description</TableColumn>
          <TableColumn>Type</TableColumn>
          <TableColumn>Users</TableColumn>
          <TableColumn>Permissions</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={loading}
          loadingContent={<Spinner size="sm" />}
          emptyContent="No roles found"
        >
          {roles.map((role) => (
            <TableRow key={role.roleId}>
              <TableCell className="font-medium">{role.roleName}</TableCell>
              <TableCell className="text-default-500">
                {role.roleDescription || "-"}
              </TableCell>
              <TableCell>
                {role.roleIsSuperadmin ? (
                  <Chip color="danger" variant="flat" size="sm">
                    Superadmin
                  </Chip>
                ) : (
                  <Chip color="default" variant="flat" size="sm">
                    Standard
                  </Chip>
                )}
              </TableCell>
              <TableCell>{role.userRoles?.[0]?.count ?? 0}</TableCell>
              <TableCell>{role.rolePermissions?.[0]?.count ?? 0}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => openPermissions(role)}
                    title="Manage Permissions"
                  >
                    <Shield />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => handleOpen(role)}
                  >
                    <Edit />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    color="danger"
                    onPress={() => handleDelete(role)}
                    isDisabled={role.roleIsSuperadmin}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingRole ? "Edit Role" : "Create Role"}
          </ModalHeader>
          <ModalBody>
            <Input
              label="Name"
              placeholder="e.g. hr_manager"
              value={formData.roleName}
              onChange={(e) =>
                setFormData({ ...formData, roleName: e.target.value })
              }
              variant="bordered"
            />
            <Textarea
              label="Description"
              placeholder="Describe this role..."
              value={formData.roleDescription}
              onChange={(e) =>
                setFormData({ ...formData, roleDescription: e.target.value })
              }
              variant="bordered"
            />
            <Switch
              isSelected={formData.roleIsSuperadmin}
              onValueChange={(val) =>
                setFormData({ ...formData, roleIsSuperadmin: val })
              }
            >
              Superadmin (bypass all permission checks)
            </Switch>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSave}>
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
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {Object.entries(groupedPermissions).map(
                  ([resource, perms]) => (
                    <div key={resource} className="flex flex-col gap-2">
                      <h3 className="font-semibold capitalize">{resource}</h3>
                      <div className="flex flex-wrap gap-2">
                        {perms.map((perm) => (
                          <Checkbox
                            key={perm.permissionId}
                            isSelected={rolePermIds.includes(perm.permissionId)}
                            onValueChange={() => togglePermission(perm.permissionId)}
                            size="sm"
                          >
                            {perm.actions?.actionName}
                          </Checkbox>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setPermModalOpen(false)}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
