"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type ReactSignatureCanvas from "react-signature-canvas";

export interface SignatureFieldHandle {
  isEmpty: () => boolean;
  toDataURL: () => string;
  clear: () => void;
}

interface Props {
  hasError?: boolean;
}

const SignatureField = forwardRef<SignatureFieldHandle, Props>(
  function SignatureField({ hasError }, ref) {
    const instanceRef = useRef<ReactSignatureCanvas | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [SigCanvas, setSigCanvas] = useState<any>(null);

    // Lazy-load canvas module — avoids SSR crash
    useEffect(() => {
      import("react-signature-canvas").then((mod) => {
        setSigCanvas(() => mod.default);
      });
    }, []);

    useImperativeHandle(ref, () => ({
      isEmpty: () => {
        if (!instanceRef.current) return true;
        return instanceRef.current.isEmpty();
      },
      toDataURL: () => {
        if (!instanceRef.current) return "";
        return instanceRef.current.toDataURL("image/png");
      },
      clear: () => {
        instanceRef.current?.clear();
      },
    }));

    if (!SigCanvas) {
      return (
        <div
          className="border border-black bg-white"
          style={{ width: 340, height: 60 }}
        />
      );
    }

    return (
      <div>
        <div
          className={`border ${hasError ? "border-red-600" : "border-black"} bg-white`}
          style={{ lineHeight: 0 }}
        >
          <SigCanvas
            ref={instanceRef}
            penColor="black"
            canvasProps={{
              width: 340,
              height: 60,
              style: { display: "block", touchAction: "none" },
            }}
          />
        </div>
        <div className="mt-1 flex flex-wrap items-start gap-3">
          <button
            type="button"
            onClick={() => instanceRef.current?.clear()}
            className="text-xs text-gray-500 underline cursor-pointer shrink-0"
          >
            Clear signature
          </button>
          <p className="text-gray-500 italic" style={{ fontSize: "10px", lineHeight: "1.3" }}>
            This digital signature is legally binding and equivalent to a
            handwritten signature under the E-SIGN Act and UETA.
          </p>
        </div>
      </div>
    );
  }
);

export default SignatureField;
