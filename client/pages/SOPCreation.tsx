/**
 * SOP Creation Page
 * Integrated into CelesteOS Bridge
 */

import React, { useState, useEffect } from 'react';
import { SOPCanvasEditor } from '../components/sop-editor/SOPCanvasEditor';
import { SOPStorage } from '../components/sop-editor/utils/storage';
import type { SOPData } from '../components/sop-editor/types/sop';

export const SOPCreationPage: React.FC = () => {
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
  }, []);

  const createNewSOP = () => {
    const newSOP: SOPData = {
      sop_id: 'sop_' + Date.now(),
      title: 'New Standard Operating Procedure',
      content_md: `
<h1>New Standard Operating Procedure</h1>

<h2>Overview</h2>
<p>Describe the purpose of this SOP...</p>

<h2>Safety Precautions</h2>
<ul>
  <li>List safety requirements</li>
  <li>Identify potential hazards</li>
  <li>Required protective equipment</li>
</ul>

<h2>Required Tools/Materials</h2>
<ul>
  <li>List all required tools</li>
  <li>List all required materials</li>
</ul>

<h2>Step-by-Step Procedure</h2>
<ol>
  <li>First step...</li>
  <li>Second step...</li>
  <li>Third step...</li>
</ol>

<h2>Testing & Verification</h2>
<p>Describe how to verify the procedure was completed correctly...</p>

<h2>Documentation</h2>
<p>Record all relevant information...</p>
      `.trim(),
      yacht_id: 'default_yacht',
      user_id: 'default_user',
      timestamp: new Date().toISOString(),
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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
      }}>
        <div>Loading SOP Editor...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 0'
    }}>
      <SOPCanvasEditor
        initialSOP={currentSOP}
        onSave={handleSave}
        onError={handleError}
      />
    </div>
  );
};

export default SOPCreationPage;
