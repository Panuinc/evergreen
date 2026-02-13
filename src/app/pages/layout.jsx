export default function PagesLayout({ children }) {
  return (
    <div className="flex flex-col items-center justify-start w-full h-full">
      <div className="flex flex-row items-center justify-center w-full h-fit p-2 gap-2 border-b-[0.5px] border-default">
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
      <div className="flex flex-row items-center justify-center w-full h-full border-t-[0.5px] border-default">
        <div className="flex flex-row items-center justify-center w-4/12 h-full border-r-[0.5px] border-default border-dashed">
          <div className="flex flex-col items-center justify-center w-4/12 h-full p-2 gap-2 border-r-[0.5px] border-default border-dashed">
            <div className="flex items-center justify-center w-full h-fit p-2 gap-2 border-2 border-default border-dashed">
              1
            </div>
            <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 border-2 border-default border-dashed overflow-auto">
              1
            </div>
            <div className="flex items-center justify-center w-full h-fit p-2 gap-2 border-2 border-default border-dashed">
              1
            </div>
          </div>
          <div className="flex flex-col items-center justify-start w-8/12 h-full p-2 gap-2 border-l-[0.5px] border-default border-dashed overflow-auto">
            <div className="flex items-center justify-center w-full h-fit p-2 gap-2 border-2 border-default border-dashed">
              1
            </div>
            <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 border-2 border-default border-dashed overflow-auto">
              1
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center w-8/12 h-full p-2 gap-2 border-l-[0.5px] border-default border-dashed">
          <div className="flex flex-row items-center justify-center w-full h-fit p-2 gap-2 border-2 border-default border-dashed">
            1
          </div>
          <div className="flex flex-col items-center justify-start w-full h-full p-2 gap-2 border-2 border-default border-dashed overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
