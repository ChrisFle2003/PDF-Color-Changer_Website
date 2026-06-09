/* global pdfjsLib, PDFLib */

const QUALITY_SCALES = {
  low: 1.2,
  medium: 1.6,
  high: 2.1,
};

const PRESET_COLORS = {
  magenta: [90, 0, 55],
  blue: [18, 28, 78],
  violet: [58, 16, 92],
  red: [86, 10, 18],
};

const MODE_STANDARD = "standard";
const MODE_NO_BLACK = "no-black";

const state = {
  file: null,
  resultUrl: "",
  resultName: "",
  processing: false,
};

const elements = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  wireEvents();
  updateThresholdLabel();
  updateModeInfo();
  updateColorField();
  setIdleState();
}

function cacheElements() {
  elements.pdfInput = document.getElementById("pdf-input");
  elements.pickFileBtn = document.getElementById("pick-file-btn");
  elements.convertBtn = document.getElementById("convert-btn");
  elements.downloadBtn = document.getElementById("download-btn");
  elements.dropzone = document.getElementById("dropzone");
  elements.fileName = document.getElementById("file-name");
  elements.modeSelect = document.getElementById("mode-select");
  elements.modeInfo = document.getElementById("mode-info");
  elements.qualitySelect = document.getElementById("quality-select");
  elements.thresholdSlider = document.getElementById("threshold-slider");
  elements.thresholdValue = document.getElementById("threshold-value");
  elements.colorSelect = document.getElementById("color-select");
  elements.customColorField = document.getElementById("custom-color-field");
  elements.customColorInput = document.getElementById("custom-color-input");
  elements.preserveColored = document.getElementById("preserve-colored");
  elements.progressText = document.getElementById("progress-text");
  elements.progressBar = document.getElementById("progress-bar");
  elements.status = document.getElementById("status");
  elements.result = document.getElementById("result");

  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "lib/pdf.worker.min.js";
  }
}

function wireEvents() {
  elements.pickFileBtn.addEventListener("click", () => elements.pdfInput.click());
  elements.pdfInput.addEventListener("change", handleFileSelection);
  elements.convertBtn.addEventListener("click", startConversion);
  elements.downloadBtn.addEventListener("click", triggerDownload);
  elements.modeSelect.addEventListener("change", updateModeInfo);
  elements.thresholdSlider.addEventListener("input", updateThresholdLabel);
  elements.colorSelect.addEventListener("change", updateColorField);

  elements.dropzone.addEventListener("click", () => elements.pdfInput.click());
  elements.dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      elements.pdfInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((type) => {
    elements.dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      event.stopPropagation();
      elements.dropzone.classList.add("is-active");
    });
  });

  ["dragleave", "drop"].forEach((type) => {
    elements.dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      event.stopPropagation();
      elements.dropzone.classList.remove("is-active");
    });
  });

  elements.dropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      setFile(file);
    }
  });
}

function updateThresholdLabel() {
  elements.thresholdValue.textContent = elements.thresholdSlider.value;
}

function updateModeInfo() {
  const isNoBlackMode = elements.modeSelect.value === MODE_NO_BLACK;
  elements.modeInfo.textContent = isNoBlackMode
    ? "This mode replaces dark gray and near-black areas much more aggressively. It is a visual approximation, not a guarantee about ink channels or driver internals."
    : "This mode replaces black or very dark areas with a dark substitute color. The goal is to keep the PDF visually similar while avoiding pure black output. Whether the printer actually avoids black ink depends on the driver and color management.";
}

function updateColorField() {
  const useCustom = elements.colorSelect.value === "custom";
  elements.customColorField.hidden = !useCustom;
}

function setIdleState() {
  elements.progressText.textContent = "Ready.";
  elements.progressBar.value = 0;
  elements.convertBtn.disabled = !state.file || state.processing;
}

function setProcessingState(active) {
  state.processing = active;
  elements.convertBtn.disabled = active || !state.file;
  elements.pickFileBtn.disabled = active;
  elements.downloadBtn.disabled = active;
}

