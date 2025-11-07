/**
 * Yacht Document Generator
 * Creates realistic maritime technical documents for testing
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Realistic yacht equipment and systems
const YACHT_SYSTEMS = {
  engines: {
    manufacturers: ['CAT', 'MTU', 'MAN', 'Cummins', 'Volvo Penta'],
    models: {
      'CAT': ['3512C', 'C32 ACERT', 'C18 ACERT', '3408', 'C12'],
      'MTU': ['2000 M72', '4000 M93L', '16V 2000 M96L', '12V 4000'],
      'MAN': ['V12-1900', 'V12-1550', 'V8-1200', 'V12-1800'],
      'Cummins': ['QSM11', 'QSK38-M', 'QSK60-M', 'QSB6.7'],
      'Volvo Penta': ['D13-900', 'IPS1200', 'D16-MH', 'IPS1350']
    },
    faults: [
      'Cooling system overheat', 'Low oil pressure', 'Turbocharger failure',
      'Fuel injection malfunction', 'Exhaust gas temperature high',
      'Vibration excessive', 'Starting failure', 'Governor instability'
    ]
  },
  generators: {
    manufacturers: ['Northern Lights', 'Kohler', 'Onan', 'Fischer Panda', 'Westerbeke'],
    models: {
      'Northern Lights': ['M944T', 'M1066A', 'M1276T', 'M20CR'],
      'Kohler': ['40EOZD', '65EOZD', '99EOZD', '150EOZD'],
      'Onan': ['21.5MDKBP', '27MDKBR', '40MDKBL', 'e-QD 8000'],
      'Fischer Panda': ['45-4 PMS', 'AGT-DC 8000', 'iSeries 8000i'],
      'Westerbeke': ['22.0 SBEGA', '33.0 SBEGA', '55.0 SBEGA']
    },
    faults: [
      'Voltage regulation failure', 'Frequency instability', 'Overload trip',
      'Cooling pump failure', 'AVR malfunction', 'Phase imbalance',
      'Ground fault', 'Bearing overheat'
    ]
  },
  hydraulics: {
    components: ['Steering pumps', 'Stabilizer actuators', 'Crane systems', 'Passerelle', 'Swim platform'],
    manufacturers: ['Naiad', 'ABT-TRAC', 'Quantum', 'Kobelt', 'Maxwell'],
    faults: [
      'Pressure loss', 'Fluid contamination', 'Cylinder leakage',
      'Pump cavitation', 'Relief valve stuck', 'Temperature excessive',
      'Filter clogged', 'Accumulator failure'
    ]
  },
  electrical: {
    systems: ['Shore power converters', 'Battery banks', 'Inverters', 'UPS systems', 'Distribution panels'],
    manufacturers: ['Victron', 'Mastervolt', 'Atlas', 'Charles', 'Xantrex'],
    faults: [
      'Ground fault detected', 'Phase loss', 'Voltage imbalance',
      'Insulation breakdown', 'Breaker trip', 'Harmonic distortion',
      'Power factor low', 'Neutral current high'
    ]
  },
  hvac: {
    systems: ['Chilled water', 'Air handlers', 'Compressors', 'Fan coils'],
    manufacturers: ['Dometic', 'Webasto', 'Condaria', 'Frigomar', 'HEM'],
    faults: [
      'Refrigerant leak', 'Compressor lockout', 'Flow switch fault',
      'Temperature sensor failure', 'Condenser blocked', 'Evaporator frozen',
      'Control board failure', 'Pump failure'
    ]
  },
  navigation: {
    systems: ['Radar', 'GPS', 'AIS', 'Autopilot', 'ECDIS', 'VHF'],
    manufacturers: ['Furuno', 'Garmin', 'Raymarine', 'Simrad', 'B&G'],
    faults: [
      'GPS signal loss', 'Radar magnetron failure', 'Compass deviation',
      'AIS transponder offline', 'Autopilot hydraulic leak', 'ECDIS freeze',
      'Antenna VSWR high', 'Heading sensor drift'
    ]
  },
  watermakers: {
    manufacturers: ['Sea Recovery', 'Idromar', 'HEM', 'Village Marine', 'FCI'],
    capacity: ['600 GPD', '1200 GPD', '1800 GPD', '2400 GPD', '3600 GPD'],
    faults: [
      'High pressure pump failure', 'Membrane fouling', 'Salinity high',
      'Pre-filter clogged', 'Boost pump cavitation', 'Flow meter error',
      'Flush valve stuck', 'Control system fault'
    ]
  }
};

// Folder structure matching real yacht documentation
const FOLDER_STRUCTURE = {
  '01_BRIDGE': ['Navigation', 'Communication', 'Safety_Systems', 'GMDSS'],
  '02_ENGINE_ROOM': ['Main_Engines', 'Generators', 'Auxiliary_Systems', 'Fuel_Systems'],
  '03_ELECTRICAL': ['Power_Distribution', 'Shore_Power', 'Emergency_Systems', 'Lighting'],
  '04_HYDRAULICS': ['Steering', 'Stabilizers', 'Cranes', 'Deck_Equipment'],
  '05_HVAC': ['Air_Conditioning', 'Ventilation', 'Refrigeration', 'Fresh_Air'],
  '06_WATER_SYSTEMS': ['Watermakers', 'Black_Water', 'Grey_Water', 'Potable_Water'],
  '07_SAFETY': ['Fire_Fighting', 'Life_Saving', 'SOLAS', 'Emergency_Procedures'],
  '08_DECK': ['Anchoring', 'Mooring', 'Tenders', 'Crane_Operations'],
  '09_AUTOMATION': ['Alarm_Systems', 'Monitoring', 'PLC', 'SCADA'],
  '10_MAINTENANCE': ['Planned_Maintenance', 'Spare_Parts', 'Service_Schedules', 'Logs']
};

class YachtDocumentGenerator {
  constructor() {
    this.baseDir = path.join(process.cwd(), 'test-yacht-docs');
    this.documentCount = 0;
  }

  /**
   * Initialize folder structure
   */
  async initializeFolders() {
    console.log('📁 Creating yacht documentation structure...');
    
    // Create base directory
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }

    // Create department folders and subfolders
    for (const [dept, subfolders] of Object.entries(FOLDER_STRUCTURE)) {
      const deptPath = path.join(this.baseDir, dept);
      fs.mkdirSync(deptPath, { recursive: true });
      
      for (const subfolder of subfolders) {
        const subPath = path.join(deptPath, subfolder);
        fs.mkdirSync(subPath, { recursive: true });
      }
    }

    console.log('✅ Folder structure created');
  }

  /**
   * Generate a realistic PDF document
   */
  async generatePDF(filePath, title, content, metadata) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        info: {
          Title: title,
          Author: 'CelesteOS Yacht Systems',
          Subject: metadata.system,
          Keywords: metadata.keywords.join(', ')
        }
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text(title, 50, 50);
      doc.fontSize(10).font('Helvetica').text(`Document ID: ${metadata.docId}`, 50, 100);
      doc.text(`System: ${metadata.system}`, 50, 115);
      doc.text(`Equipment: ${metadata.equipment}`, 50, 130);
      doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, 50, 145);
      
      // Draw line
      doc.moveTo(50, 170).lineTo(550, 170).stroke();
      
      // Fault Information
      doc.fontSize(16).font('Helvetica-Bold').text('FAULT INFORMATION', 50, 200);
      doc.fontSize(12).font('Helvetica').text(`Fault Code: ${metadata.faultCode}`, 50, 230);
      doc.fontSize(11).text(`Description: ${metadata.faultDescription}`, 50, 250, {
        width: 500,
        align: 'justify'
      });

      // Symptoms
      doc.fontSize(14).font('Helvetica-Bold').text('SYMPTOMS', 50, 320);
      doc.fontSize(11).font('Helvetica');
      let yPos = 350;
      metadata.symptoms.forEach(symptom => {
        doc.text(`• ${symptom}`, 70, yPos);
        yPos += 20;
      });

      // Troubleshooting Steps
      doc.fontSize(14).font('Helvetica-Bold').text('TROUBLESHOOTING PROCEDURE', 50, yPos + 30);
      yPos += 60;
      doc.fontSize(11).font('Helvetica');
      metadata.troubleshooting.forEach((step, index) => {
        doc.text(`${index + 1}. ${step}`, 70, yPos, { width: 480 });
        yPos += 40;
        
        // Add new page if needed
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      });

      // Solutions
      doc.fontSize(14).font('Helvetica-Bold').text('SOLUTIONS', 50, yPos + 30);
      yPos += 60;
      doc.fontSize(11).font('Helvetica');
      metadata.solutions.forEach((solution, index) => {
        doc.text(`${index + 1}. ${solution}`, 70, yPos, { width: 480 });
        yPos += 30;
        
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      });

      // Parts Required
      if (metadata.partsRequired.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('PARTS REQUIRED', 50, yPos + 30);
        yPos += 60;
        doc.fontSize(11).font('Helvetica');
        metadata.partsRequired.forEach(part => {
          doc.text(`• ${part}`, 70, yPos);
          yPos += 20;
        });
      }

      // Technical Notes
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('TECHNICAL NOTES', 50, 50);
      doc.fontSize(10).font('Helvetica').text(content, 50, 80, {
        width: 500,
        align: 'justify'
      });

      // Footer on last page only
      doc.fontSize(8).font('Helvetica')
        .text(`Confidential - ${metadata.manufacturer} Technical Documentation`, 50, 750)
        .text(`Page 1`, 500, 750);

      doc.end();
      
      stream.on('finish', () => {
        this.documentCount++;
        resolve(filePath);
      });
      
      stream.on('error', reject);
    });
  }

  /**
   * Generate fault scenario documents
   */
  async generateFaultDocuments() {
    console.log('📝 Generating yacht fault documentation...');
    
    const documents = [];
    
    // Generate engine fault documents
    for (const manufacturer of YACHT_SYSTEMS.engines.manufacturers) {
      const models = YACHT_SYSTEMS.engines.models[manufacturer] || ['Generic'];
      
      for (const model of models) {
        for (const fault of YACHT_SYSTEMS.engines.faults) {
          const docId = `ENG-${manufacturer.toUpperCase()}-${this.documentCount.toString().padStart(4, '0')}`;
          const faultCode = `${manufacturer.substring(0, 3).toUpperCase()}-${model.replace(/\s/g, '')}-${Math.floor(Math.random() * 999)}`;
          
          const metadata = {
            docId,
            system: 'Main Engines',
            manufacturer,
            equipment: `${manufacturer} ${model}`,
            faultCode,
            faultDescription: `${fault} detected on ${manufacturer} ${model} engine`,
            symptoms: this.generateSymptoms(fault),
            troubleshooting: this.generateTroubleshooting(fault, 'engine'),
            solutions: this.generateSolutions(fault, 'engine'),
            partsRequired: this.generateParts(manufacturer, 'engine'),
            keywords: [manufacturer, model, fault, 'engine', 'propulsion', faultCode]
          };

          const title = `${manufacturer} ${model} - ${fault}`;
          const content = this.generateTechnicalContent(manufacturer, model, fault);
          
          const filename = `${docId}_${fault.replace(/\s/g, '_')}.pdf`;
          const filepath = path.join(this.baseDir, '02_ENGINE_ROOM', 'Main_Engines', filename);
          
          await this.generatePDF(filepath, title, content, metadata);
          documents.push({ filepath, metadata });
          
          // Limit to reasonable number
          if (this.documentCount >= 20) break;
        }
        if (this.documentCount >= 20) break;
      }
      if (this.documentCount >= 20) break;
    }

    // Generate generator fault documents
    for (const manufacturer of YACHT_SYSTEMS.generators.manufacturers) {
      const models = YACHT_SYSTEMS.generators.models[manufacturer] || ['Generic'];
      
      for (const model of models.slice(0, 2)) {
        for (const fault of YACHT_SYSTEMS.generators.faults.slice(0, 3)) {
          const docId = `GEN-${manufacturer.toUpperCase()}-${this.documentCount.toString().padStart(4, '0')}`;
          const faultCode = `GEN-${manufacturer.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 999)}`;
          
          const metadata = {
            docId,
            system: 'Generators',
            manufacturer,
            equipment: `${manufacturer} ${model}`,
            faultCode,
            faultDescription: `${fault} on ${manufacturer} ${model} generator`,
            symptoms: this.generateSymptoms(fault),
            troubleshooting: this.generateTroubleshooting(fault, 'generator'),
            solutions: this.generateSolutions(fault, 'generator'),
            partsRequired: this.generateParts(manufacturer, 'generator'),
            keywords: [manufacturer, model, fault, 'generator', 'power', faultCode]
          };

          const title = `${manufacturer} ${model} Generator - ${fault}`;
          const content = this.generateTechnicalContent(manufacturer, model, fault);
          
          const filename = `${docId}_${fault.replace(/\s/g, '_')}.pdf`;
          const filepath = path.join(this.baseDir, '02_ENGINE_ROOM', 'Generators', filename);
          
          await this.generatePDF(filepath, title, content, metadata);
          documents.push({ filepath, metadata });
          
          if (this.documentCount >= 35) break;
        }
        if (this.documentCount >= 35) break;
      }
      if (this.documentCount >= 35) break;
    }

    // Generate HVAC documents
    for (const manufacturer of YACHT_SYSTEMS.hvac.manufacturers.slice(0, 3)) {
      for (const fault of YACHT_SYSTEMS.hvac.faults.slice(0, 3)) {
        const docId = `HVAC-${manufacturer.toUpperCase()}-${this.documentCount.toString().padStart(4, '0')}`;
        const faultCode = `AC-${Math.floor(Math.random() * 999)}`;
        
        const metadata = {
          docId,
          system: 'HVAC',
          manufacturer,
          equipment: `${manufacturer} Chilled Water System`,
          faultCode,
          faultDescription: `${fault} in ${manufacturer} HVAC system`,
          symptoms: this.generateSymptoms(fault),
          troubleshooting: this.generateTroubleshooting(fault, 'hvac'),
          solutions: this.generateSolutions(fault, 'hvac'),
          partsRequired: this.generateParts(manufacturer, 'hvac'),
          keywords: [manufacturer, fault, 'hvac', 'air conditioning', 'climate', faultCode]
        };

        const title = `${manufacturer} HVAC - ${fault}`;
        const content = this.generateTechnicalContent(manufacturer, 'HVAC System', fault);
        
        const filename = `${docId}_${fault.replace(/\s/g, '_')}.pdf`;
        const filepath = path.join(this.baseDir, '05_HVAC', 'Air_Conditioning', filename);
        
        await this.generatePDF(filepath, title, content, metadata);
        documents.push({ filepath, metadata });
        
        if (this.documentCount >= 45) break;
      }
      if (this.documentCount >= 45) break;
    }

    // Generate navigation system documents
    for (const manufacturer of YACHT_SYSTEMS.navigation.manufacturers.slice(0, 2)) {
      for (const fault of YACHT_SYSTEMS.navigation.faults.slice(0, 2)) {
        const docId = `NAV-${manufacturer.toUpperCase()}-${this.documentCount.toString().padStart(4, '0')}`;
        const faultCode = `NAV-${Math.floor(Math.random() * 999)}`;
        
        const metadata = {
          docId,
          system: 'Navigation',
          manufacturer,
          equipment: `${manufacturer} Navigation Suite`,
          faultCode,
          faultDescription: `${fault} in ${manufacturer} system`,
          symptoms: this.generateSymptoms(fault),
          troubleshooting: this.generateTroubleshooting(fault, 'navigation'),
          solutions: this.generateSolutions(fault, 'navigation'),
          partsRequired: this.generateParts(manufacturer, 'navigation'),
          keywords: [manufacturer, fault, 'navigation', 'bridge', 'electronics', faultCode]
        };

        const title = `${manufacturer} Navigation - ${fault}`;
        const content = this.generateTechnicalContent(manufacturer, 'Navigation System', fault);
        
        const filename = `${docId}_${fault.replace(/\s/g, '_')}.pdf`;
        const filepath = path.join(this.baseDir, '01_BRIDGE', 'Navigation', filename);
        
        await this.generatePDF(filepath, title, content, metadata);
        documents.push({ filepath, metadata });
        
        if (this.documentCount >= 50) break;
      }
      if (this.documentCount >= 50) break;
    }

    console.log(`✅ Generated ${this.documentCount} technical documents`);
    return documents;
  }

  /**
   * Generate realistic symptoms based on fault type
   */
  generateSymptoms(fault) {
    const symptomMap = {
      'overheat': ['Temperature gauge reading above normal', 'Steam from engine room', 'Automatic shutdown triggered', 'High temperature alarm active'],
      'pressure': ['Pressure gauge fluctuating', 'Unusual noise from system', 'Performance degradation', 'Warning lights illuminated'],
      'failure': ['Complete system shutdown', 'No response to controls', 'Circuit breaker tripped', 'Error codes displayed'],
      'leak': ['Visible fluid on deck plates', 'Low fluid level warning', 'Pressure dropping gradually', 'Staining on equipment'],
      'electrical': ['Intermittent operation', 'Burning smell detected', 'Voltage readings unstable', 'Ground fault indicator active']
    };

    for (const [key, symptoms] of Object.entries(symptomMap)) {
      if (fault.toLowerCase().includes(key)) {
        return symptoms;
      }
    }

    return [
      'System operating outside normal parameters',
      'Abnormal sounds during operation',
      'Warning indicators active',
      'Performance below specifications'
    ];
  }

  /**
   * Generate troubleshooting steps
   */
  generateTroubleshooting(fault, system) {
    const baseSteps = [
      'Verify alarm is genuine and not a sensor fault',
      'Check system status on main control panel',
      'Record all active alarms and fault codes',
      'Isolate the system following safety procedures'
    ];

    const systemSpecific = {
      'engine': [
        'Check engine room ventilation is operational',
        'Verify sea water cooling pumps are running',
        'Inspect heat exchanger for blockage',
        'Check coolant levels and condition',
        'Test thermostat operation',
        'Verify raw water strainer is clean'
      ],
      'generator': [
        'Check load bank readings',
        'Verify AVR settings and operation',
        'Test governor response',
        'Check fuel supply pressure',
        'Inspect air filter condition',
        'Verify ground fault protection'
      ],
      'hvac': [
        'Check refrigerant sight glass',
        'Verify compressor operation',
        'Test expansion valve',
        'Check condenser coil condition',
        'Verify chilled water flow',
        'Test control system sensors'
      ],
      'navigation': [
        'Check antenna connections',
        'Verify power supply voltage',
        'Test backup systems',
        'Check GPS signal strength',
        'Verify compass calibration',
        'Test data bus communication'
      ]
    };

    return [...baseSteps, ...(systemSpecific[system] || [])];
  }

  /**
   * Generate solutions
   */
  generateSolutions(fault, system) {
    const commonSolutions = [
      'Reset system following manufacturer procedures',
      'Replace faulty sensor if identified',
      'Clean and service affected components',
      'Update system firmware if available'
    ];

    if (fault.toLowerCase().includes('overheat')) {
      return [
        'Clean heat exchanger cores with approved chemicals',
        'Replace thermostat if stuck closed',
        'Service raw water pump impeller',
        'Flush cooling system and refill with correct coolant mixture',
        ...commonSolutions
      ];
    }

    if (fault.toLowerCase().includes('pressure')) {
      return [
        'Replace pressure relief valve if faulty',
        'Service or replace pump as required',
        'Check and tighten all connections',
        'Replace filters and strainers',
        ...commonSolutions
      ];
    }

    return commonSolutions;
  }

  /**
   * Generate parts list
   */
  generateParts(manufacturer, system) {
    const parts = {
      'engine': [
        `${manufacturer} Thermostat Kit (P/N: THM-${Math.floor(Math.random() * 9999)})`,
        `Raw Water Impeller (P/N: IMP-${Math.floor(Math.random() * 9999)})`,
        `Coolant Temperature Sensor (P/N: CTS-${Math.floor(Math.random() * 9999)})`,
        `Heat Exchanger Gasket Set (P/N: HEG-${Math.floor(Math.random() * 9999)})`
      ],
      'generator': [
        `${manufacturer} AVR Module (P/N: AVR-${Math.floor(Math.random() * 9999)})`,
        `Governor Control Unit (P/N: GOV-${Math.floor(Math.random() * 9999)})`,
        `Voltage Regulator (P/N: VRG-${Math.floor(Math.random() * 9999)})`
      ],
      'hvac': [
        `Expansion Valve (P/N: EXV-${Math.floor(Math.random() * 9999)})`,
        `Compressor Contactor (P/N: COM-${Math.floor(Math.random() * 9999)})`,
        `Temperature Sensor (P/N: TMP-${Math.floor(Math.random() * 9999)})`
      ],
      'navigation': [
        `GPS Antenna (P/N: GPS-${Math.floor(Math.random() * 9999)})`,
        `Display Unit (P/N: DSP-${Math.floor(Math.random() * 9999)})`,
        `Power Supply Module (P/N: PSM-${Math.floor(Math.random() * 9999)})`
      ]
    };

    return parts[system] || [`Generic Replacement Part (P/N: GEN-${Math.floor(Math.random() * 9999)})`];
  }

  /**
   * Generate technical content
   */
  generateTechnicalContent(manufacturer, model, fault) {
    return `
TECHNICAL BACKGROUND:
The ${manufacturer} ${model} is a critical component of the yacht's operational systems. This document provides comprehensive troubleshooting procedures for addressing ${fault} conditions.

SYSTEM SPECIFICATIONS:
- Manufacturer: ${manufacturer}
- Model: ${model}
- Operating Temperature Range: -10°C to +50°C
- Service Interval: 250 hours or 6 months
- Expected Service Life: 20,000 hours

THEORY OF OPERATION:
The ${model} operates on established marine engineering principles, utilizing redundant safety systems and fail-safe mechanisms to ensure reliable operation in marine environments. When a ${fault} condition occurs, the system's protective circuits activate to prevent damage to critical components.

SAFETY CONSIDERATIONS:
1. Always follow lockout/tagout procedures
2. Ensure proper ventilation before entering machinery spaces
3. Use appropriate PPE including hearing protection
4. Verify system is de-energized before maintenance
5. Follow confined space entry procedures if applicable

PREVENTIVE MAINTENANCE:
Regular maintenance is crucial for preventing ${fault} conditions. Key maintenance tasks include:
- Daily: Visual inspection and log readings
- Weekly: Check fluid levels and operating parameters
- Monthly: Clean filters and strainers
- Quarterly: Full system inspection and testing
- Annually: Complete overhaul and component replacement

ENVIRONMENTAL CONDITIONS:
Marine environments present unique challenges including salt air corrosion, vibration, and temperature extremes. The ${manufacturer} ${model} is designed to withstand these conditions when properly maintained.

SPARE PARTS INVENTORY:
Maintain adequate spare parts inventory based on manufacturer recommendations and operational history. Critical spares should be available on board at all times.

DOCUMENTATION:
All maintenance activities must be logged in the vessel's maintenance management system. Include date, time, personnel, actions taken, and parts used.

TECHNICAL SUPPORT:
For additional assistance, contact ${manufacturer} technical support:
- 24/7 Hotline: +1-800-YACHT-TECH
- Email: support@${manufacturer.toLowerCase().replace(/\s/g, '')}.com
- Remote diagnostics available via satellite link

This document is proprietary and confidential. Distribution is limited to authorized personnel only.
    `.trim();
  }

  /**
   * Create JSON index of all documents
   */
  async createDocumentIndex(documents) {
    const index = {
      created: new Date().toISOString(),
      totalDocuments: documents.length,
      systems: {},
      faultCodes: {},
      manufacturers: {},
      keywords: {},
      documents: documents.map(doc => ({
        path: path.relative(this.baseDir, doc.filepath),
        ...doc.metadata
      }))
    };

    // Build indices
    documents.forEach(doc => {
      // By system
      if (!index.systems[doc.metadata.system]) {
        index.systems[doc.metadata.system] = [];
      }
      index.systems[doc.metadata.system].push(doc.metadata.docId);

      // By fault code
      index.faultCodes[doc.metadata.faultCode] = doc.metadata.docId;

      // By manufacturer
      if (!index.manufacturers[doc.metadata.manufacturer]) {
        index.manufacturers[doc.metadata.manufacturer] = [];
      }
      index.manufacturers[doc.metadata.manufacturer].push(doc.metadata.docId);

      // By keywords
      doc.metadata.keywords.forEach(keyword => {
        if (!index.keywords[keyword]) {
          index.keywords[keyword] = [];
        }
        index.keywords[keyword].push(doc.metadata.docId);
      });
    });

    const indexPath = path.join(this.baseDir, 'document_index.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    
    console.log(`📚 Document index created: ${indexPath}`);
    return index;
  }
}

// Run generator if executed directly
if (require.main === module) {
  const generator = new YachtDocumentGenerator();
  
  console.log('🚢 Yacht Document Generator');
  console.log('===========================');
  console.log('This will generate realistic yacht technical documentation');
  console.log('');
  
  (async () => {
    try {
      // Install pdfkit if not present
      try {
        require.resolve('pdfkit');
      } catch {
        console.log('📦 Installing PDFKit...');
        require('child_process').execSync('npm install pdfkit', { stdio: 'inherit' });
      }

      await generator.initializeFolders();
      const documents = await generator.generateFaultDocuments();
      const index = await generator.createDocumentIndex(documents);
      
      console.log('\n✅ Document generation complete!');
      console.log(`📁 Location: ${generator.baseDir}`);
      console.log(`📄 Total documents: ${documents.length}`);
      console.log(`📊 Systems covered: ${Object.keys(index.systems).join(', ')}`);
      
    } catch (error) {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = YachtDocumentGenerator;