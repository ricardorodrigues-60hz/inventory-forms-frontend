import React, { useEffect, useRef, useState } from 'react';
import { Camera, XCircle, RefreshCw } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const html5QrcodeRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        const html5Qrcode = new Html5Qrcode('barcode-reader-element');
        html5QrcodeRef.current = html5Qrcode;

        let lastCode = '';
        let lastTime = 0;

        await html5Qrcode.start(
          { facingMode: 'environment' },
          {
            fps: 20,
            qrbox: (width, height) => {
              const qrWidth = Math.floor(width * 0.85);
              const qrHeight = Math.floor(height * 0.45);
              return { width: qrWidth, height: qrHeight };
            },
            aspectRatio: 1.777778,
            videoConstraints: {
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              facingMode: 'environment'
            }
          },
          (decodedText: string) => {
            const now = Date.now();
            if (decodedText === lastCode && now - lastTime < 1000) {
              return;
            }
            lastCode = decodedText;
            lastTime = now;

            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              try { navigator.vibrate(100); } catch (_) {}
            }

            onScanSuccess(decodedText);
          },
          (errorMessage: string) => {
            // Ignora erros normais de varredura de frame
          }
        );

        if (isMounted) {
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Erro ao inicializar scanner:', err);
        if (isMounted) {
          setError('Não foi possível acessar a câmera traseira. Verifique as permissões do navegador.');
          setLoading(false);
        }
      }
    }

    initScanner();

    return () => {
      isMounted = false;
      const instance = html5QrcodeRef.current;
      if (instance) {
        try {
          instance.stop().catch((e: any) => {
            // Ignora erro se já estiver parado
          });
        } catch (e) {
          console.warn('Erro ao parar scanner:', e);
        }
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-xl border border-slate-700 space-y-3 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#F0F9FA]">
          <Camera className="w-4 h-4 text-[#008B95]" />
          <span>Leitor de Código de Barras</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1"
          title="Fechar Câmera"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#008B95]" />
          <span>Iniciando câmera traseira...</span>
        </div>
      )}

      {error ? (
        <div className="bg-rose-950/60 border border-rose-800 text-rose-200 text-xs p-3 rounded-lg text-center">
          {error}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-black">
          <div id="barcode-reader-element" className="w-full min-h-[220px]" />
        </div>
      )}

      <p className="text-[11px] text-slate-400 text-center">
        Aponte a câmera traseira para o código de barras.
      </p>
    </div>
  );
};
