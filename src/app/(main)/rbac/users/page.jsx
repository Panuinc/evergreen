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
  Chip,
  Checkbox,
  useDisclosure,
  Spinner,
} from "@heroui/react";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import {
  getUsersWithRoles,
  getRoles,
  assignRoleToUser,
  removeRoleFromUser,
} from "@/actions/rbac";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoleIds, setUserRoleIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        getUsersWithRoles(),
        getRoles(),
      ]);
      setUsers(usersData);
      setAllRoles(rolesData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openRoleAssignment = (user) => {
    setSelectedUser(user);
    setUserRoleIds(user.roles?.map((r) => r.id) || []);
    onOpen();
  };

  const toggleRole = async (roleId) => {
    if (!selectedUser) return;
    setSaving(true);

    try {
      if (userRoleIds.includes(roleId)) {
        await removeRoleFromUser(selectedUser.id, roleId);
        setUserRoleIds((prev) => prev.filter((id) => id !== roleId));
        toast.success("Role removed");
      } else {
        await assignRoleToUser(selectedUser.id, roleId);
        setUserRoleIds((prev) => [...prev, roleId]);
        toast.success("Role assigned");
      }
    } catch (error) {
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
    loadData();
  };

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-semibold">Users</h1>
      </div>

      <Table aria-label="Users table">
        <TableHeader>
          <TableColumn>Email</TableColumn>
          <TableColumn>Roles</TableColumn>
          <TableColumn>Created</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={loading}
          loadingContent={<Spinner size="sm" />}
          emptyContent="No users found"
        >
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles?.length > 0 ? (
                    user.roles.map((role) => (
                      <Chip
                        key={role.id}
                        size="sm"
                        variant="flat"
                        color={role.is_superadmin ? "danger" : "primary"}
                      >
                        {role.name}
                      </Chip>
                    ))
                  ) : (
                    <span className="text-default-400">No roles</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-default-500">
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => openRoleAssignment(user)}
                  title="Manage Roles"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Role Assignment Modal */}
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalContent>
          <ModalHeader>
            Roles for &ldquo;{selectedUser?.email}&rdquo;
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              {allRoles.map((role) => (
                <Checkbox
                  key={role.id}
                  isSelected={userRoleIds.includes(role.id)}
                  onValueChange={() => toggleRole(role.id)}
                  isDisabled={saving}
                  size="sm"
                >
                  <div className="flex items-center gap-2">
                    <span>{role.name}</span>
                    {role.is_superadmin && (
                      <Chip size="sm" color="danger" variant="flat">
                        Superadmin
                      </Chip>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-default-400 text-xs">
                      {role.description}
                    </p>
                  )}
                </Checkbox>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleClose}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
