import { LayoutDashboard } from "lucide-react";

export default function PagesLayout({ children }) {
  return (
    <div className="flex flex-col items-center justify-start w-full h-full overflow-hidden">
      <div className="flex flex-row items-center justify-center w-full h-fit p-2 gap-2 border-b-[0.5px] border-foreground">
        <div className="flex flex-row items-center justify-center w-full h-full p-2 gap-2 border-2 border-default border-dashed">
          1
        </div>
        <div className="flex flex-row items-center justify-center w-full h-full p-2 gap-2 border-2 border-default border-dashed">
          1
        </div>
        <div className="flex flex-row items-center justify-end w-full h-full p-2 gap-2 border-2 border-default border-dashed">
          <div className="flex items-center justify-center aspect-square h-full p-2 gap-2 border-2 border-default rounded-full">
            1
          </div>
          <div className="flex items-center justify-center aspect-square h-full p-2 gap-2 border-2 border-default rounded-full">
            2
          </div>
          <div className="flex items-center justify-center aspect-square h-full p-2 gap-2 border-2 border-default rounded-full">
            3
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center w-full h-full border-t-[0.5px] border-foreground">
        <div className="flex flex-row items-center justify-center w-3/12 h-full border-r-[0.5px] border-foreground">
          <div className="flex flex-col items-center justify-center w-5/12 h-full gap-2 border-r-[0.5px] border-foreground">
            <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-b-2 border-foreground">
              <LayoutDashboard /> Dashboard
            </div>
            <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 overflow-auto">
              <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-2 border-foreground rounded-xl">
                Main Menu 1
              </div>
              <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-2 border-foreground rounded-xl">
                Main Menu 2
              </div>
              <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-2 border-foreground rounded-xl">
                Main Menu 3
              </div>
              <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-2 border-foreground rounded-xl">
                Main Menu 4
              </div>
            </div>
            <div className="flex items-center justify-center w-full h-fit p-2 gap-2 border-t-2 border-foreground">
              3
            </div>
          </div>
          <div className="flex flex-col items-center justify-center w-7/12 h-full gap-2 border-l-[0.5px] border-foreground">
            <div className="flex items-center justify-center w-full h-fit p-2 gap-2 border-b-2 border-foreground">
              4
            </div>
            <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 overflow-auto">
              <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-2 border-foreground rounded-xl">
                Sub Menu 1
              </div>
              <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-2 border-foreground rounded-xl">
                Sub Menu 2
              </div>
              <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-2 border-foreground rounded-xl">
                Sub Menu 3
              </div>
              <div className="flex items-center justify-start w-full h-fit p-2 gap-2 border-2 border-foreground rounded-xl">
                Sub Menu 4
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-start w-9/12 h-full gap-2 border-l-[0.5px] border-foreground overflow-hidden">
          <div className="flex flex-row items-center justify-start w-full h-fit p-2 gap-2 border-b-2 border-foreground">
            1
          </div>
          <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 border-2 border-default border-dashed overflow-auto">
            <div className="flex items-center justify-center w-full min-h-96 p-2 gap-2 border-2">
              1
            </div>
            <div className="flex items-center justify-center w-full min-h-96 p-2 gap-2 border-2">
              2
            </div>
               <div className="flex items-center justify-center w-full min-h-96 p-2 gap-2 border-2">
              2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
