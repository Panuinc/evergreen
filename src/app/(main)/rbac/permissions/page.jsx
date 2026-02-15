"use client";

import { Checkbox, Spinner } from "@heroui/react";
import { usePermissions } from "@/hooks/use-permissions";

export default function PermissionsPage() {
  const {
    resources,
    actions,
    loading,
    toggling,
    permMap,
    togglePermission,
  } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
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
                        <Spinner />
                      ) : (
                        <Checkbox
                          size="md"
                          radius="md"
                          isSelected={exists}
                          onValueChange={() =>
                            togglePermission(
                              resource.resourceId,
                              action.actionId,
                            )
                          }
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
