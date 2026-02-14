"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Chip,
  Checkbox,
  useDisclosure,
} from "@heroui/react";
import { Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  getUsersWithRoles,
  getRoles,
  assignRoleToUser,
  removeRoleFromUser,
} from "@/actions/rbac";
import { getUnlinkedEmployees } from "@/actions/hr";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Email", uid: "userProfileEmail", sortable: true },
  { name: "Roles", uid: "roles" },
  { name: "Created", uid: "userProfileCreatedAt", sortable: true },
  { name: "Actions", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "userProfileEmail",
  "roles",
  "userProfileCreatedAt",
  "actions",
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Role assignment
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoleIds, setUserRoleIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Create account
  const [createOpen, setCreateOpen] = useState(false);
  const defaultPassword = "P@ssw0rd";
  const [createForm, setCreateForm] = useState({
    email: "",
    password: defaultPassword,
    employeeId: "",
  });
  const [creating, setCreating] = useState(false);
  const [unlinkedEmployees, setUnlinkedEmployees] = useState([]);

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
    setUserRoleIds(user.roles?.map((r) => r.roleId) || []);
    onOpen();
  };

  const toggleRole = async (roleId) => {
    if (!selectedUser) return;
    setSaving(true);

    try {
      if (userRoleIds.includes(roleId)) {
        await removeRoleFromUser(selectedUser.userProfileId, roleId);
        setUserRoleIds((prev) => prev.filter((id) => id !== roleId));
        toast.success("Role removed");
      } else {
        await assignRoleToUser(selectedUser.userProfileId, roleId);
        setUserRoleIds((prev) => [...prev, roleId]);
        toast.success("Role assigned");
      }
    } catch (error) {
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseRoles = () => {
    onClose();
    loadData();
  };

  // Create account
  const openCreateAccount = async () => {
    setCreateForm({ email: "", password: defaultPassword, employeeId: "" });
    setCreateOpen(true);

    try {
      const data = await getUnlinkedEmployees();
      setUnlinkedEmployees(data || []);
    } catch {
      setUnlinkedEmployees([]);
    }
  };

  const handleCreateAccount = async () => {
    if (!createForm.email || !createForm.password) {
      toast.error("Email and password are required");
      return;
    }
    if (createForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setCreating(true);

    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
          employeeId: createForm.employeeId || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to create account");
        return;
      }

      if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success("Account created successfully");
      }

      setCreateOpen(false);
      loadData();
    } catch (error) {
      toast.error("Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  const renderCell = useCallback((user, columnKey) => {
    switch (columnKey) {
      case "userProfileEmail":
        return (
          <span className="font-medium">{user.userProfileEmail}</span>
        );
      case "roles":
        return (
          <div className="flex flex-wrap gap-1">
            {user.roles?.length > 0 ? (
              user.roles.map((role) => (
                <Chip
                  key={role.roleId}
                  size="sm"
                  variant="flat"
                  color={role.roleIsSuperadmin ? "danger" : "primary"}
                >
                  {role.roleName}
                </Chip>
              ))
            ) : (
              <span className="text-default-400">No roles</span>
            )}
          </div>
        );
      case "userProfileCreatedAt":
        return (
          <span className="text-default-500">
            {new Date(user.userProfileCreatedAt).toLocaleDateString()}
          </span>
        );
      case "actions":
        return (
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => openRoleAssignment(user)}
            title="Manage Roles"
          >
            <Settings />
          </Button>
        );
      default:
        return user[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={users}
        renderCell={renderCell}
        rowKey="userProfileId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by email..."
        searchKeys={["userProfileEmail"]}
        emptyContent="No users found"
        topEndContent={
          <Button
            color="primary"
            size="sm"
            startContent={<Plus />}
            onPress={openCreateAccount}
          >
            Create Account
          </Button>
        }
      />

      {/* Role Assignment Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseRoles}>
        <ModalContent>
          <ModalHeader>
            Roles for &ldquo;{selectedUser?.userProfileEmail}&rdquo;
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              {allRoles.map((role) => (
                <Checkbox
                  key={role.roleId}
                  isSelected={userRoleIds.includes(role.roleId)}
                  onValueChange={() => toggleRole(role.roleId)}
                  isDisabled={saving}
                  size="sm"
                >
                  <div className="flex items-center gap-2">
                    <span>{role.roleName}</span>
                    {role.roleIsSuperadmin && (
                      <Chip size="sm" color="danger" variant="flat">
                        Superadmin
                      </Chip>
                    )}
                  </div>
                  {role.roleDescription && (
                    <p className="text-default-400">{role.roleDescription}</p>
                  )}
                </Checkbox>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleCloseRoles}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Account Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)}>
        <ModalContent>
          <ModalHeader>Create Account</ModalHeader>
          <ModalBody>
            <Input
              label="Email"
              type="email"
              placeholder="employee@company.com"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
              variant="bordered"
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm({ ...createForm, password: e.target.value })
              }
              variant="bordered"
            />
            <Select
              label="Link to Employee (optional)"
              placeholder="Select an employee"
              selectedKeys={
                createForm.employeeId ? [createForm.employeeId] : []
              }
              onSelectionChange={(keys) => {
                const selectedId = Array.from(keys)[0] || "";
                const emp = unlinkedEmployees.find(
                  (e) => e.employeeId === selectedId
                );
                setCreateForm({
                  ...createForm,
                  employeeId: selectedId,
                  email: emp?.employeeEmail || createForm.email,
                });
              }}
              variant="bordered"
            >
              {unlinkedEmployees.map((emp) => (
                <SelectItem
                  key={emp.employeeId}
                  textValue={`${emp.employeeFirstName} ${emp.employeeLastName}${emp.employeeEmail ? ` (${emp.employeeEmail})` : ""}`}
                >
                  {emp.employeeFirstName} {emp.employeeLastName}
                  {emp.employeeEmail ? ` (${emp.employeeEmail})` : ""}
                </SelectItem>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCreateAccount}
              isLoading={creating}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
