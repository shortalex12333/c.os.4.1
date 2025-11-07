/**
 * Generate Fake Yacht Manual Content for Testing
 * Creates realistic yacht documentation that AI can use for fault resolution
 */

export interface FakeManual {
  filename: string;
  path: string;
  content: string;
  category: string;
  size: string;
}

// Generate realistic yacht manual content
export const generateFakeManuals = (): FakeManual[] => {
  return [
    // 01_BRIDGE - Navigation
    {
      filename: "ECDIS_Furuno_Manual.pdf",
      path: "01_BRIDGE/Navigation/ECDIS",
      category: "Navigation",
      size: "25MB",
      content: `FURUNO ECDIS FMD-3200 OPERATION MANUAL

FAULT CODE E001: GPS Signal Lost
SOLUTION: Check antenna connections, verify GPS receiver power, restart ECDIS system.
Procedure:
1. Navigate to System Status screen
2. Check GPS1 and GPS2 status indicators
3. If red, check cable connections at antenna base
4. Power cycle GPS receiver (switch off 30 seconds, power on)
5. System should acquire signal within 5 minutes

FAULT CODE E002: Chart Data Corruption
SOLUTION: Reinstall chart data from backup media
1. Insert original chart CD/DVD
2. Navigate to Chart Management > Install Charts
3. Select corrupted chart area
4. Choose "Replace Existing"
5. Installation takes 15-30 minutes per chart cell

FAULT CODE E003: Display Calibration Error
SOLUTION: Recalibrate touch screen interface
Touch Settings > Calibration > Follow on-screen prompts
System will display 5 target points for calibration

COMMON ISSUES:
- Slow chart loading: Increase chart cache size in System Settings
- Radar overlay misalignment: Check radar heading input and gyro compass
- AIS targets not displaying: Verify AIS receiver connection to ECDIS`
    },

    {
      filename: "VHF_GMDSS_Sailor6222.pdf", 
      path: "01_BRIDGE/Communications/Radio",
      category: "Communications",
      size: "25MB",
      content: `SAILOR 6222 VHF RADIO OPERATION MANUAL

FAULT: No transmission possible
SYMPTOMS: PTT button pressed but no TX indicator
SOLUTION:
1. Check antenna SWR - should be below 2:1
2. Verify power supply voltage 24VDC ±10%
3. Check microphone connection
4. Inspect antenna cable for damage
5. Test with emergency handheld radio

FAULT: Poor reception quality
SYMPTOMS: Weak or distorted audio
SOLUTION:
1. Check squelch setting - adjust to eliminate noise
2. Inspect antenna installation height and clearance
3. Verify antenna grounding system
4. Check for interference from radar/electronics

DISTRESS BUTTON PROCEDURE:
1. Lift red cover on DISTRESS button
2. Press and hold for 5 seconds
3. System automatically transmits:
   - DSC Distress alert on Channel 70
   - Voice Mayday on Channel 16
4. Acknowledge alarms and provide details

CHANNEL FREQUENCIES:
- Channel 16: 156.800 MHz (Distress/Safety)
- Channel 06: 156.300 MHz (Ship-Ship Safety)  
- Channel 13: 156.650 MHz (Navigation/Bridge)
- Channel 09: 156.450 MHz (Commercial/Pilot)

WEEKLY TEST PROCEDURE:
Every Monday 0800hrs test all functions:
1. Power-on self test
2. Transmit test on working channel
3. DSC test (not distress)
4. Audio level check
5. Battery backup test (if fitted)`
    },

    // 02_ENGINEERING - Main Engines
    {
      filename: "CAT_3512C_Manual_Complete.pdf",
      path: "02_ENGINEERING/Main_Engines/Port_Engine", 
      category: "Main Engines",
      size: "150MB",
      content: `CATERPILLAR 3512C MARINE ENGINE SERVICE MANUAL

ENGINE FAULT CODE 190-11: High Engine Coolant Temperature
CAUSE: Cooling system failure, low coolant, blocked heat exchanger
IMMEDIATE ACTION:
1. Reduce engine load immediately
2. Check coolant level in expansion tank
3. Verify seawater flow through heat exchanger
4. Check for leaks in cooling system
5. If temperature exceeds 104°C, SHUT DOWN ENGINE

TROUBLESHOOTING STEPS:
1. Check seawater strainer - clean if blocked
2. Inspect seawater pump impeller
3. Check thermostat operation (opens at 82°C)
4. Verify heat exchanger cleanliness
5. Test cooling fan operation (if fitted)
6. Check cylinder head gasket integrity

ENGINE FAULT CODE 153-03: High Crankcase Pressure  
CAUSE: Worn piston rings, blocked crankcase breather
SOLUTION:
1. Check crankcase breather filter - clean/replace
2. Inspect breather valve operation
3. Perform compression test on all cylinders
4. Check for blow-by at oil filler cap
5. May require piston ring replacement if severe

DAILY CHECKS (Every 8 hours operation):
- Engine oil level (dipstick)
- Coolant level (expansion tank)
- Seawater strainer condition
- Belt tension and condition
- Engine room bilge inspection
- Oil pressure at idle: 207-345 kPa (30-50 psi)
- Oil pressure at rated speed: 414-552 kPa (60-80 psi)

FUEL SYSTEM BLEEDING PROCEDURE:
Required after fuel filter change or running out of fuel:
1. Fill fuel filters completely before installation
2. Operate priming pump until firm
3. Open bleed screw on top of fuel filter housing
4. Pump until bubble-free fuel flows
5. Tighten bleed screw
6. Start engine - may run rough initially
7. Check for fuel leaks after 30 minutes operation

OIL CHANGE PROCEDURE (Every 500 hours):
1. Warm engine to operating temperature
2. Stop engine and wait 15 minutes
3. Remove drain plug - oil capacity 45 liters
4. Replace oil filter
5. Refill with CAT DEO-ULS 15W-40
6. Run engine 5 minutes and check for leaks
7. Check oil level after cool-down`
    },

    {
      filename: "Generator_1_Northern_Lights_155kW.pdf",
      path: "02_ENGINEERING/Generators",
      category: "Generators", 
      size: "60MB",
      content: `NORTHERN LIGHTS 155kW MARINE GENERATOR MANUAL

FAULT: Generator won't start
TROUBLESHOOTING CHECKLIST:
1. Check fuel level in day tank
2. Verify 24V battery voltage (minimum 22V)
3. Check engine oil level
4. Ensure coolant level adequate  
5. Check for engine fault codes on display
6. Verify generator breaker is OPEN
7. Test start/stop switch function

FAULT: Generator starts but won't take load
SYMPTOMS: Engine runs, no power output
SOLUTION:
1. Check generator breaker position
2. Verify voltage output at panel (should be 400V 3-phase)
3. Check excitation system
4. Inspect slip rings and brushes
5. Test AVR (Automatic Voltage Regulator)
6. Check phase rotation

HIGH WATER TEMPERATURE ALARM:
CAUSES:
- Seawater pump failure
- Blocked seawater strainer  
- Heat exchanger fouling
- Low coolant level
- Thermostat stuck closed

IMMEDIATE ACTIONS:
1. Check seawater flow at exhaust outlet
2. Inspect seawater strainer
3. Check coolant expansion tank level
4. If over 95°C, reduce load or shut down

LOW OIL PRESSURE ALARM:
NORMAL PRESSURE: 2.1-4.8 bar (30-70 psi)
CAUSES:
- Low oil level
- Oil pump failure
- Worn engine bearings
- Blocked oil filter
- Wrong oil viscosity

EMERGENCY SHUTDOWN CONDITIONS:
- High engine temperature (>100°C)
- Low oil pressure (<1.4 bar)
- Overspeed (>1950 RPM)
- High exhaust temperature (>650°C)

WEEKLY MAINTENANCE (Every 50 hours):
1. Check engine oil level
2. Check coolant level
3. Clean seawater strainer
4. Test emergency stop function
5. Check battery electrolyte level
6. Inspect belts for wear/tension
7. Check exhaust system for leaks
8. Test automatic start function`
    },

    // 03_ELECTRICAL
    {
      filename: "Switchboard_Siemens_Manual.pdf",
      path: "03_ELECTRICAL/Power_Distribution/Main_Switchboard",
      category: "Electrical",
      size: "80MB", 
      content: `SIEMENS MAIN SWITCHBOARD OPERATION MANUAL

FAULT: Generator breaker won't close
POSSIBLE CAUSES:
1. Voltage mismatch between generator and busbar
2. Frequency difference >0.5Hz
3. Phase rotation incorrect
4. Synchronizing system failure
5. Mechanical interlock engaged

SOLUTION STEPS:
1. Check generator voltage = 400V ±5%
2. Check frequency = 50Hz ±0.5Hz  
3. Verify phase sequence using rotation meter
4. Check synchroscope for proper rotation
5. Ensure shore power breaker is open
6. Reset any tripped protection relays

FAULT: Shore power won't connect
SYMPTOMS: Shore power available but breaker won't close
TROUBLESHOOTING:
1. Check shore power voltage and frequency
2. Verify phase rotation matches ship
3. Check earth fault protection
4. Ensure generators are offline
5. Test shore power transformer

BLACKOUT RECOVERY PROCEDURE:
1. Check all generator breakers are OPEN
2. Reset emergency generator to AUTO
3. Start emergency generator manually if required
4. Close emergency generator breaker
5. Restore essential services power
6. Start main generators one at a time
7. Synchronize and load share generators
8. Restore non-essential loads gradually

LOAD SHARING ADJUSTMENT:
Generator load should be within 10% between units
Procedure:
1. Both generators online and synchronized
2. Adjust load sharing potentiometer on each gen
3. Use kW meters to balance loading
4. Typical loading: 75-85% of rated capacity
5. Check power factor >0.8 on all generators

PROTECTION RELAY SETTINGS:
- Overcurrent: 125% rated current
- Earth fault: 30% rated current  
- Undervoltage: 85% rated voltage
- Overvoltage: 110% rated voltage
- Underfrequency: 47.5Hz
- Overfrequency: 52.5Hz

MONTHLY TESTING:
1. Emergency generator auto-start test
2. Main breaker operation test
3. Protection relay function test
4. Insulation resistance test (>1MΩ)
5. Battery backup system test
6. Shore power changeover test`
    },

    // 04_HYDRAULICS  
    {
      filename: "Naiad_Stabilizer_Manual.pdf",
      path: "04_HYDRAULICS/Stabilizers",
      category: "Hydraulics",
      size: "80MB",
      content: `NAIAD STABILIZER SYSTEM OPERATION MANUAL

FAULT: Stabilizers not responding
SYMPTOMS: System on but no fin movement
TROUBLESHOOTING:
1. Check hydraulic oil level in tank
2. Verify pump motor operation
3. Check system pressure (should be 210 bar)
4. Test gyro sensor input
5. Inspect fin position feedback sensors
6. Check for hydraulic leaks

FAULT: Excessive rolling despite stabilizers on
CAUSES:
1. Fins not extending fully
2. Gyro sensor malfunction  
3. Hydraulic system pressure low
4. Control system not responding to motion
5. Sea conditions exceeding system capacity

SOLUTION:
1. Check fin extension - should be 45° at normal operation
2. Calibrate gyro sensor (System Menu > Calibration)
3. Check hydraulic pressure gauge (normal: 200-220 bar)
4. Test system response in calm conditions first
5. Verify control system settings for vessel loading

HYDRAULIC SYSTEM BLEEDING:
Required after maintenance or air ingress:
1. Ensure hydraulic tank is full
2. Run pump with fins in neutral
3. Operate fins full port then starboard
4. Check for air bubbles in sight glass
5. Repeat until no air visible
6. Check oil level and top up

START-UP PROCEDURE:
1. Check hydraulic oil level
2. Turn on main power
3. Start hydraulic pump (green light)
4. Check system pressure reaches 210 bar
5. Test fin operation with manual controls
6. Activate automatic mode
7. Adjust gain settings for sea conditions

SEASONAL MAINTENANCE:
1. Change hydraulic oil (every 2000 hours)
2. Replace hydraulic filters  
3. Inspect fin assemblies for wear
4. Check all hydraulic connections
5. Test emergency fin retraction system
6. Calibrate gyro and accelerometer sensors
7. Load test hydraulic pump
8. Inspect and grease fin actuator bushings

EMERGENCY FIN RETRACTION:
If hydraulic power lost:
1. Locate manual retraction pump
2. Connect to emergency fitting on deck
3. Pump until fins fully retracted
4. Secure fins in retracted position
5. Do not operate system until hydraulics restored`
    },

    // 05_HVAC
    {
      filename: "Chiller_1_Carrier_Manual.pdf", 
      path: "05_HVAC/Air_Conditioning/Chiller_Units",
      category: "HVAC",
      size: "70MB",
      content: `CARRIER 30XA MARINE CHILLER OPERATION MANUAL

FAULT: Chiller won't start
TROUBLESHOOTING SEQUENCE:
1. Check electrical supply - 400V 3-phase
2. Verify chilled water flow through evaporator
3. Check seawater flow through condenser
4. Examine refrigerant levels
5. Test control panel functions
6. Check safety interlocks

FAULT: High pressure alarm
SYMPTOMS: Compressor shuts down on high pressure
CAUSES:
- Blocked condenser (seawater side)
- Low seawater flow
- High seawater temperature
- Overcharge of refrigerant
- Non-condensable gases in system

SOLUTION:
1. Check seawater strainer - clean if blocked
2. Verify seawater pump operation
3. Check condenser tubes for fouling
4. Monitor refrigerant pressures:
   - Low side: 3.5-5.5 bar
   - High side: 12-16 bar (R134a)
5. If high side >18 bar, investigate condenser cooling

FAULT: Low cooling capacity
SYMPTOMS: Chilled water temperature too high
TROUBLESHOOTING:
1. Check chilled water flow rate (minimum 0.6 m/s)
2. Verify evaporator coil cleanliness
3. Check refrigerant charge level
4. Test compressor capacity control
5. Inspect expansion valve operation
6. Check for air in chilled water system

REFRIGERANT LEAK DETECTION:
1. Visual inspection of all joints
2. Electronic leak detector scan
3. Bubble test with soap solution
4. UV dye inspection (if system has dye)
5. Check oil levels in compressor

SEASONAL MAINTENANCE:
Spring Startup:
1. Check refrigerant levels
2. Test all safety controls
3. Clean condenser tubes (seawater side)
4. Inspect electrical connections
5. Check chilled water treatment

Fall Shutdown (if required):
1. Pump down refrigerant
2. Drain seawater side completely
3. Add antifreeze to chilled water
4. Disconnect electrical supply
5. Cover unit to prevent corrosion

DAILY CHECKS:
- Chilled water supply temperature: 7°C
- Chilled water return temperature: 12°C
- Seawater inlet temperature: <32°C  
- System pressures within normal range
- No unusual noises or vibrations
- Check for water leaks`
    },

    // 06_WATER_SYSTEMS
    {
      filename: "RO_System_SeaRecovery.pdf",
      path: "06_WATER_SYSTEMS/Fresh_Water/Watermaker", 
      category: "Water Systems",
      size: "80MB",
      content: `SEA RECOVERY WATERMAKER OPERATION MANUAL

FAULT: Low water production
NORMAL PRODUCTION: 1500 L/hr at 40 bar pressure
CAUSES:
1. Membrane fouling/scaling
2. Low operating pressure
3. High feed water temperature  
4. Pre-filter blockage
5. Membrane degradation

TROUBLESHOOTING:
1. Check system pressure - should be 40-45 bar
2. Test feed water temperature (<45°C optimal)
3. Check pre-filter pressure drop
4. Monitor product water TDS (should be <500 ppm)
5. Check for air leaks in suction line

FAULT: High TDS in product water
SYMPTOMS: Product water tastes salty, TDS >500 ppm
SOLUTION:
1. Check membrane integrity
2. Verify system pressure adequate (40+ bar)
3. Test for O-ring leaks in pressure vessel
4. Check product water sample valve for leaks
5. May require membrane replacement

DAILY STARTUP PROCEDURE:
1. Check seawater strainer - clean if required
2. Open seawater suction valve
3. Start low pressure pump (prime if required)
4. Check system pressures:
   - Feed: 3-5 bar
   - System: 40-45 bar
   - Concentrate: 38-43 bar
5. Monitor product water quality
6. Adjust flow control valve as needed

MEMBRANE CLEANING PROCEDURE:
Required every 500 hours or when production drops 10%
1. Shutdown system normally
2. Drain all water from system  
3. Prepare cleaning solution (citric acid or alkaline)
4. Circulate cleaning solution for 1 hour
5. Rinse thoroughly with fresh water
6. Return to normal operation
7. Monitor performance improvement

PRESERVATION PROCEDURE:
For shutdown periods >1 week:
1. Flush system with fresh water (30 minutes)
2. Prepare biocide solution (1% sodium metabisulfite)
3. Fill all system components with preservative
4. Tag system "PRESERVED - DO NOT OPERATE"
5. Before restart, flush preservative completely

WEEKLY MAINTENANCE:
1. Check all pressure readings
2. Test product water quality (TDS)
3. Clean seawater strainer
4. Check high pressure pump oil level
5. Inspect all connections for leaks
6. Record operating hours and production
7. Check UV sterilizer lamp operation (if fitted)`
    },

    // 07_SAFETY_SYSTEMS
    {
      filename: "Fire_Panel_Consilium.pdf",
      path: "07_SAFETY_SYSTEMS/Fire_Detection", 
      category: "Safety Systems",
      size: "40MB",
      content: `CONSILIUM FIRE DETECTION SYSTEM MANUAL

FAULT: Detector fault alarm
SYMPTOMS: Specific detector shows fault on panel
TROUBLESHOOTING:
1. Check detector wiring connections
2. Clean detector head (smoke detectors)
3. Test detector manually with test magnet
4. Check loop isolation switches
5. Replace detector if faulty

FAULT: Zone isolation active
SYMPTOMS: Zone shows bypassed on main panel
SOLUTION:
1. Locate zone isolation switch  
2. Check if isolation was intentional (maintenance)
3. If not, investigate detector faults in that zone
4. Reset isolation only after faults cleared
5. Test zone operation after reset

WEEKLY FIRE ALARM TEST:
Every Monday 1000hrs conduct full system test:
1. Test manual call points (different one each week)
2. Activate one smoke detector with test spray
3. Check audible/visual alarms operate
4. Test remote alarm transmission (if fitted)
5. Reset system and log test in fire log book

DETECTOR CLEANING PROCEDURE:
Smoke detectors require cleaning every 6 months:
1. Remove detector from base (twist counterclockwise)
2. Use soft brush to remove dust from chamber
3. Check optical chamber for contamination
4. Clean detector base contacts
5. Reinstall and test operation

CO2 SYSTEM SAFETY:
Before entering spaces after CO2 discharge:
1. Ventilate space for minimum 30 minutes
2. Test atmosphere with gas detector
3. CO2 levels must be <3% before entry
4. Always use buddy system
5. Carry portable gas detector

FIRE PATROL PROCEDURE:
Hourly fire patrols in port (continuous at sea):
1. Check all detector panel zones GREEN
2. Inspect escape routes clear
3. Check fire doors closed  
4. Verify fire equipment accessible
5. Test emergency lighting monthly
6. Check fire hoses for damage

SYSTEM BATTERY TEST:
Monthly battery backup test:
1. Switch to battery mode at main panel
2. Activate test alarm
3. Check battery voltage >22V under load
4. System should operate normally for 24 hours
5. Return to mains power
6. Log test results`
    },

    // 08_GALLEY
    {
      filename: "Range_Molteni_Manual.pdf",
      path: "08_GALLEY/Cooking_Equipment",
      category: "Galley",
      size: "50MB",
      content: `MOLTENI MARINE RANGE OPERATION MANUAL

FAULT: Gas burner won't light
TROUBLESHOOTING:
1. Check gas supply valve open
2. Verify pilot light operation
3. Clean burner ports with wire brush
4. Check thermocouple connection
5. Test gas pressure (minimum 2.5 kPa)
6. Inspect gas supply lines for leaks

FAULT: Oven not heating evenly
SYMPTOMS: Food cooking unevenly, hot spots
SOLUTION:
1. Check oven door seal integrity
2. Verify air circulation fan operation
3. Clean oven interior and ventilation ports
4. Check for blocked air vents
5. Calibrate oven temperature sensor
6. Test heating element operation (electric ovens)

GAS SAFETY PROCEDURES:
Daily checks:
1. Visual inspection of all gas connections
2. Soap test for leaks at joints
3. Check gas solenoid valve operation
4. Test flame failure safety devices
5. Verify ventilation system operation
6. Check LPG alarm system function

DEEP FAT FRYER MAINTENANCE:
1. Daily oil quality check
2. Clean fryer baskets after each use
3. Filter oil daily or when quality deteriorates
4. Clean heating elements weekly
5. Check high temperature safety cutoff
6. Verify ventilation hood operation

WEEKLY CLEANING SCHEDULE:
1. Deep clean all cooking surfaces
2. Degrease ventilation filters
3. Clean gas burner assemblies  
4. Check and clean oven interiors
5. Inspect and clean exhaust ducting
6. Test all safety shutdown systems
7. Check fire suppression system

FIRE SUPPRESSION SYSTEM:
Ansul system activation:
1. Manual pull station activates system
2. Automatic activation on high temperature
3. System discharges wet chemical on cooking surfaces
4. Gas supply automatically shut off
5. Do not reset until fire department inspection

EMERGENCY PROCEDURES:
Gas leak detected:
1. Evacuate galley immediately
2. Shut off main gas supply
3. Do not operate any electrical equipment  
4. Ventilate space thoroughly
5. Do not re-enter until area tested safe
6. Contact gas fitter for inspection

GALLEY FIRE:
1. Activate fire suppression system
2. Evacuate all personnel
3. Shut off gas and electrical supplies
4. Sound general alarm
5. Do not attempt to fight large fires
6. Ensure crew musters at emergency stations`
    }
  ];
};

export default generateFakeManuals;