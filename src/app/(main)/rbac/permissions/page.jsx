"use client";

import { useState, useEffect, useMemo } from "react";
import { Checkbox, Spinner } from "@heroui/react";
import { toast } from "sonner";
import {
  getResources,
  getActions,
  getPermissions,
  createPermission,
  deletePermission,
} from "@/actions/rbac";

export default function PermissionsPage() {
  const [resources, setResources] = useState([]);
  const [actions, setActions] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, act, perms] = await Promise.all([
        getResources(),
        getActions(),
        getPermissions(),
      ]);
      setResources(res);
      setActions(act);
      setPermissions(perms);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Build a lookup map: "permissionResourceId:permissionActionId" → permission
  const permMap = useMemo(() => {
    const map = {};
    permissions.forEach((p) => {
      map[`${p.permissionResourceId}:${p.permissionActionId}`] = p;
    });
    return map;
  }, [permissions]);

  const togglePermission = async (resourceId, actionId) => {
    const key = `${resourceId}:${actionId}`;
    setToggling(key);

    try {
      const existing = permMap[key];
      if (existing) {
        await deletePermission(existing.permissionId);
        setPermissions((prev) => prev.filter((p) => p.permissionId !== existing.permissionId));
        toast.success("Permission removed");
      } else {
        const newPerm = await createPermission({
          permissionResourceId: resourceId,
          permissionActionId: actionId,
        });
        setPermissions((prev) => [...prev, newPerm]);
        toast.success("Permission created");
      }
    } catch (error) {
      toast.error("Failed to update permission");
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-semibold">Permissions Matrix</h1>
        <p className="text-default-400">
          Toggle to create/remove resource-action permissions
        </p>
      </div>

      <div className="w-full overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b border-default font-semibold sticky left-0 bg-background">
                Resource
              </th>
              {actions.map((action) => (
                <th
                  key={action.actionId}
                  className="p-2 border-b border-default font-semibold text-center capitalize"
                >
                  {action.actionName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource.resourceId} className="hover:bg-default/50">
                <td className="p-2 border-b border-default font-medium capitalize sticky left-0 bg-background">
                  {resource.resourceName}
                  {resource.resourceDescription && (
                    <span className="text-default-400">
                      ({resource.resourceDescription})
                    </span>
                  )}
                </td>
                {actions.map((action) => {
                  const key = `${resource.resourceId}:${action.actionId}`;
                  const exists = !!permMap[key];
                  const isToggling = toggling === key;

                  return (
                    <td
                      key={action.actionId}
                      className="p-2 border-b border-default text-center"
                    >
                      {isToggling ? (
                        <Spinner size="sm" />
                      ) : (
                        <Checkbox
                          isSelected={exists}
                          onValueChange={() =>
                            togglePermission(resource.resourceId, action.actionId)
                          }
                          size="sm"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
