"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Chip,
  Divider,
} from "@heroui/react";
import { ScanLine, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

async function decodeEpc(hex) {
  const res = await fetch("/api/warehouse/rfid/decode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ epc: hex.trim() }),
  });
  return res.json();
}

export default function RfidScannerPage() {
  const [hex, setHex] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  const handleDecode = async () => {
    const cleanHex = hex.trim().replace(/\s/g, "");
    if (!cleanHex) return;

    setLoading(true);
    try {
      const data = await decodeEpc(cleanHex);
      setResults((prev) => [
        {
          id: Date.now(),
          hex: cleanHex,
          ...data,
        },
        ...prev,
      ]);
      setHex("");
      inputRef.current?.focus();
    } catch (err) {
      toast.error(`Decode error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleDecode();
  };

  const clearResults = () => setResults([]);

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ScanLine size={24} />
          RFID Scanner
        </h1>
        {results.length > 0 && (
          <Button
            size="sm"
            variant="flat"
            color="danger"
            startContent={<Trash2 size={14} />}
            onPress={clearResults}
          >
            ล้าง ({results.length})
          </Button>
        )}
      </div>

      <Card>
        <CardBody>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              label="EPC Hex"
              placeholder="วาง hex จากเครื่องอ่าน RFID เช่น 30303030303239392F313200"
              value={hex}
              onValueChange={setHex}
              onKeyDown={handleKeyDown}
              autoFocus
              classNames={{ input: "font-mono text-sm" }}
            />
            <Button
              color="primary"
              isLoading={loading}
              onPress={handleDecode}
              isDisabled={!hex.trim()}
              className="min-w-24"
            >
              Decode
            </Button>
          </div>
        </CardBody>
      </Card>

      {results.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center text-default-400">
            <ScanLine size={48} className="mx-auto mb-3 opacity-30" />
            <p>สแกน RFID แล้ววาง EPC hex ด้านบนเพื่อดูข้อมูลสินค้า</p>
          </CardBody>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {results.map((r) => (
          <Card key={r.id}>
            <CardBody className="gap-2">
              {r.item ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-lg">{r.item.number}</p>
                      <p className="text-default-500">{r.item.displayName}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {r.decoded?.pieceNumber && (
                        <Chip size="sm" color="primary" variant="flat">
                          ชิ้นที่ {r.decoded.pieceNumber}/{r.decoded.totalPieces}
                        </Chip>
                      )}
                      {r.decoded?.rfidCode && (
                        <Chip size="sm" variant="flat">
                          RFID #{r.decoded.rfidCode}
                        </Chip>
                      )}
                    </div>
                  </div>
                  <Divider />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-default-400">คงเหลือ</p>
                      <p className="font-semibold">
                        {Number(r.item.inventory || 0).toLocaleString("th-TH")}{" "}
                        {r.item.baseUnitOfMeasure}
                      </p>
                    </div>
                    <div>
                      <p className="text-default-400">ประเภท</p>
                      <p>{r.item.type || "-"}</p>
                    </div>
                    <div>
                      <p className="text-default-400">ราคาขาย</p>
                      <p>
                        {Number(r.item.unitPrice || 0).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-default-400">หมวดหมู่</p>
                      <p>{r.item.itemCategoryCode || "-"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-warning" />
                  <div>
                    <p className="text-warning font-medium">
                      {r.message || "ไม่พบสินค้า"}
                    </p>
                    {r.decoded?.itemCompact && (
                      <p className="text-xs text-default-400">
                        Item: {r.decoded.itemCompact}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <p className="text-xs text-default-300 font-mono mt-1">
                {r.hex}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
