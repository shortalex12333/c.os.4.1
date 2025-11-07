import React, { useState } from 'react';
import { AISolutionCardLibrary } from './AISolutionCardLibrary';
import { motion } from 'framer-motion';
import { ChevronRight, ExternalLink, Copy, AlertTriangle, Info, CheckCircle } from 'lucide-react';

// Sample data for the comparison - 3 solutions with different confidence levels
const comparisonSolutions = [
  {
    id: 'solution-1',
    title: 'Primary Fuel System Diagnostic - Filter Inspection',
    confidence: 'high' as const,
    source: {
      title: 'MTU 2000 Series Manual',
      page: 247,
      revision: '2024.3'
    },
    steps: [
      {
        text: 'Shutdown engine and ensure all fuel lines are depressurized before beginning inspection.',
        type: 'warning' as const,
        isBold: true
      },
      {
        text: 'Remove fuel filter housing using the specialized wrench (Part #MT-4472).',
        type: 'normal' as const
      },
      {
        text: 'Inspect filter element for rust deposits, fuel contamination, or physical blockage.',
        type: 'normal' as const
      },
      {
        text: 'Check filter housing O-rings for cracking or degradation - replace if worn.',
        type: 'tip' as const
      },
      {
        text: 'If filter shows contamination, replace with OEM filter (Part #MT-FF-2000) and prime system.',
        type: 'normal' as const,
        isBold: true
      }
    ],
    procedureLink: '/procedures/mtu-fuel-filter-replacement'
  },
  {
    id: 'solution-2',
    title: 'Fuel Pressure Sensor Calibration Check',
    confidence: 'medium' as const,
    source: {
      title: 'Engine Control Module Manual',
      page: 156,
      revision: '2024.1'
    },
    steps: [
      {
        text: 'Connect diagnostic scanner to ECM port (J1939 interface).',
        type: 'normal' as const
      },
      {
        text: 'Navigate to sensor diagnostics menu and select fuel pressure sensor.',
        type: 'normal' as const
      },
      {
        text: 'Compare live sensor readings with expected values at idle (2.8-3.2 bar).',
        type: 'normal' as const,
        isBold: true
      }
    ],
    procedureLink: '/procedures/ecm-sensor-calibration'
  },
  {
    id: 'solution-3',
    title: 'Fuel Line Pressure Test - Alternative Diagnosis',
    confidence: 'low' as const,
    source: {
      title: "Adam's Maintenance Log Note Document.pdf",
      page: 23,
      revision: '2024.2'
    },
    steps: [
      {
        text: 'Install pressure gauge at fuel rail test port using adapter kit.',
        type: 'normal' as const
      },
      {
        text: 'Start engine and monitor pressure during idle and load conditions.',
        type: 'normal' as const
      },
      {
        text: 'Pressure should remain stable - fluctuations indicate potential pump issues.',
        type: 'tip' as const
      }
    ],
    procedureLink: '/procedures/fuel-pressure-manual-test'
  }
];

