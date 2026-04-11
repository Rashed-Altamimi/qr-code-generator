import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import QRDownloadButton from "./QRDownloadButton";
import FileUploadQR from "./FileUploadQR";

type Mode = "text" | "file";

export default function QRGenerator() {
  const [mode, setMode] = useState<Mode>("text");
  const [inputValue, setInputValue] = useState("");
  const [titleValue, setTitleValue] = useState("");
  const qrRef = useRef<HTMLDivElement | null>(null);

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setInputValue("");
  };

  return (
    <div className="card bg-base-100 shadow-xl w-full max-w-xl">
      <div className="card-body items-center text-center gap-5">
        <div>
          <h1 className="card-title text-2xl font-bold justify-center">
            منشئ رمز QR
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            حوّل أي نص أو رابط أو ملف إلى رمز QR فوراً
          </p>
        </div>

        <div role="tablist" className="tabs tabs-box w-full">
          <button
            type="button"
            role="tab"
            className={`tab flex-1 ${mode === "text" ? "tab-active" : ""}`}
            onClick={() => switchMode("text")}
          >
            نص أو رابط
          </button>
          <button
            type="button"
            role="tab"
            className={`tab flex-1 ${mode === "file" ? "tab-active" : ""}`}
            onClick={() => switchMode("file")}
          >
            ملف من جوجل درايف
          </button>
        </div>

        <input
          type="text"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          placeholder="عنوان الصورة (اختياري)"
          className="input input-bordered w-full text-center"
        />

        {mode === "text" ? (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="أدخل نصاً أو رابطاً..."
            className="input input-bordered w-full text-center"
            autoFocus
          />
        ) : (
          <FileUploadQR
            onUploaded={setInputValue}
            currentLink={inputValue}
            title={titleValue}
          />
        )}

        <div className="flex flex-col items-center justify-center gap-5 min-h-75 w-full">
          {inputValue && (
            <>
              <div
                className="bg-white p-5 rounded-xl shadow-md inline-block"
                ref={qrRef}
              >
                {titleValue && (
                  <p className="text-zinc-900 font-semibold mb-3 text-center">
                    {titleValue}
                  </p>
                )}
                <QRCodeSVG
                  value={inputValue}
                  size={256}
                  level="H"
                  marginSize={4}
                />
              </div>
              <QRDownloadButton
                qrRef={qrRef}
                inputValue={inputValue}
                titleValue={titleValue}
              />
            </>
          )}
          {!inputValue && (
            <p className="text-base-content/50 text-sm">
              {mode === "text"
                ? "أدخل نصاً أو رابطاً أعلاه لإنشاء رمز QR"
                : "سجّل الدخول وارفع ملفاً لإنشاء رمز QR"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
