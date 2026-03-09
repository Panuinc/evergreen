"use client";

import { Checkbox} from "@heroui/react";
import Loading from "@/components/ui/Loading";

export default function PermissionsView({
  resources,
  actions,
  loading,
  toggling,
  permMap,
  togglePermission,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between w-full">
        <p className="text-xs font-light">ตารางสิทธิ์</p>
        <p className="text-muted-foreground">
          สลับเพื่อสร้าง/ลบสิทธิ์ทรัพยากร-การดำเนินการ
        </p>
      </div>

      <div className="w-full overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b border-border font-light sticky left-0 bg-background">
                ทรัพยากร
              </th>
              {actions.map((action) => (
                <th
                  key={action.rbacActionId}
                  className="p-2 border-b border-border font-light text-center capitalize"
                >
                  {action.rbacActionName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource.rbacResourceId} className="hover:bg-default/50">
                <td className="p-2 border-b border-border font-light capitalize sticky left-0 bg-background">
                  {resource.rbacResourceName}
                  {resource.rbacResourceDescription && (
                    <span className="text-muted-foreground">
                      ({resource.rbacResourceDescription})
                    </span>
                  )}
                </td>
                {actions.map((action) => {
                  const key = `${resource.rbacResourceId}:${action.rbacActionId}`;
                  const exists = !!permMap[key];
                  const isToggling = toggling === key;

                  return (
                    <td
                      key={action.rbacActionId}
                      className="p-2 border-b border-border text-center"
                    >
                      {isToggling ? (
                        <Loading />
                      ) : (
                        <Checkbox
                          size="md"
                          radius="md"
                          isSelected={exists}
                          onValueChange={() =>
                            togglePermission(
                              resource.rbacResourceId,
                              action.rbacActionId,
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