export function DesktopMobileComparison() {
  // State management for expanded solutions (solution-1 expanded, others collapsed)
  const [desktopExpanded, setDesktopExpanded] = useState<Set<string>>(new Set(['solution-1']));
  const [mobileExpanded, setMobileExpanded] = useState<Set<string>>(new Set(['solution-1']));

  const handleDesktopToggle = (solutionId: string) => {
    const newExpanded = new Set(desktopExpanded);
    if (newExpanded.has(solutionId)) {
      newExpanded.delete(solutionId);
    } else {
      newExpanded.add(solutionId);
    }
    setDesktopExpanded(newExpanded);
  };

  const handleMobileToggle = (solutionId: string) => {
    const newExpanded = new Set(mobileExpanded);
    if (newExpanded.has(solutionId)) {
      newExpanded.delete(solutionId);
    } else {
      newExpanded.add(solutionId);
    }
    setMobileExpanded(newExpanded);
  };

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Title Header */}
      <div className="w-full py-8 px-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 font-display">
            Desktop vs Mobile Comparison Frame
          </h1>
          <p className="text-gray-600 font-text">
            Side-by-side validation of chat interface with AI answer cards (1 expanded, 2 collapsed)
          </p>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Desktop Version */}
          <div className="space-y-4">
            {/* Desktop Header */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 font-display">Desktop Version</h2>
                <p className="text-sm text-gray-600 font-text">760px max width, 24px padding</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600 font-text">Motion: 280ms expand / 200ms collapse</div>
                <div className="text-sm text-gray-500 font-text">Stagger: 60ms intervals</div>
              </div>
            </div>

            {/* Desktop Chat Container */}
            <div 
              className="border border-gray-200 rounded-xl overflow-hidden"
              style={{ 
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 1) 100%)' 
              }}
            >
              <div className="relative">
                {/* Desktop Chat Area Simulation */}
                <div className="relative flex-1">
                  <div className="h-14 border-b border-gray-100 flex items-center justify-center">
                    <span className="text-sm text-gray-500 font-text">Desktop Header (760px container)</span>
                  </div>
                  
                  <div className="mx-auto max-w-[760px]" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
                    <div className="flex flex-col" style={{ gap: '20px', paddingTop: '24px', paddingBottom: '24px' }}>
                      
                      {/* User Message */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm flex-shrink-0">
                          <span className="text-white text-sm font-medium">A</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-600 mb-1" style={{ fontSize: '14px', lineHeight: '20px', fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            You
                          </div>
                          <div 
                            className="bg-white border rounded-xl shadow-sm"
                            style={{
                              padding: '24px',
                              borderRadius: '12px',
                              borderColor: 'rgba(0, 0, 0, 0.08)',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)'
                            }}
                          >
                            <div style={{
                              fontSize: '16px',
                              lineHeight: '24px',
                              letterSpacing: '-0.32px',
                              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              color: '#374151'
                            }}>
                              I'm getting Error Code E-047 on the starboard main engine. What should I do?
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Response with Multi-Solution Card */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-600 mb-1" style={{ fontSize: '14px', lineHeight: '20px', fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            CelesteOS
                          </div>
                          
                          {/* AI Response Introduction */}
                          <div 
                            className="bg-white border rounded-xl shadow-sm mb-4"
                            style={{
                              padding: '24px',
                              borderRadius: '12px',
                              borderColor: 'rgba(0, 0, 0, 0.08)',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)'
                            }}
                          >
                            <div style={{
                              fontSize: '16px',
                              lineHeight: '24px',
                              letterSpacing: '-0.32px',
                              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              color: '#374151'
                            }}>
                              I found 3 potential solutions for Error Code E-047. The first solution has the highest confidence based on similar cases:
                            </div>
                          </div>

                          {/* Desktop AI Solution Card */}
                          <AISolutionCardLibrary
                            solutions={comparisonSolutions}
                            variant={{ mode: 'desktop', motion: 'default' }}
                            expandedSolutions={desktopExpanded}
                            onToggleSolution={handleDesktopToggle}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Validation Annotations */}
            <div className="space-y-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-medium text-green-800 font-text mb-1">✅ Desktop Validation Checks</div>
                <ul className="text-sm text-green-700 font-text space-y-1">
                  <li>• Container: 760px max width, 24px horizontal padding</li>
                  <li>• Typography: 18px titles, 16px body (Eloquia fonts)</li>
                  <li>• Spacing: 4px grid system (24px card padding)</li>
                  <li>• Glass blur: Only on expanded cards (backdrop-blur-sm)</li>
                  <li>• Badges: High=gradient, Medium=light blue, Low=grey</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Mobile Version */}
          <div className="space-y-4">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 font-display">Mobile Version</h2>
                <p className="text-sm text-gray-600 font-text">390px max width, 16px padding</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-orange-600 font-text">Motion: IDENTICAL timing</div>
                <div className="text-sm text-gray-500 font-text">Source: 20 char truncation</div>
              </div>
            </div>

            {/* Mobile Chat Container */}
            <div 
              className="border border-gray-200 rounded-xl overflow-hidden"
              style={{ 
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 1) 100%)' 
              }}
            >
              <div className="relative">
                {/* Mobile Chat Area Simulation */}
                <div className="relative flex-1">
                  <div className="h-20 border-b border-gray-100 flex items-center justify-center">
                    <span className="text-sm text-gray-500 font-text">Mobile Header (390px container)</span>
                  </div>
                  
                  <div className="mx-auto max-w-[390px]" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
                    <div className="flex flex-col" style={{ gap: '16px', paddingTop: '16px', paddingBottom: '16px' }}>
                      
                      {/* User Message */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-sm flex-shrink-0">
                          <span className="text-white text-sm font-medium">A</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-600 mb-1" style={{ fontSize: '14px', lineHeight: '20px', fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            You
                          </div>
                          <div 
                            className="bg-white border rounded-xl shadow-sm"
                            style={{
                              padding: '16px', // Mobile: 16px padding
                              borderRadius: '12px',
                              borderColor: 'rgba(0, 0, 0, 0.08)',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)'
                            }}
                          >
                            <div style={{
                              fontSize: '15px', // Mobile: 15px
                              lineHeight: '22px', // Mobile: 22px
                              letterSpacing: '-0.32px',
                              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              color: '#374151'
                            }}>
                              I'm getting Error Code E-047 on the starboard main engine. What should I do?
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Response with Multi-Solution Card */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-600 mb-1" style={{ fontSize: '14px', lineHeight: '20px', fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            CelesteOS
                          </div>
                          
                          {/* AI Response Introduction */}
                          <div 
                            className="bg-white border rounded-xl shadow-sm mb-4"
                            style={{
                              padding: '16px', // Mobile: 16px padding
                              borderRadius: '12px',
                              borderColor: 'rgba(0, 0, 0, 0.08)',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)'
                            }}
                          >
                            <div style={{
                              fontSize: '15px', // Mobile: 15px
                              lineHeight: '22px', // Mobile: 22px
                              letterSpacing: '-0.32px',
                              fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              color: '#374151'
                            }}>
                              I found 3 potential solutions for Error Code E-047. The first solution has the highest confidence based on similar cases:
                            </div>
                          </div>

                          {/* Mobile AI Solution Card */}
                          <AISolutionCardLibrary
                            solutions={comparisonSolutions}
                            variant={{ mode: 'mobile', motion: 'default' }}
                            expandedSolutions={mobileExpanded}
                            onToggleSolution={handleMobileToggle}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Validation Annotations */}
            <div className="space-y-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-medium text-green-800 font-text mb-1">✅ Mobile Validation Checks</div>
                <ul className="text-sm text-green-700 font-text space-y-1">
                  <li>• Container: 390px max width, 16px horizontal padding</li>
                  <li>• Typography: 16px titles, 15px body (responsive scaling)</li>
                  <li>• Spacing: 16px expanded/12px collapsed card padding</li>
                  <li>• Source truncation: "Adam's Maintenance L..."</li>
                  <li>• Footer: Vertical stacking, 16px bullet indent</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Platform Validation Summary */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-display">Cross-Platform Validation Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Motion Specifications */}
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2 font-text">Motion Specs</h4>
              <div className="text-sm text-gray-600 font-text space-y-1">
                <div>Expand: 280ms</div>
                <div>Collapse: 200ms</div>
                <div>Stagger: 60ms</div>
                <div>Easing: cubic-bezier</div>
              </div>
            </div>

            {/* Confidence Badge Colors */}
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2 font-text">Badge Colors</h4>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: 'linear-gradient(135deg, #0070FF 0%, #00A4FF 100%)' }}></div>
                  <span className="text-gray-600 font-text">High: Gradient</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-100"></div>
                  <span className="text-gray-600 font-text">Medium: Light blue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-100"></div>
                  <span className="text-gray-600 font-text">Low: Grey</span>
                </div>
              </div>
            </div>

            {/* Glass Blur States */}
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2 font-text">Glass Blur</h4>
              <div className="text-sm text-gray-600 font-text space-y-1">
                <div>✅ Expanded: backdrop-blur</div>
                <div>✅ Collapsed: No blur</div>
                <div>✅ Smooth transitions</div>
                <div>✅ Performance optimized</div>
              </div>
            </div>

            {/* Background Gradient */}
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2 font-text">Background</h4>
              <div className="text-sm text-gray-600 font-text space-y-1">
                <div>✅ White-on-white subtle</div>
                <div>✅ No content competition</div>
                <div>✅ Chat mode transition</div>
                <div>✅ Professional polish</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}