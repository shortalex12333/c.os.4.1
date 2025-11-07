/**
 * SOP Creation Component - New Canvas Editor
 * ChatGPT-style editing interface with autosave and cloud sync
 */

import React, { useState, useEffect } from 'react';
import { SOPCanvasEditor } from './sop-editor/SOPCanvasEditor';
import { SOPStorage } from './sop-editor/utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { SOPData } from './sop-editor/types/sop';

export const SopCreation: React.FC = () => {
  const { user } = useAuth();
  const [currentSOP, setCurrentSOP] = useState<SOPData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing SOP or create new one
  useEffect(() => {
    const savedSOPs = SOPStorage.listAll();

    if (savedSOPs.length > 0) {
      // Load the most recent SOP
      const mostRecentId = savedSOPs[savedSOPs.length - 1];
      const loadedSOP = SOPStorage.load(mostRecentId);

      if (loadedSOP) {
        setCurrentSOP(loadedSOP);
      } else {
        createNewSOP();
      }
    } else {
      createNewSOP();
    }

    setIsLoading(false);
  }, [user]);

  const createNewSOP = () => {
    const newSOP: SOPData = {
      sop_id: 'sop_' + Date.now(),
      title: 'Navigation Light Replacement SOP',
      content_md: `
<h1>Standard Operating Procedure (SOP) for Navigation Light Replacement on Yacht</h1>

<h2>Title</h2>
<p>Navigation Light Replacement SOP</p>

<h2>Scope</h2>
<p>This document outlines the procedure to be followed when replacing navigation lights on a yacht. It includes detailed steps, necessary tools and materials, safety precautions, and references.</p>

<h2>Required Tools/Materials</h2>
<ul>
  <li>Replacement Navigation Lights</li>
  <li>Screwdrivers (Phillips & Slotted)</li>
  <li>Wire Strippers</li>
  <li>Electrical Tape</li>
  <li>Multimeter</li>
  <li>Ladder or Elevated Platform</li>
  <li>Safety Harnesses</li>
</ul>

<h2>Step-by-Step Procedure</h2>

<h3>1. Preparation</h3>
<ul>
  <li>Ensure all required tools and materials are available</li>
  <li>Review the electrical diagrams for the navigation lights to understand wiring connections</li>
</ul>

<h3>2. Safety Checks</h3>
<ul>
  <li>Confirm that the power supply to the navigation light circuit is disconnected</li>
  <li>Wear appropriate personal protective equipment (PPE) including safety glasses, gloves, and a hard hat if necessary</li>
</ul>

<h3>3. Disconnection of Old Light</h3>
<ul>
  <li>Locate the old navigation light fixture on the yacht's exterior</li>
  <li>Use screwdrivers to remove screws securing the light housing</li>
  <li>Disconnect electrical wiring using wire strippers carefully without damaging wires</li>
</ul>

<h3>4. Installation of New Light</h3>
<ul>
  <li>Carefully position the new navigation light in place, ensuring alignment with mounting points</li>
  <li>Reconnect electrical wiring according to the diagram and secure connections with electrical tape for safety</li>
  <li>Tighten screws securely but avoid over-tightening which could damage fixtures or wiring</li>
</ul>

<h3>5. Testing</h3>
<ul>
  <li>Restore power supply to the circuit</li>
  <li>Test operation of new navigation light using a multimeter to ensure proper functioning</li>
  <li>Verify that all connections are secure and there is no electrical leakage</li>
</ul>

<h3>6. Documentation</h3>
<ul>
  <li>Record details of replacement in maintenance logs, including date, part numbers used, and any issues encountered during installation</li>
</ul>

<h3>7. Final Inspection</h3>
<ul>
  <li>Conduct a final visual inspection to confirm the new light is correctly installed and operational</li>
  <li>Confirm that all safety measures are adhered to and report back to relevant departments for further action if necessary</li>
</ul>

<h2>Safety Warnings</h2>
<ul>
  <li>Always ensure power supply to electrical circuits is disconnected before commencing work on navigation lights</li>
  <li>Use appropriate PPE at all times during installation</li>
  <li>Ensure proper grounding of tools and equipment to avoid electric shock risks</li>
  <li>Report any issues or delays immediately to the relevant department for prompt resolution</li>
</ul>

<h2>References</h2>
<ul>
  <li>Electrical Diagrams for Navigation Lights</li>
  <li>Maintenance Logs</li>
  <li>Vendor Documentation for Replacement Parts</li>
</ul>

<p><strong>Note:</strong> This SOP is designed to ensure that navigation light replacements are carried out safely and efficiently, minimizing downtime and ensuring compliance with safety standards.</p>
      `.trim(),
      yacht_id: user?.yacht_id || 'default_yacht',
      user_id: user?.id || 'default_user',
      timestamp: new Date().toISOString(),
      version: 1
    };

    SOPStorage.save(newSOP);
    setCurrentSOP(newSOP);
  };

  const handleSave = (sop: SOPData) => {
    console.log('💾 SOP autosaved:', sop.sop_id);
  };

  const handleError = (error: string) => {
    console.error('❌ Editor error:', error);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading SOP Editor...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <SOPCanvasEditor
        initialSOP={currentSOP}
        onSave={handleSave}
        onError={handleError}
      />
    </div>
  );
};

export default SopCreation;
