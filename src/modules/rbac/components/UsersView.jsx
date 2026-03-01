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
  Select,
  SelectItem,
  Chip,
  Checkbox,
} from "@heroui/react";
import { Plus, Settings, KeyRound } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";

const baseColumns = [
  { name: "อีเมล", uid: "rbacUserProfileEmail", sortable: true },
  { name: "บทบาท", uid: "roles" },
  { name: "สร้างเมื่อ", uid: "rbacUserProfileCreatedAt", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const BASE_VISIBLE_COLUMNS = [
  "rbacUserProfileEmail",
  "roles",
  "rbacUserProfileCreatedAt",
  "actions",
];

export default function UsersView({
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
  resetOpen,
  setResetOpen,
  resetTarget,
  resetPassword,
  setResetPassword,
  resetting,
  openResetPassword,
  handleResetPassword,
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
    (user, columnKey) => {
      switch (columnKey) {
        case "rbacUserProfileEmail":
          return <span className="font-medium">{user.rbacUserProfileEmail}</span>;
        case "roles":
          return (
            <div className="flex flex-wrap gap-1">
              {user.roles?.length > 0 ? (
                user.roles.map((role) => (
                  <Chip
                    key={role.rbacRoleId}
                    variant="bordered"
                    size="md"
                    radius="md"
                    color={role.rbacRoleIsSuperadmin ? "danger" : "primary"}
                  >
                    {role.rbacRoleName}
                  </Chip>
                ))
              ) : (
                <span className="text-default-400">ไม่มีบทบาท</span>
              )}
            </div>
          );
        case "rbacUserProfileCreatedAt":
          return (
            <span className="text-default-500">
              {new Date(user.rbacUserProfileCreatedAt).toLocaleDateString()}
            </span>
          );
        case "isActive":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={user.isActive ? "success" : "danger"}
            >
              {user.isActive ? "Active" : "Inactive"}
            </Chip>
          );
        case "actions":
          return (
            <div className="flex gap-1">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => openRoleAssignment(user)}
                title="จัดการบทบาท"
              >
                <Settings />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => openResetPassword(user)}
                title="รีเซ็ตรหัสผ่าน"
              >
                <KeyRound />
              </Button>
            </div>
          );
        default:
          return user[columnKey] || "-";
      }
    },
    [openRoleAssignment, openResetPassword],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={users}
        renderCell={renderCell}
        enableCardView
        rowKey="rbacUserProfileId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามอีเมล..."
        searchKeys={["rbacUserProfileEmail"]}
        emptyContent="ไม่พบผู้ใช้"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={openCreateAccount}
          >
            สร้างบัญชี
          </Button>
        }
      />

      {/* Role Assignment Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseRoles}>
        <ModalContent>
          <ModalHeader>
            บทบาทของ &ldquo;{selectedUser?.rbacUserProfileEmail}&rdquo;
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              {allRoles.map((role) => (
                <Checkbox
                  key={role.rbacRoleId}
                  size="md"
                  radius="md"
                  isSelected={userRoleIds.includes(role.rbacRoleId)}
                  onValueChange={() => toggleRole(role.rbacRoleId)}
                  isDisabled={saving}
                >
                  <div className="flex items-center gap-2">
                    <span>{role.rbacRoleName}</span>
                    {role.rbacRoleIsSuperadmin && (
                      <Chip variant="bordered" size="md" radius="md">
                        Superadmin
                      </Chip>
                    )}
                  </div>
                  {role.rbacRoleDescription && (
                    <p className="text-default-400">{role.rbacRoleDescription}</p>
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
              เสร็จ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Account Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)}>
        <ModalContent>
          <ModalHeader>สร้างบัญชี</ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="อีเมล"
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
                  label="รหัสผ่าน"
                  labelPlacement="outside"
                  type="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
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
                  label="เชื่อมกับพนักงาน (ไม่บังคับ)"
                  labelPlacement="outside"
                  placeholder="เลือกพนักงาน"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={
                    createForm.employeeId ? [createForm.employeeId] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedId = Array.from(keys)[0] || "";
                    const emp = unlinkedEmployees.find(
                      (e) => e.hrEmployeeId === selectedId,
                    );
                    setCreateForm({
                      ...createForm,
                      employeeId: selectedId,
                      email: emp?.hrEmployeeEmail || createForm.email,
                    });
                  }}
                >
                  {unlinkedEmployees.map((emp) => (
                    <SelectItem
                      key={emp.hrEmployeeId}
                      textValue={`${emp.hrEmployeeFirstName} ${emp.hrEmployeeLastName}${emp.hrEmployeeEmail ? ` (${emp.hrEmployeeEmail})` : ""}`}
                    >
                      {emp.hrEmployeeFirstName} {emp.hrEmployeeLastName}
                      {emp.hrEmployeeEmail ? ` (${emp.hrEmployeeEmail})` : ""}
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
              ยกเลิก
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleCreateAccount}
              isLoading={creating}
            >
              สร้าง
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={resetOpen} onClose={() => setResetOpen(false)}>
        <ModalContent>
          <ModalHeader>
            รีเซ็ตรหัสผ่าน &ldquo;{resetTarget?.rbacUserProfileEmail}&rdquo;
          </ModalHeader>
          <ModalBody>
            <Input
              label="รหัสผ่านใหม่"
              labelPlacement="outside"
              type="password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              variant="bordered"
              size="md"
              radius="md"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={() => setResetOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              color="danger"
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleResetPassword}
              isLoading={resetting}
            >
              รีเซ็ต
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
