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
    name: "",
    description: "",
    is_superadmin: false,
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
        name: role.name,
        description: role.description || "",
        is_superadmin: role.is_superadmin || false,
      });
    } else {
      setEditingRole(null);
      setFormData({ name: "", description: "", is_superadmin: false });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
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
    if (role.is_superadmin) {
      toast.error("Cannot delete superadmin role");
      return;
    }

    try {
      await deleteRole(role.id);
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
        getRolePermissions(role.id),
      ]);
      setAllPermissions(perms);
      setRolePermIds(rolePerm.map((rp) => rp.permission_id));
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
        await removePermissionFromRole(selectedRole.id, permissionId);
        setRolePermIds((prev) => prev.filter((id) => id !== permissionId));
        toast.success("Permission removed");
      } else {
        await assignPermissionToRole(selectedRole.id, permissionId);
        setRolePermIds((prev) => [...prev, permissionId]);
        toast.success("Permission assigned");
      }
    } catch (error) {
      toast.error("Failed to update permission");
    }
  };

  // Group permissions by resource for display
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const resourceName = perm.resources?.name || "Unknown";
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
          startContent={<Plus className="w-4 h-4" />}
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
            <TableRow key={role.id}>
              <TableCell className="font-medium">{role.name}</TableCell>
              <TableCell className="text-default-500">
                {role.description || "-"}
              </TableCell>
              <TableCell>
                {role.is_superadmin ? (
                  <Chip color="danger" variant="flat" size="sm">
                    Superadmin
                  </Chip>
                ) : (
                  <Chip color="default" variant="flat" size="sm">
                    Standard
                  </Chip>
                )}
              </TableCell>
              <TableCell>{role.user_roles?.[0]?.count ?? 0}</TableCell>
              <TableCell>{role.role_permissions?.[0]?.count ?? 0}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => openPermissions(role)}
                    title="Manage Permissions"
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => handleOpen(role)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    color="danger"
                    onPress={() => handleDelete(role)}
                    isDisabled={role.is_superadmin}
                  >
                    <Trash2 className="w-4 h-4" />
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
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              variant="bordered"
            />
            <Textarea
              label="Description"
              placeholder="Describe this role..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              variant="bordered"
            />
            <Switch
              isSelected={formData.is_superadmin}
              onValueChange={(val) =>
                setFormData({ ...formData, is_superadmin: val })
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
            Permissions for &ldquo;{selectedRole?.name}&rdquo;
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
                            key={perm.id}
                            isSelected={rolePermIds.includes(perm.id)}
                            onValueChange={() => togglePermission(perm.id)}
                            size="sm"
                          >
                            {perm.actions?.name}
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