function setStatus(message, kind = "info") {
  elements.status.hidden = !message;
  elements.status.textContent = message;
  elements.status.className = "status";
  if (message) {
    elements.status.classList.add(kind);
  }
}

function setResult(message) {
  elements.result.hidden = !message;
  elements.result.textContent = message;
}

function clearStatus() {
  elements.status.hidden = true;
  elements.status.textContent = "";
  elements.status.className = "status";
}

function clearResult() {
  elements.result.hidden = true;
  elements.result.textContent = "";
  elements.downloadBtn.hidden = true;
  state.resultName = "";
}

function revokeResultUrl() {
  if (state.resultUrl) {
    URL.revokeObjectURL(state.resultUrl);
    state.resultUrl = "";
  }
}

function normalizeFileName(name) {
  return name.replace(/\.[^.]+$/, "");
}

function isPdfFile(file) {
  return Boolean(file) && (file.type === "application/pdf" || /\.pdf$/i.test(file.name));
}

function handleFileSelection(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  setFile(file);
}

function setFile(file) {
  if (!isPdfFile(file)) {
    revokeResultUrl();
    state.file = null;
    elements.fileName.textContent = "No PDF selected yet.";
    elements.pdfInput.value = "";
    setIdleState();
    showError("Please select a PDF file.");
    return;
  }

  revokeResultUrl();
  state.file = file;
  elements.fileName.textContent = file.name;
  elements.pdfInput.value = "";
  clearStatus();
  clearResult();
  setIdleState();
}

function showError(message) {
  setStatus(message, "error");
  elements.progressText.textContent = "Fehler.";
  elements.progressBar.value = 0;
  clearResult();
}

function getRenderScale() {
  return QUALITY_SCALES[elements.qualitySelect.value] ?? QUALITY_SCALES.medium;
}

function parseHexColor(hex) {
  const value = hex.replace("#", "").trim();
  if (value.length !== 6) {
    return null;
  }
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  if ([r, g, b].some((component) => Number.isNaN(component))) {
    return null;
  }
  return [r, g, b];
}

function getTargetColor() {
  const presetName = elements.colorSelect.value;
  const target =
    presetName === "custom"
      ? parseHexColor(elements.customColorInput.value)
      : PRESET_COLORS[presetName];

  if (!target) {
    return PRESET_COLORS.magenta;
  }

  if (target[0] === 0 && target[1] === 0 && target[2] === 0) {
    return PRESET_COLORS.magenta;
  }

  return target;
}

function getConversionSettings() {
  const isNoBlackMode = elements.modeSelect.value === MODE_NO_BLACK;
  return {
    threshold: Number(elements.thresholdSlider.value),
    preserveColored: isNoBlackMode ? false : elements.preserveColored.checked,
    targetColor: getTargetColor(),
    scale: getRenderScale(),
    isNoBlackMode,
  };
}

function mapDarkPixels(imageData, settings) {
  const { threshold, preserveColored, targetColor } = settings;
  const data = imageData.data;
  const [targetR, targetG, targetB] = targetColor;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) {
      continue;
    }

    if (r > 245 && g > 245 && b > 245) {
      continue;
    }

    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const isDark = r <= threshold && g <= threshold && b <= threshold;
    const nearNeutralDark =
      luminance <= threshold &&
      Math.abs(r - g) <= 20 &&
      Math.abs(r - b) <= 20 &&
      Math.abs(g - b) <= 20;

    if (preserveColored) {
      if (!(isDark || nearNeutralDark)) {
        continue;
      }
    } else if (luminance > threshold) {
      continue;
    }

    const scale = Math.max(0.18, 1 - luminance / Math.max(1, threshold + 40));
    const nr = Math.max(1, Math.round(targetR * scale));
    const ng = Math.max(0, Math.round(targetG * scale));
    const nb = Math.max(1, Math.round(targetB * scale));

    if (nr === 0 && ng === 0 && nb === 0) {
      data[i] = 1;
      data[i + 1] = 0;
      data[i + 2] = 1;
    } else {
      data[i] = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;
    }
  }

  return imageData;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas could not be saved as an image."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function normalizeProcessingError(error) {
  const message = String(error?.message || error || "");
  const lower = message.toLowerCase();

  if (lower.includes("password")) {
    return "The PDF is password-protected and could not be read.";
  }

  if (
    lower.includes("memory") ||
    lower.includes("allocation") ||
    lower.includes("canvas area exceeds") ||
    lower.includes("too large") ||
    lower.includes("out of memory") ||
    lower.includes("size limit")
  ) {
    return "The PDF is too large or the browser does not have enough memory.";
  }

  if (
    lower.includes("parse") ||
    lower.includes("invalid") ||
    lower.includes("corrupt") ||
    lower.includes("unexpected")
  ) {
    return "The PDF could not be read.";
  }

  if (lower.includes("render")) {
    return "Conversion failed.";
  }

  return "Conversion failed.";
}

