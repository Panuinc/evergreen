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
  Select,
  SelectItem,
  Chip,
  Checkbox,
} from "@heroui/react";
import { Plus, Settings } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
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
  const {
    users,
    allRoles,
    loading,
    selectedUser,
    userRoleIds,
    saving,
    isOpen,
    toggleRole,
    openRoleAssignment,
    handleCloseRoles,
    createOpen,
    setCreateOpen,
    createForm,
    setCreateForm,
    creating,
    unlinkedEmployees,
    openCreateAccount,
    handleCreateAccount,
  } = useUsers();

  const renderCell = useCallback((user, columnKey) => {
    switch (columnKey) {
      case "userProfileEmail":
        return <span className="font-medium">{user.userProfileEmail}</span>;
      case "roles":
        return (
          <div className="flex flex-wrap gap-1">
            {user.roles?.length > 0 ? (
              user.roles.map((role) => (
                <Chip
                  key={role.roleId}
                  variant="bordered"
                  size="md"
                  radius="md"
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
            variant="bordered"
            size="md"
            radius="md"
            isIconOnly
            onPress={() => openRoleAssignment(user)}
            title="Manage Roles"
          >
            <Settings />
          </Button>
        );
      default:
        return user[columnKey] || "-";
    }
  }, [openRoleAssignment]);

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
            variant="bordered"
            size="md"
            radius="md"
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
                  size="md"
                  radius="md"
                  isSelected={userRoleIds.includes(role.roleId)}
                  onValueChange={() => toggleRole(role.roleId)}
                  isDisabled={saving}
                >
                  <div className="flex items-center gap-2">
                    <span>{role.roleName}</span>
                    {role.roleIsSuperadmin && <Chip variant="bordered" size="md" radius="md">Superadmin</Chip>}
                  </div>
                  {role.roleDescription && (
                    <p className="text-default-400">{role.roleDescription}</p>
                  )}
                </Checkbox>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleCloseRoles}
            >
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
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Email"
                  labelPlacement="outside"
                  type="email"
                  placeholder="employee@company.com"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Password"
                  labelPlacement="outside"
                  type="password"
                  placeholder="At least 6 characters"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Select
                  label="Link to Employee (optional)"
                  labelPlacement="outside"
                  placeholder="Select an employee"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={
                    createForm.employeeId ? [createForm.employeeId] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedId = Array.from(keys)[0] || "";
                    const emp = unlinkedEmployees.find(
                      (e) => e.employeeId === selectedId,
                    );
                    setCreateForm({
                      ...createForm,
                      employeeId: selectedId,
                      email: emp?.employeeEmail || createForm.email,
                    });
                  }}
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
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              size="md"
              radius="md"
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
