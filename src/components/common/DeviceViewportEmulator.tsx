import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  ChevronDown,
  Sliders,
  Minimize2,
  Eye,
  FoldHorizontal,
} from 'lucide-react';

export interface DevicePreset {
  id: string;
  name: string;
  category: 'desktop' | 'iphone' | 'pixel' | 'galaxy' | 'foldable' | 'tablet' | 'hub' | 'custom';
  width: number;
  height: number;
  foldedWidth?: number;
  foldedHeight?: number;
  dpr: number;
  defaultOrientation: 'portrait' | 'landscape';
  userAgentType: 'Desktop' | 'Mobile' | 'Tablet' | 'Foldable' | 'Smart Display';
}

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'desktop',
    name: 'Desktop (Full Viewport)',
    category: 'desktop',
    width: 1440,
    height: 900,
    dpr: 1,
    defaultOrientation: 'landscape',
    userAgentType: 'Desktop',
  },
  // iPhones
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    category: 'iphone',
    width: 375,
    height: 667,
    dpr: 2,
    defaultOrientation: 'portrait',
    userAgentType: 'Mobile',
  },
  {
    id: 'iphone-16',
    name: 'iPhone 16',
    category: 'iphone',
    width: 393,
    height: 852,
    dpr: 3,
    defaultOrientation: 'portrait',
    userAgentType: 'Mobile',
  },
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    category: 'iphone',
    width: 440,
    height: 956,
    dpr: 3,
    defaultOrientation: 'portrait',
    userAgentType: 'Mobile',
  },
  // Google Pixels
  {
    id: 'pixel-9',
    name: 'Pixel 9',
    category: 'pixel',
    width: 412,
    height: 915,
    dpr: 2.6,
    defaultOrientation: 'portrait',
    userAgentType: 'Mobile',
  },
  {
    id: 'pixel-9-pro',
    name: 'Pixel 9 Pro',
    category: 'pixel',
    width: 412,
    height: 915,
    dpr: 3.1,
    defaultOrientation: 'portrait',
    userAgentType: 'Mobile',
  },
  {
    id: 'pixel-10',
    name: 'Pixel 10',
    category: 'pixel',
    width: 412,
    height: 915,
    dpr: 3.0,
    defaultOrientation: 'portrait',
    userAgentType: 'Mobile',
  },
  // Samsung Galaxy
  {
    id: 'samsung-galaxy-a55',
    name: 'Samsung Galaxy A55',
    category: 'galaxy',
    width: 412,
    height: 915,
    dpr: 2.6,
    defaultOrientation: 'portrait',
    userAgentType: 'Mobile',
  },
  // Foldables
  {
    id: 'pixel-9-pro-fold',
    name: 'Pixel 9 Pro Fold',
    category: 'foldable',
    width: 884,
    height: 852,
    foldedWidth: 412,
    foldedHeight: 915,
    dpr: 2.6,
    defaultOrientation: 'landscape',
    userAgentType: 'Foldable',
  },
  {
    id: 'galaxy-z-fold-6',
    name: 'Galaxy Z Fold 6',
    category: 'foldable',
    width: 768,
    height: 906,
    foldedWidth: 344,
    foldedHeight: 882,
    dpr: 2.6,
    defaultOrientation: 'portrait',
    userAgentType: 'Foldable',
  },
  // Tablets & 2-in-1s
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    category: 'tablet',
    width: 768,
    height: 1024,
    dpr: 2,
    defaultOrientation: 'portrait',
    userAgentType: 'Tablet',
  },
  {
    id: 'ipad-pro-13',
    name: 'iPad Pro 13',
    category: 'tablet',
    width: 1024,
    height: 1366,
    dpr: 2,
    defaultOrientation: 'portrait',
    userAgentType: 'Tablet',
  },
  {
    id: 'surface-pro-10',
    name: 'Surface Pro 10',
    category: 'tablet',
    width: 912,
    height: 1368,
    dpr: 2,
    defaultOrientation: 'portrait',
    userAgentType: 'Tablet',
  },
  // Smart Hub
  {
    id: 'nest-hub-max',
    name: 'Nest Hub Max',
    category: 'hub',
    width: 1280,
    height: 800,
    dpr: 2,
    defaultOrientation: 'landscape',
    userAgentType: 'Smart Display',
  },
  // Custom
  {
    id: 'custom',
    name: 'Custom',
    category: 'custom',
    width: 390,
    height: 844,
    dpr: 2,
    defaultOrientation: 'portrait',
    userAgentType: 'Mobile',
  },
];