async function loadPdfDocument(file) {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  return loadingTask.promise;
}

async function processPage(pdfPage, outPdf, settings, pageNumber, totalPages) {
  const viewport = pdfPage.getViewport({ scale: settings.scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));

  await pdfPage.render({ canvasContext: context, viewport }).promise;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  context.putImageData(mapDarkPixels(imageData, settings), 0, 0);

  const imageBlob = await canvasToBlob(canvas);
  const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
  const png = await outPdf.embedPng(imageBytes);

  const [x1, y1, x2, y2] = pdfPage.view;
  const pageWidth = x2 - x1;
  const pageHeight = y2 - y1;
  const outPage = outPdf.addPage([pageWidth, pageHeight]);
  outPage.drawImage(png, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });

  pdfPage.cleanup?.();
  canvas.width = 0;
  canvas.height = 0;
}

async function startConversion() {
  if (state.processing) {
    return;
  }

  if (!state.file) {
    showError("Please select a PDF file first.");
    return;
  }

  if (!isPdfFile(state.file)) {
    showError("Please select a PDF file.");
    return;
  }

  if (!window.pdfjsLib || !window.PDFLib) {
    showError("The PDF libraries could not be loaded. Please reload the page.");
    return;
  }

  revokeResultUrl();
  clearResult();
  clearStatus();
  setProcessingState(true);
  elements.progressText.textContent = "Loading PDF...";
  elements.progressBar.value = 2;

  try {
    const settings = getConversionSettings();
    const pdf = await loadPdfDocument(state.file);
    const outPdf = await PDFLib.PDFDocument.create();
    const totalPages = pdf.numPages;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      elements.progressText.textContent = `Processing page ${pageNumber} of ${totalPages}...`;
      elements.progressBar.value = Math.round(((pageNumber - 1) / totalPages) * 100);
      const pdfPage = await pdf.getPage(pageNumber);
      await processPage(pdfPage, outPdf, settings, pageNumber, totalPages);
      elements.progressBar.value = Math.round((pageNumber / totalPages) * 100);
      await nextFrame();
    }

    const pdfBytes = await outPdf.save();
    const outputBlob = new Blob([pdfBytes], { type: "application/pdf" });
    state.resultUrl = URL.createObjectURL(outputBlob);
    state.resultName = `${normalizeFileName(state.file.name)}_no_black.pdf`;

    elements.downloadBtn.hidden = false;
    elements.downloadBtn.disabled = false;

    elements.progressText.textContent = "Done.";
    elements.progressBar.value = 100;
    setStatus("The converted PDF is ready.", "success");
    setResult(`Output ready: ${state.resultName}`);
  } catch (error) {
    console.error(error);
    showError(normalizeProcessingError(error));
  } finally {
    setProcessingState(false);
  }
}

function triggerDownload() {
  if (!state.resultUrl) {
    return;
  }

  const link = document.createElement("a");
  link.href = state.resultUrl;
  link.download = state.resultName || "output_no_black.pdf";
  link.click();
}
