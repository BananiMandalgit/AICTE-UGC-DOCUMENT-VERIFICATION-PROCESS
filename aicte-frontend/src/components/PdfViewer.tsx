import React, { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface HighlightRegion {
  page?: number;
  location?: number[];
  page_width?: number;
  page_height?: number;
}

interface PDFViewerProps {
  pdfPath: string;
  pageNumber?: number;
  highlights?: HighlightRegion[];
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfPath,
  pageNumber = 1,
  highlights = [],
}) => {
  const [numPages, setNumPages] = useState<number>();
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(pageNumber);
  }, [pageNumber]);

  useEffect(() => {
    if (!containerRef.current) return;
    const setWidth = () => {
      setContainerWidth(containerRef.current?.clientWidth || 0);
    };
    setWidth();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setWidth());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const activeHighlights = useMemo(() => {
    return highlights.filter((highlight) => {
      const targetPage = highlight.page ?? currentPage;
      return (
        targetPage === currentPage &&
        Array.isArray(highlight.location) &&
        highlight.page_width &&
        highlight.page_height
      );
    });
  }, [highlights, currentPage]);

  const overlayBoxes = useMemo(() => {
    if (!canvasSize.width || !canvasSize.height) {
      return [];
    }

    return activeHighlights.map((highlight, index) => {
      const [x1, y1, x2, y2] = highlight.location as number[];
      const pageWidth = highlight.page_width || 1;
      const pageHeight = highlight.page_height || 1;
      const left = (x1 / pageWidth) * canvasSize.width;
      const top = (y1 / pageHeight) * canvasSize.height;
      const width = ((x2 - x1) / pageWidth) * canvasSize.width;
      const height = ((y2 - y1) / pageHeight) * canvasSize.height;

      return {
        key: `${currentPage}-${index}`,
        style: { left, top, width, height },
      };
    });
  }, [activeHighlights, canvasSize, currentPage]);

  const handleRenderSuccess = () => {
    if (!canvasRef.current) return;
    const width = parseFloat(canvasRef.current.style.width || "0");
    const height = parseFloat(canvasRef.current.style.height || "0");
    setCanvasSize({
      width: width || canvasRef.current.width,
      height: height || canvasRef.current.height,
    });
  };

  useEffect(() => {
    let cancel = false;
    const fetchPdf = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const normalizedPath = encodeURI(pdfPath.trim());
        const response = await fetch(normalizedPath, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`PDF request failed (${response.status})`);
        }
        const data = await response.arrayBuffer();
        if (!cancel) {
          setPdfData(new Uint8Array(data));
        }
      } catch (error) {
        if (!cancel) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load PDF"
          );
          setPdfData(null);
        }
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    };
    fetchPdf();
    return () => {
      cancel = true;
    };
  }, [pdfPath]);

  return (
    <div className="w-full space-y-3" ref={containerRef}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Page {currentPage}
          {numPages ? ` of ${numPages}` : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) =>
                numPages ? Math.min(numPages, prev + 1) : prev + 1
              )
            }
            disabled={numPages ? currentPage >= numPages : false}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="border rounded-md bg-white p-2">
        <div className="relative w-full min-h-[400px] flex items-center justify-center">
          {loading && <p className="text-sm text-gray-600">Loading PDF…</p>}
          {!loading && loadError && (
            <p className="text-sm text-red-500 text-center px-4">{loadError}</p>
          )}
          {!loading && !loadError && pdfData && (
            <>
              <Document
                file={{ data: pdfData }}
                onLoadSuccess={({ numPages: total }) => setNumPages(total)}
                onLoadError={(error) => setLoadError(error.message)}
                onSourceError={(error) => setLoadError(error.message)}
                loading={<p className="p-4 text-center text-sm">Loading PDF…</p>}
                error={<p className="p-4 text-center text-sm text-red-500">Unable to render PDF.</p>}
              >
                <Page
                  pageNumber={currentPage}
                  width={containerWidth || undefined}
                  canvasRef={canvasRef}
                  onRenderSuccess={handleRenderSuccess}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </Document>
              {overlayBoxes.map(({ key, style }) => (
                <div
                  key={key}
                  className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
                  style={{
                    ...style,
                    position: "absolute",
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