const QUICK_BREAKPOINTS = [
  { label: '320px', width: 320, height: 568 },
  { label: '375px', width: 375, height: 667 },
  { label: '390px', width: 390, height: 844 },
  { label: '430px', width: 430, height: 932 },
  { label: '768px', width: 768, height: 1024 },
  { label: '1024px', width: 1024, height: 768 },
];

interface DeviceViewportEmulatorProps {
  children: React.ReactNode;
}

export const DeviceViewportEmulator: React.FC<DeviceViewportEmulatorProps> = ({ children }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('desktop');
  const [customWidth, setCustomWidth] = useState<number>(390);
  const [customHeight, setCustomHeight] = useState<number>(844);
  const [widthInputStr, setWidthInputStr] = useState<string>('1440');
  const [heightInputStr, setHeightInputStr] = useState<string>('900');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [isFolded, setIsFolded] = useState<boolean>(false);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [fitToScreen, setFitToScreen] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState<boolean>(false);
  const [windowSize, setWindowSize] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1440,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      if (selectedDeviceId === 'desktop') {
        setWidthInputStr(String(window.innerWidth));
        setHeightInputStr(String(window.innerHeight));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedDeviceId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePreset = useMemo(
    () => DEVICE_PRESETS.find((d) => d.id === selectedDeviceId) || DEVICE_PRESETS[0],
    [selectedDeviceId]
  );

  // Calculate effective simulated width & height
  const { effectiveWidth, effectiveHeight } = useMemo(() => {
    if (selectedDeviceId === 'desktop') {
      return { effectiveWidth: windowSize.w, effectiveHeight: windowSize.h };
    }
    if (selectedDeviceId === 'custom') {
      return { effectiveWidth: customWidth, effectiveHeight: customHeight };
    }

    let baseW = activePreset.width;
    let baseH = activePreset.height;

    if (activePreset.category === 'foldable' && isFolded && activePreset.foldedWidth && activePreset.foldedHeight) {
      baseW = activePreset.foldedWidth;
      baseH = activePreset.foldedHeight;
    }

    const minDim = Math.min(baseW, baseH);
    const maxDim = Math.max(baseW, baseH);

    if (orientation === 'portrait') {
      return { effectiveWidth: minDim, effectiveHeight: maxDim };
    } else {
      return { effectiveWidth: maxDim, effectiveHeight: minDim };
    }
  }, [selectedDeviceId, customWidth, customHeight, activePreset, isFolded, orientation, windowSize]);

  // Sync text inputs when preset/orientation changes
  useEffect(() => {
    setWidthInputStr(String(effectiveWidth));
    setHeightInputStr(String(effectiveHeight));
  }, [effectiveWidth, effectiveHeight]);

  // Compute fit-to-screen zoom factor or manual zoom factor
  const effectiveScale = useMemo(() => {
    if (selectedDeviceId === 'desktop' && zoomPercent === 100 && !fitToScreen) {
      return 1;
    }
    if (fitToScreen) {
      const availW = Math.max(280, windowSize.w - 48);
      const availH = Math.max(320, windowSize.h - (toolbarCollapsed ? 48 : 136));
      const scaleW = availW / effectiveWidth;
      const scaleH = availH / effectiveHeight;
      const fitted = Math.min(scaleW, scaleH, 1.25);
      return Math.max(0.25, Math.round(fitted * 100) / 100);
    }
    return Math.max(0.25, Math.min(2, zoomPercent / 100));
  }, [selectedDeviceId, zoomPercent, fitToScreen, windowSize, effectiveWidth, effectiveHeight, toolbarCollapsed]);

  const handleSelectDevice = (presetId: string) => {
    const preset = DEVICE_PRESETS.find((d) => d.id === presetId) || DEVICE_PRESETS[0];
    setSelectedDeviceId(preset.id);
    setIsFolded(false);
    setOrientation(preset.defaultOrientation);
    if (preset.id === 'custom') {
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
      setOrientation(preset.width <= preset.height ? 'portrait' : 'landscape');
    } else if (preset.id !== 'desktop') {
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
      // Automatically enable Fit to Screen if device is larger than current browser window
      const availW = window.innerWidth - 48;
      const availH = window.innerHeight - 136;
      if (preset.width > availW || preset.height > availH) {
        setFitToScreen(true);
      } else {
        setFitToScreen(false);
        setZoomPercent(100);
      }
    } else {
      setFitToScreen(false);
      setZoomPercent(100);
    }
    setDropdownOpen(false);
  };

  const handleSelectBreakpoint = (w: number, h: number) => {
    setSelectedDeviceId('custom');
    setCustomWidth(w);
    setCustomHeight(h);
    setOrientation(w <= h ? 'portrait' : 'landscape');
    const availW = window.innerWidth - 48;
    const availH = window.innerHeight - 136;
    if (w > availW || h > availH) {
      setFitToScreen(true);
    } else {
      setFitToScreen(false);
      setZoomPercent(100);
    }
  };

  const handleWidthChange = (val: string) => {
    setWidthInputStr(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 240 && num <= 2560) {
      setSelectedDeviceId('custom');
      setCustomWidth(num);
      if (selectedDeviceId !== 'custom') {
        setCustomHeight(effectiveHeight);
      }
      setOrientation(num <= (selectedDeviceId === 'custom' ? customHeight : effectiveHeight) ? 'portrait' : 'landscape');
    }
  };

  const handleHeightChange = (val: string) => {
    setHeightInputStr(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 240 && num <= 2560) {
      setSelectedDeviceId('custom');
      setCustomHeight(num);
      if (selectedDeviceId !== 'custom') {
        setCustomWidth(effectiveWidth);
      }
      setOrientation((selectedDeviceId === 'custom' ? customWidth : effectiveWidth) <= num ? 'portrait' : 'landscape');
    }
  };

  const handleSetOrientation = (targetOrientation: 'portrait' | 'landscape') => {
    if (selectedDeviceId === 'desktop') {
      // Switch to iPhone 16 if user clicks orientation while in full desktop
      setSelectedDeviceId('custom');
      const w = targetOrientation === 'portrait' ? 390 : 844;
      const h = targetOrientation === 'portrait' ? 844 : 390;
      setCustomWidth(w);
      setCustomHeight(h);
      setOrientation(targetOrientation);
      return;
    }
    if (selectedDeviceId === 'custom') {
      const minDim = Math.min(customWidth, customHeight);
      const maxDim = Math.max(customWidth, customHeight);
      setCustomWidth(targetOrientation === 'portrait' ? minDim : maxDim);
      setCustomHeight(targetOrientation === 'portrait' ? maxDim : minDim);
    }
    setOrientation(targetOrientation);
  };

  const handleToggleOrientation = () => {
    handleSetOrientation(orientation === 'portrait' ? 'landscape' : 'portrait');
  };

  const handleZoomIn = () => {
    const currentPct = fitToScreen ? Math.round(effectiveScale * 100) : zoomPercent;
    setFitToScreen(false);
    setZoomPercent(Math.min(200, Math.round((currentPct + 10) / 5) * 5));
  };

  const handleZoomOut = () => {
    const currentPct = fitToScreen ? Math.round(effectiveScale * 100) : zoomPercent;
    setFitToScreen(false);
    setZoomPercent(Math.max(25, Math.round((currentPct - 10) / 5) * 5));
  };

  const handleToggleFitToScreen = () => {
    if (selectedDeviceId === 'desktop') {
      setZoomPercent(100);
      setFitToScreen(false);
      return;
    }
    setFitToScreen((prev) => !prev);
  };

  const isEmulatedMode = selectedDeviceId !== 'desktop' || zoomPercent !== 100 || fitToScreen;
  const displayedZoomPct = Math.round(effectiveScale * 100);

  return (
    <div className="w-full min-h-screen flex flex-col m-0 p-0">
      {/* Chrome DevTools Device Toolbar */}
      <div
        role="region"
        aria-label="Device Viewport Emulator Toolbar"
        className="sticky top-0 z-[100] w-full bg-[#202124] text-[#e8eaed] border-b border-[#3c4043] shadow-md select-none font-sans"
      >
        {toolbarCollapsed ? (
          <div className="px-3 py-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-[#8ab4f8]" />
              <span className="font-semibold text-[#e8eaed]">
                Viewport Emulator: <strong className="text-[#8ab4f8]">{activePreset.name}</strong>
                {selectedDeviceId !== 'desktop' && ` (${effectiveWidth} × ${effectiveHeight}px • ${displayedZoomPct}%)`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedDeviceId !== 'desktop' && (
                <button
                  type="button"
                  onClick={() => handleSelectDevice('desktop')}
                  className="px-2 py-0.5 rounded bg-[#303134] hover:bg-[#3c4043] text-[#8ab4f8] font-medium cursor-pointer"
                >
                  Full Desktop
                </button>
              )}
              <button
                type="button"
                onClick={() => setToolbarCollapsed(false)}
                className="px-2.5 py-0.5 rounded bg-[#303134] hover:bg-[#3c4043] text-[#e8eaed] flex items-center gap-1 cursor-pointer"
                title="Expand Device Viewport Toolbar"
              >
                <Eye className="w-3 h-3" />
                <span>Show Controls</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full px-2 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-xs">
            {/* Left Group: DevTools Icon & Device Selector Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 pr-2 border-r border-[#3c4043]">
                <span
                  className={`p-1 rounded ${
                    selectedDeviceId !== 'desktop' ? 'bg-[#8ab4f8]/20 text-[#8ab4f8]' : 'text-[#9aa0a6]'
                  }`}
                  title="Toggle Device Toolbar"
                >
                  <Smartphone className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-medium text-[#9aa0a6] hidden sm:inline">Dimensions:</span>
              </div>

              {/* Chrome DevTools Style Custom Dropdown + Accessible Native Select */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                  aria-label="Device Selector"
                  className="inline-flex items-center justify-between gap-2 min-w-[155px] sm:min-w-[185px] px-2.5 py-1 rounded bg-[#292a2d] hover:bg-[#35363a] border border-[#3c4043] text-[#e8eaed] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="truncate">{activePreset.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#9aa0a6] shrink-0" />
                </button>

                {/* Chrome DevTools Style Floating Menu */}
                {dropdownOpen && (
                  <div
                    role="listbox"
                    aria-label="Device Viewport Presets"
                    className="absolute left-0 top-full mt-1 w-64 max-h-[75vh] overflow-y-auto rounded-md bg-[#292a2d] border border-[#4a4c50] shadow-[0_10px_30px_rgba(0,0,0,0.65)] py-1.5 z-[120] text-[12px]"
                  >
                    {DEVICE_PRESETS.map((device, index) => {
                      const isSelected = device.id === selectedDeviceId;
                      const showDividerAfter =
                        device.id === 'desktop' ||
                        device.id === 'iphone-16-pro-max' ||
                        device.id === 'samsung-galaxy-a55' ||
                        device.id === 'galaxy-z-fold-6' ||
                        device.id === 'nest-hub-max';

                      return (
                        <React.Fragment key={device.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelectDevice(device.id)}
                            className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#3c4043] text-white font-semibold'
                                : 'text-[#e8eaed] hover:bg-[#35363a]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-4 flex items-center justify-center shrink-0">
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#8ab4f8]" />}
                              </span>
                              <span className="truncate">{device.name}</span>
                            </div>
                            {device.id !== 'desktop' && (
                              <span className="text-[10.5px] text-[#9aa0a6] font-mono ml-2 shrink-0">
                                {device.width}×{device.height}
                              </span>
                            )}
                          </button>
                          {showDividerAfter && index < DEVICE_PRESETS.length - 1 && (
                            <div className="my-1 border-t border-[#3c4043]" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Width × Height Custom Inputs */}
              <div className="flex items-center gap-1 bg-[#292a2d] px-2 py-0.5 rounded border border-[#3c4043]">
                <input
                  type="number"
                  aria-label="Viewport width in pixels"
                  min={240}
                  max={2560}
                  value={widthInputStr}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="w-12 bg-transparent text-center text-[#e8eaed] font-mono text-xs focus:outline-hidden focus:text-[#8ab4f8]"
                  title="Custom Viewport Width (px)"
                />
                <span className="text-[#9aa0a6] select-none">×</span>
                <input
                  type="number"
                  aria-label="Viewport height in pixels"
                  min={240}
                  max={2560}
                  value={heightInputStr}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className="w-12 bg-transparent text-center text-[#e8eaed] font-mono text-xs focus:outline-hidden focus:text-[#8ab4f8]"
                  title="Custom Viewport Height (px)"
                />
                <span className="text-[10px] text-[#9aa0a6] hidden sm:inline">px</span>
              </div>
            </div>

            {/* Center Group: Orientation (Portrait / Landscape / Rotate) & Foldable Posture */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Portrait & Landscape Buttons */}
              <div className="inline-flex items-center rounded bg-[#292a2d] border border-[#3c4043] p-0.5">
                <button
                  type="button"
                  onClick={() => handleSetOrientation('portrait')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    orientation === 'portrait' && selectedDeviceId !== 'desktop'
                      ? 'bg-[#8ab4f8] text-[#202124] font-bold'
                      : 'text-[#9aa0a6] hover:text-white'
                  }`}
                  title="Portrait Orientation"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetOrientation('landscape')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    orientation === 'landscape' && selectedDeviceId !== 'desktop'
                      ? 'bg-[#8ab4f8] text-[#202124] font-bold'
                      : 'text-[#9aa0a6] hover:text-white'
                  }`}
                  title="Landscape Orientation"
                >
                  <Smartphone className="w-3 h-3 rotate-90" />
                  <span>Landscape</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleOrientation}
                  aria-label="Rotate orientation"
                  className="px-1.5 py-0.5 text-[#9aa0a6] hover:text-white transition-colors cursor-pointer border-l border-[#3c4043] ml-0.5"
                  title="Rotate Viewport (Swap Width & Height)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Foldable Posture Toggle (For Pixel 9 Pro Fold & Galaxy Z Fold 6) */}
              {activePreset.category === 'foldable' && (
                <button
                  type="button"
                  onClick={() => setIsFolded((f) => !f)}
                  className={`px-2 py-1 rounded border text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    isFolded
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                      : 'bg-[#292a2d] border-[#3c4043] text-[#8ab4f8] hover:bg-[#35363a]'
                  }`}
                  title="Toggle Folded / Unfolded Screen Posture"
                >
                  <FoldHorizontal className="w-3.5 h-3.5" />
                  <span>{isFolded ? 'Folded Cover' : 'Unfolded Main'}</span>
                </button>
              )}

              {/* Zoom Out, Zoom %, Zoom In, Fit to Screen */}
              <div className="inline-flex items-center rounded bg-[#292a2d] border border-[#3c4043] p-0.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  aria-label="Zoom out"
                  className="p-1 text-[#9aa0a6] hover:text-white hover:bg-[#35363a] rounded transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <span
                  className="px-2 text-[11px] font-mono font-semibold text-[#e8eaed] min-w-[46px] text-center"
                  title="Current Viewport Zoom"
                >
                  {displayedZoomPct}%
                </span>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  aria-label="Zoom in"
                  className="p-1 text-[#9aa0a6] hover:text-white hover:bg-[#35363a] rounded transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleToggleFitToScreen}
                  aria-label="Fit to screen"
                  className={`px-2 py-0.5 ml-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer border-l border-[#3c4043] ${
                    fitToScreen
                      ? 'bg-[#8ab4f8] text-[#202124] font-bold'
                      : 'text-[#9aa0a6] hover:text-white'
                  }`}
                  title="Fit Device Viewport to Screen"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Fit to screen</span>
                </button>

                {(zoomPercent !== 100 || fitToScreen) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFitToScreen(false);
                      setZoomPercent(100);
                    }}
                    className="px-1.5 py-0.5 ml-0.5 text-[10px] text-[#8ab4f8] hover:underline cursor-pointer"
                    title="Reset Zoom to 100%"
                  >
                    100%
                  </button>
                )}
              </div>
            </div>

            {/* Right Group: Quick Width Presets & Minimize */}
            <div className="hidden xl:flex items-center gap-1">
              <span className="text-[10.5px] text-[#9aa0a6] mr-1">Test Widths:</span>
              {QUICK_BREAKPOINTS.map((bp) => {
                const isBpActive =
                  selectedDeviceId !== 'desktop' && effectiveWidth === bp.width;
                return (
                  <button
                    key={bp.label}
                    type="button"
                    onClick={() => handleSelectBreakpoint(bp.width, bp.height)}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-mono transition-colors cursor-pointer ${
                      isBpActive
                        ? 'bg-[#8ab4f8] text-[#202124] font-bold'
                        : 'bg-[#292a2d] hover:bg-[#35363a] text-[#9aa0a6] hover:text-white border border-[#3c4043]'
                    }`}
                  >
                    {bp.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => handleSelectDevice('desktop')}
                className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-colors cursor-pointer ${
                  selectedDeviceId === 'desktop'
                    ? 'bg-[#8ab4f8] text-[#202124] font-bold'
                    : 'bg-[#292a2d] hover:bg-[#35363a] text-[#9aa0a6] hover:text-white border border-[#3c4043]'
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setToolbarCollapsed(true)}
                className="p-1 ml-1 text-[#9aa0a6] hover:text-white rounded hover:bg-[#35363a] cursor-pointer"
                title="Minimize Emulator Bar"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Viewport Stage */}
      {!isEmulatedMode ? (
        /* Full Desktop Mode: Render website full-bleed with container query support */
        <div
          id="viewport-canvas"
          className="viewport-container-query w-full flex-1 flex flex-col bg-white overflow-x-hidden"
        >
          {children}
        </div>
      ) : (
        /* Emulated Device Viewport Stage (Chrome DevTools Dark Canvas) */
        <div
          ref={workspaceRef}
          className="flex-1 w-full bg-[#202124] flex flex-col items-center justify-start py-4 sm:py-6 px-2 sm:px-6 overflow-auto"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* Device Meta Header Pill */}
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-xs text-[#9aa0a6] bg-[#292a2d] px-3.5 py-1.5 rounded-full border border-[#3c4043] shadow-md">
            <span className="font-bold text-[#e8eaed]">{activePreset.name}</span>
            <span>•</span>
            <span className="font-mono text-[#8ab4f8]">
              {effectiveWidth} × {effectiveHeight} px
            </span>
            <span>•</span>
            <span className="capitalize">{orientation}</span>
            <span>•</span>
            <span>DPR {activePreset.dpr}x</span>
            <span>•</span>
            <span>Zoom {displayedZoomPct}%</span>
            <button
              type="button"
              onClick={() => handleSelectDevice('desktop')}
              className="ml-2 text-[#8ab4f8] hover:underline font-semibold cursor-pointer"
            >
              Exit Device Frame
            </button>
          </div>

          {/* Scaled Wrapper so layout height matches visual scaled height */}
          <div
            style={{
              width: `${Math.round(effectiveWidth * effectiveScale) + 24}px`,
              height: `${Math.round(effectiveHeight * effectiveScale) + 28}px`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}
          >
            {/* Outer Hardware Bezel + Transform Containing Block for Fixed Elements */}
            <div
              id="device-bezel"
              style={{
                width: `${effectiveWidth + 24}px`,
                height: `${effectiveHeight + 28}px`,
                transform: `scale(${effectiveScale})`,
                transformOrigin: 'top center',
              }}
              className="bg-[#17181b] rounded-[28px] p-3 pt-4 shadow-[0_25px_70px_rgba(0,0,0,0.75)] border-2 border-[#3c4043] flex flex-col items-center relative shrink-0"
            >
              {/* Subtle Top Camera/Speaker Bar */}
              <div className="w-16 h-1.5 rounded-full bg-[#2d2f34] mb-1.5 shrink-0" />

              {/* Inner Fixed-Containing Screen Frame */}
              <div
                id="device-screen-frame"
                style={{
                  width: `${effectiveWidth}px`,
                  height: `${effectiveHeight}px`,
                  transform: 'translateZ(0)',
                }}
                className="relative bg-white rounded-[16px] overflow-hidden shadow-inner border border-slate-800/40 shrink-0"
              >
                {/* Scrollable Website Viewport with CSS Container Query Support */}
                <div
                  id="viewport-canvas"
                  className="viewport-container-query w-full h-full overflow-y-auto overflow-x-hidden bg-white text-slate-800"
                >
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
