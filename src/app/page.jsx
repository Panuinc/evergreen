// หน้านี้จะถูก redirect โดย middleware
// แสดงแค่ loading เท่านั้น
export default function Home() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
